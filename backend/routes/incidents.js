const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const verifyToken = require('../middleware/auth');

// POST /api/incidents
// Route publique (pas de token) : utilisee par le formulaire de l'agence
router.post('/', async (req, res) =>
{
    const { code_agence, titre, type, priorite, description } = req.body;

    if (!code_agence || !titre || !type || !priorite)
    {
        return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }
    if (!['interne', 'externe'].includes(type))
    {
        return res.status(400).json({ message: 'Type invalide (interne ou externe).' });
    }

    try
    {
        const [agences] = await db.query('SELECT code_agence FROM agence WHERE code_agence = ?', [code_agence]);
        if (agences.length === 0)
        {
            return res.status(404).json({ message: 'Agence introuvable.' });
        }

        // La description est maintenant stockee directement dans l'incident
        const [result] = await db.query(
            `INSERT INTO incident (code_agence, titre, description, type, priorite, etat, date_creation)
             VALUES (?, ?, ?, ?, ?, 'ouvert', NOW())`,
            [code_agence, titre, description || null, type, priorite]
        );

        // Le fil de discussion demarre vide desormais (plus de commentaire automatique)
        res.status(201).json({ message: 'Incident déclaré avec succès.', incident_id: result.insertId });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents/stats
// Route protegee : chiffres pour les cartes du tableau de bord
// IMPORTANT : cette route doit etre declaree AVANT la route GET /:id
// sinon Express confondra "stats" avec un id d'incident
router.get('/stats', verifyToken, async (req, res) =>
{
    try
    {
        const [[ouverts]] = await db.query(`SELECT COUNT(*) AS total FROM incident WHERE etat = 'ouvert'`);
        const [[enCours]] = await db.query(`SELECT COUNT(*) AS total FROM incident WHERE etat = 'en_cours'`);
        const [[urgents]] = await db.query(`SELECT COUNT(*) AS total FROM incident WHERE priorite = 'urgente' AND etat != 'resolu'`);
        const [[resolusCeMois]] = await db.query(`
      SELECT COUNT(*) AS total FROM incident
      WHERE etat = 'resolu'
        AND MONTH(date_resolution) = MONTH(CURRENT_DATE())
        AND YEAR(date_resolution) = YEAR(CURRENT_DATE())
    `);

        res.json({
            incidents_ouverts: ouverts.total,
            en_cours: enCours.total,
            priorite_urgente: urgents.total,
            resolus_ce_mois: resolusCeMois.total,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents
// Route protegee : reservee aux admins connectes
// Filtres optionnels via l'URL : ?etat=ouvert&type=externe&priorite=urgente
router.get('/', verifyToken, async (req, res) =>
{
    const { etat, type, priorite, agence } = req.query;

    try
    {
        // On construit la requete dynamiquement selon les filtres presents
        let sql = `
      SELECT i.*, a.nom AS nom_agence, a.succursale,
             u.nom AS nom_admin, u.prenom AS prenom_admin
      FROM incident i
      JOIN agence a ON i.code_agence = a.code_agence
      LEFT JOIN utilisateur u ON i.traite_par = u.id
      WHERE 1=1
    `;
        const params = [];

        if (etat)
        {
            sql += ' AND i.etat = ?';
            params.push(etat);
        }
        if (type)
        {
            sql += ' AND i.type = ?';
            params.push(type);
        }
        if (priorite)
        {
            sql += ' AND i.priorite = ?';
            params.push(priorite);
        }
        if (agence)
        {
            sql += ' AND (a.nom LIKE ? OR i.code_agence LIKE ?)';
            params.push(`%${agence}%`, `%${agence}%`);
        }

        sql += ' ORDER BY i.date_creation DESC';

        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents/:id
// Route protegee : recupere un incident + son fil de commentaires
router.get('/:id', verifyToken, async (req, res) =>
{
    const { id } = req.params;

    try
    {
        // 1. Recuperer l'incident avec les infos de l'agence et de l'admin assigne
        const [incidents] = await db.query(
            `SELECT i.*, a.nom AS nom_agence, a.succursale, a.telephone, a.email AS email_agence,
              a.plateforme_telephonie,
              u.nom AS nom_admin, u.prenom AS prenom_admin
       FROM incident i
       JOIN agence a ON i.code_agence = a.code_agence
       LEFT JOIN utilisateur u ON i.traite_par = u.id
       WHERE i.id = ?`,
            [id]
        );

        if (incidents.length === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }

        const incident = incidents[0];

        // 2. Recuperer les commentaires lies a cet incident
        const [commentaires] = await db.query(
            `SELECT c.*,
              u.nom AS nom_admin, u.prenom AS prenom_admin,
              ag.nom AS nom_agence_auteur
       FROM commentaire c
       LEFT JOIN utilisateur u ON c.auteur_admin_id = u.id
       LEFT JOIN agence ag ON c.auteur_agence_code = ag.code_agence
       WHERE c.incident_id = ?
       ORDER BY c.date_creation ASC`,
            [id]
        );

        // 3. Renvoyer l'incident avec ses commentaires imbriques
        res.json({
            ...incident,
            commentaires,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/incidents/:id/etat
// Route protegee : change l'etat d'un incident (ouvert / en_cours / resolu)
router.put('/:id/etat', verifyToken, async (req, res) =>
{
    const { id } = req.params;
    const { etat } = req.body;

    const etatsValides = ['ouvert', 'en_cours', 'resolu'];
    if (!etatsValides.includes(etat))
    {
        return res.status(400).json({ message: 'État invalide.' });
    }

    try
    {
        // Si l'incident passe a "resolu", on enregistre aussi la date de resolution
        const dateResolution = etat === 'resolu' ? new Date() : null;

        const [result] = await db.query(
            `UPDATE incident SET etat = ?, date_resolution = ? WHERE id = ?`,
            [etat, dateResolution, id]
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }

        res.json({ message: 'État mis à jour avec succès.' });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/incidents/:id/assigner
// Route protegee : assigne l'incident a l'admin connecte, ou a un autre admin precise
router.put('/:id/assigner', verifyToken, async (req, res) =>
{
    const { id } = req.params;
    const { admin_id } = req.body;

    // Si aucun admin_id n'est fourni, on assigne a la personne actuellement connectee
    // (cas du bouton "S'assigner a moi" de la maquette)
    const idAAssigner = admin_id || req.user.id;

    try
    {
        // Verifier que l'admin cible existe reellement
        const [admins] = await db.query('SELECT id FROM utilisateur WHERE id = ?', [idAAssigner]);
        if (admins.length === 0)
        {
            return res.status(404).json({ message: 'Admin introuvable.' });
        }

        const [result] = await db.query(
            `UPDATE incident SET traite_par = ? WHERE id = ?`,
            [idAAssigner, id]
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }

        res.json({ message: 'Incident assigné avec succès.', assigne_a: idAAssigner });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// POST /api/incidents/:id/commentaires
// Route publique : accepte les commentaires d'admin (avec token) ET d'agence (sans token)
router.post('/:id/commentaires', async (req, res) =>
{
    const { id } = req.params;
    const { contenu, code_agence } = req.body;

    if (!contenu || contenu.trim() === '')
    {
        return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
    }

    try
    {
        const [incidents] = await db.query('SELECT id, code_agence FROM incident WHERE id = ?', [id]);
        if (incidents.length === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }
        const incident = incidents[0];

        const authHeader = req.headers.authorization;

        if (authHeader)
        {
            // Cas 1 : commentaire d'un admin connecte
            const token = authHeader.split(' ')[1];
            let decoded;
            try
            {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err)
            {
                return res.status(401).json({ message: 'Token invalide ou expiré.' });
            }

            const [result] = await db.query(
                `INSERT INTO commentaire (incident_id, auteur_admin_id, contenu, date_creation) VALUES (?, ?, ?, NOW())`,
                [id, decoded.id, contenu]
            );
            return res.status(201).json({ message: 'Commentaire ajouté.', commentaire_id: result.insertId });

        } else
        {
            // Cas 2 : commentaire d'une agence (sans token)
            if (!code_agence)
            {
                return res.status(400).json({ message: 'code_agence requis.' });
            }
            // Securite : une agence ne peut commenter que SES PROPRES incidents
            if (code_agence !== incident.code_agence)
            {
                return res.status(403).json({ message: "Vous ne pouvez commenter que vos propres incidents." });
            }

            const [result] = await db.query(
                `INSERT INTO commentaire (incident_id, auteur_agence_code, contenu, date_creation) VALUES (?, ?, ?, NOW())`,
                [id, code_agence, contenu]
            );
            return res.status(201).json({ message: 'Commentaire ajouté.', commentaire_id: result.insertId });
        }
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;