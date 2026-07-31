const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const verifyToken = require('../middleware/auth');
const { envoyerMail } = require('../services/mailer');

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
        // Stats globales (sante du reseau, pas propres a un admin en particulier)
        const [[ouverts]] = await db.query(`SELECT COUNT(*) AS total FROM incident WHERE etat = 'ouvert'`);
        const [[urgents]] = await db.query(`SELECT COUNT(*) AS total FROM incident WHERE priorite = 'urgente' AND etat != 'resolu'`);

        // Stats personnalisees (propres a l'admin connecte, plus actionnables au quotidien
        // qu'un chiffre global sur tout le reseau)
        const [[mesEnCours]] = await db.query(
            `SELECT COUNT(*) AS total FROM incident WHERE etat = 'en_cours' AND traite_par = ?`,
            [req.user.id]
        );
        const [[mesResolusCeMois]] = await db.query(
            `SELECT COUNT(*) AS total FROM incident
       WHERE etat = 'resolu' AND traite_par = ?
         AND MONTH(date_resolution) = MONTH(CURRENT_DATE())
         AND YEAR(date_resolution) = YEAR(CURRENT_DATE())`,
            [req.user.id]
        );

        res.json({
            incidents_ouverts: ouverts.total,
            priorite_urgente: urgents.total,
            mes_tickets_en_cours: mesEnCours.total,
            mes_tickets_resolus_ce_mois: mesResolusCeMois.total,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents/stats-detaillees
// Route protegee : stats avancees pour enrichir le dashboard
router.get('/stats-detaillees', verifyToken, async (req, res) =>
{
    try
    {
        // Temps moyen de resolution (en heures), uniquement sur les incidents resolus
        // on calcule la difference entre date_creation et date_resolution, en minutes (puis en heures cote frontend)
        const [[tempsResolution]] = await db.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, date_creation, date_resolution)) AS minutes_moyennes
      FROM incident
      WHERE etat = 'resolu' AND date_resolution IS NOT NULL
    `);

        // Repartition par type
        const [parType] = await db.query(`
      SELECT type, COUNT(*) AS total FROM incident GROUP BY type
    `);

        // Repartition par succursale (triee, les plus impactees en premier)
        const [parSuccursale] = await db.query(`
      SELECT a.succursale, COUNT(*) AS total
      FROM incident i
      JOIN agence a ON i.code_agence = a.code_agence
      GROUP BY a.succursale
      ORDER BY total DESC
    `);

        res.json({
            temps_resolution_minutes: tempsResolution.minutes_moyennes,
            par_type: parType,
            par_succursale: parSuccursale,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents
// Route protegee : reservee aux admins connectes
// Filtres optionnels via l'URL : ?etat=ouvert&type=externe&priorite=urgente&date=2026-07-24&tri=asc&assigne=moi
router.get('/', verifyToken, async (req, res) =>
{
    const { etat, type, priorite, agence, date, tri, assigne } = req.query;

    try
    {
        // On construit la requete dynamiquement selon les filtres presents
        // "nouveau" : soit un message d'agence existe et n'a pas encore ete lu par l'admin assigne
        // (meme condition que la cloche /commentaires-recents), soit le ticket vient d'etre
        // (re)assigne et l'admin ne l'a pas encore ouvert depuis (derniere_lecture remise a NULL
        // par PUT /:id/assigner) — ce deuxieme cas couvre l'assignation/reassignation sans message.
        let sql = `
      SELECT i.*, a.nom AS nom_agence, a.succursale,
             u.nom AS nom_admin, u.prenom AS prenom_admin,
             (
               EXISTS (
                 SELECT 1 FROM commentaire c
                 WHERE c.incident_id = i.id
                   AND c.auteur_agence_code IS NOT NULL
                   AND (i.derniere_lecture IS NULL OR c.date_creation > i.derniere_lecture)
               )
               OR (i.traite_par IS NOT NULL AND i.derniere_lecture IS NULL)
             ) AS nouveau
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
            sql += ' AND (a.nom LIKE ? OR i.code_agence LIKE ? OR i.titre LIKE ?)';
            params.push(`%${agence}%`, `%${agence}%`, `%${agence}%`);
        }
        if (date)
        {
            sql += ' AND DATE(i.date_creation) = ?';
            params.push(date);
        }
        if (assigne === 'moi')
        {
            sql += ' AND i.traite_par = ?';
            params.push(req.user.id);
        }

        // Tri par date de declaration, ASC ou DESC (DESC = plus recent en premier, par defaut)
        const direction = tri === 'asc' ? 'ASC' : 'DESC';
        sql += ` ORDER BY i.date_creation ${direction}`;

        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/incidents/commentaires-recents
// Route protegee : derniers messages d'agence sur LES TICKETS DE L'ADMIN CONNECTE uniquement
// (evite de notifier tout le monde pour chaque reponse sur un ticket qui ne les concerne pas)
// IMPORTANT : doit etre declaree AVANT la route GET /:id, meme raison que /stats
router.get('/commentaires-recents', verifyToken, async (req, res) =>
{
    try
    {
        const [rows] = await db.query(`
      SELECT c.id, c.incident_id, c.contenu, c.date_creation,
             a.nom AS nom_agence, i.titre
      FROM commentaire c
      JOIN incident i ON c.incident_id = i.id
      JOIN agence a ON c.auteur_agence_code = a.code_agence
      WHERE c.auteur_agence_code IS NOT NULL
        AND i.traite_par = ?
        AND (i.derniere_lecture IS NULL OR c.date_creation > i.derniere_lecture)
      ORDER BY c.date_creation DESC
      LIMIT 30
    `, [req.user.id]);

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

// PUT /api/incidents/:id/lu
// Route protegee : marque le ticket comme lu par l'admin assigne (appelee quand il ouvre le ticket)
router.put('/:id/lu', verifyToken, async (req, res) =>
{
    const { id } = req.params;

    try
    {
        // On ne met a jour que si c'est bien l'admin assigne qui consulte le ticket
        // (un admin qui n'est pas traite_par ne peut pas "marquer comme lu" un ticket qui n'est pas le sien)
        const [result] = await db.query(
            `UPDATE incident SET derniere_lecture = NOW() WHERE id = ? AND traite_par = ?`,
            [id, req.user.id]
        );

        res.json({ message: 'Ticket marqué comme lu.', mis_a_jour: result.affectedRows > 0 });
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
        // Seul l'admin assigne peut changer l'etat de ce ticket (aucune exception pour le
        // superadmin ici : contrairement a la reassignation, marquer un ticket "resolu" est une
        // affirmation technique que seul l'admin qui le traite reellement peut faire — le
        // superadmin doit d'abord se l'assigner s'il veut agir dessus).
        const [incidentsActuels] = await db.query('SELECT traite_par FROM incident WHERE id = ?', [id]);
        if (incidentsActuels.length === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }

        if (incidentsActuels[0].traite_par !== req.user.id)
        {
            return res.status(403).json({ message: "Vous devez d'abord vous assigner ce ticket pour pouvoir changer son état." });
        }

        // Si l'incident passe a "resolu", on enregistre aussi la date de resolution
        const dateResolution = etat === 'resolu' ? new Date() : null;

        // Repasser a "ouvert" signifie relacher le ticket (plus personne dessus) : partout
        // ailleurs dans l'appli, "ouvert" veut dire non-assigne (cloche, stats, auto-passage
        // en_cours a l'assignation) — donc on vide traite_par pour rester coherent.
        // (derniere_lecture n'a pas besoin d'etre touchee ici : elle sera de toute facon
        // reinitialisee par PUT /:id/assigner quand un admin reprendra ce ticket)
        const traiteParMisAJour = etat === 'ouvert' ? null : req.user.id;

        const [result] = await db.query(
            `UPDATE incident SET etat = ?, date_resolution = ?, traite_par = ? WHERE id = ?`,
            [etat, dateResolution, traiteParMisAJour, id]
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
        // Un admin ne peut reassigner que les tickets deja assignes a lui-meme (ou non assignes,
        // cas du "s'assigner a moi"). Le superadmin, lui, peut reassigner n'importe quel ticket,
        // pour pouvoir rééquilibrer la charge de travail entre admins.
        const [incidentsActuels] = await db.query('SELECT traite_par FROM incident WHERE id = ?', [id]);
        if (incidentsActuels.length === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }
        const traiteParActuel = incidentsActuels[0].traite_par;

        if (
            req.user.role !== 'superadmin' &&
            traiteParActuel !== null &&
            traiteParActuel !== req.user.id
        )
        {
            return res.status(403).json({ message: 'Vous ne pouvez réassigner que vos propres tickets.' });
        }

        // Verifier que l'admin cible existe reellement (et recuperer son email pour la notification)
        const [admins] = await db.query('SELECT id, nom, prenom, email FROM utilisateur WHERE id = ?', [idAAssigner]);
        if (admins.length === 0)
        {
            return res.status(404).json({ message: 'Admin introuvable.' });
        }
        const admin = admins[0];

        // On reinitialise derniere_lecture : le nouvel admin doit voir tout le fil comme non lu
        // Et si le ticket etait "ouvert" (personne dessus), l'assignation le fait passer "en_cours"
        // (mais on ne touche pas a etat s'il etait deja en_cours ou resolu)
        // derniere_maj : l'assignation est aussi une "nouveaute" pour l'agence (quelqu'un s'en occupe)
        const [result] = await db.query(
            `UPDATE incident
             SET traite_par = ?, derniere_lecture = NULL, derniere_maj = NOW(),
                 etat = IF(etat = 'ouvert', 'en_cours', etat)
             WHERE id = ?`,
            [idAAssigner, id]
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Incident introuvable.' });
        }

        // Notifications par email (ne font rien tant que le SMTP n'est pas configure, voir mailer.js) :
        // a l'admin desormais en charge, et a l'agence pour la rassurer que quelqu'un s'en occupe.
        const [[incidentInfo]] = await db.query(
            `SELECT i.titre, i.code_agence, a.email AS email_agence, a.nom AS nom_agence
       FROM incident i
       JOIN agence a ON i.code_agence = a.code_agence
       WHERE i.id = ?`,
            [id]
        );

        if (admin.email)
        {
            await envoyerMail(
                admin.email,
                `TeleTrack - Ticket #${id} vous a été assigné`,
                `Bonjour ${admin.prenom || ''} ${admin.nom},\n\nLe ticket #${id} (${incidentInfo?.titre || 'sans titre'}) vous a été assigné.\nConnectez-vous à TeleTrack pour le consulter.`
            );
        }

        if (incidentInfo?.email_agence)
        {
            await envoyerMail(
                incidentInfo.email_agence,
                `TeleTrack - Votre ticket #${id} est pris en charge`,
                `Bonjour,\n\nVotre ticket #${id} (${incidentInfo.titre || 'sans titre'}) est désormais pris en charge par ${admin.prenom || ''} ${admin.nom}.\nVous pouvez suivre son évolution et échanger avec l'admin directement depuis la page de votre ticket.`
            );
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
        const [incidents] = await db.query('SELECT id, code_agence, traite_par FROM incident WHERE id = ?', [id]);
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

            // Seul l'admin assigne au ticket peut y repondre (il doit d'abord s'assigner)
            if (incident.traite_par !== decoded.id)
            {
                return res.status(403).json({ message: "Vous devez d'abord vous assigner ce ticket pour pouvoir répondre." });
            }

            const [result] = await db.query(
                `INSERT INTO commentaire (incident_id, auteur_admin_id, contenu, date_creation) VALUES (?, ?, ?, NOW())`,
                [id, decoded.id, contenu]
            );

            // Un message d'admin est une "nouveaute" pour l'agence (notification in-app cote agence)
            await db.query('UPDATE incident SET derniere_maj = NOW() WHERE id = ?', [id]);

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