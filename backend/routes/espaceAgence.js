const express = require('express');
const db = require('../db');

const router = express.Router();

// Toutes les routes ici sont PUBLIQUES (pas de token) : c'est l'espace agence,
// accessible uniquement via le lien unique contenant le code_agence (pas de compte agence).

// GET /api/espace-agence/:code
// Infos de base de l'agence, pour l'identite affichee en haut de sa page d'accueil
router.get('/:code', async (req, res) =>
{
    const { code } = req.params;

    try
    {
        const [rows] = await db.query(
            'SELECT code_agence, nom, succursale FROM agence WHERE code_agence = ?',
            [code]
        );

        if (rows.length === 0)
        {
            return res.status(404).json({ message: 'Agence introuvable.' });
        }

        res.json(rows[0]);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/espace-agence/:code/stats
// Nombre de tickets ouverts / en cours / resolus, uniquement pour cette agence
router.get('/:code/stats', async (req, res) =>
{
    const { code } = req.params;

    try
    {
        const [[ouverts]] = await db.query(
            `SELECT COUNT(*) AS total FROM incident WHERE code_agence = ? AND etat = 'ouvert'`,
            [code]
        );
        const [[enCours]] = await db.query(
            `SELECT COUNT(*) AS total FROM incident WHERE code_agence = ? AND etat = 'en_cours'`,
            [code]
        );
        const [[resolus]] = await db.query(
            `SELECT COUNT(*) AS total FROM incident WHERE code_agence = ? AND etat = 'resolu'`,
            [code]
        );

        res.json({
            ouverts: ouverts.total,
            en_cours: enCours.total,
            resolus: resolus.total,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/espace-agence/:code/incidents-recents
// Les tickets les plus recents de cette agence, tous etats confondus (limite a 3)
router.get('/:code/incidents-recents', async (req, res) =>
{
    const { code } = req.params;

    try
    {
        const [rows] = await db.query(
            `SELECT id, titre, type, priorite, etat, date_creation
       FROM incident
       WHERE code_agence = ?
       ORDER BY date_creation DESC
       LIMIT 3`,
            [code]
        );

        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/espace-agence/:code/tickets/:id
// Detail d'un ticket + son fil de commentaires — uniquement si ce ticket appartient bien
// a l'agence "code" de l'URL (empeche de consulter le ticket d'une autre agence en devinant l'id)
router.get('/:code/tickets/:id', async (req, res) =>
{
    const { code, id } = req.params;

    try
    {
        const [incidents] = await db.query(
            `SELECT i.*, a.nom AS nom_agence, a.succursale
       FROM incident i
       JOIN agence a ON i.code_agence = a.code_agence
       WHERE i.id = ? AND i.code_agence = ?`,
            [id, code]
        );

        if (incidents.length === 0)
        {
            return res.status(404).json({ message: 'Ticket introuvable.' });
        }

        const incident = incidents[0];

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

        res.json({ ...incident, commentaires });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;
