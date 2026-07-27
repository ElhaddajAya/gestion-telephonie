const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const verifyToken = require('../middleware/auth');

// Reserve certaines routes (creation, edition, reinitialisation, statut) au superadmin uniquement.
// La liste (GET /) reste accessible a tous les admins connectes : elle sert aussi au choix
// de l'admin lors d'une reassignation de ticket (ModalReassigner.jsx).
function verifierSuperadmin(req, res, next)
{
    if (req.user.role !== 'superadmin')
    {
        return res.status(403).json({ message: 'Réservé au superadmin.' });
    }
    next();
}

// Genere un mot de passe temporaire aleatoire (12 caracteres alphanumeriques)
function genererMotDePasseTemporaire()
{
    return crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

// GET /api/utilisateurs
// Route protegee : liste des admins, filtrable par nom/prenom/matricule via ?recherche=
// et par ?actif=1 (utilise par ModalReassigner : on ne propose que des admins actifs)
router.get('/', verifyToken, async (req, res) =>
{
    const { recherche, actif } = req.query;

    try
    {
        let sql = 'SELECT id, nom, prenom, matricule, email, role, actif FROM utilisateur WHERE 1=1';
        const params = [];

        if (recherche)
        {
            sql += ' AND (nom LIKE ? OR prenom LIKE ? OR matricule LIKE ?)';
            params.push(`%${recherche}%`, `%${recherche}%`, `%${recherche}%`);
        }
        if (actif !== undefined)
        {
            sql += ' AND actif = ?';
            params.push(actif === '1' || actif === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY nom ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// POST /api/utilisateurs
// Route protegee (superadmin) : cree un nouveau compte admin ou superadmin
router.post('/', verifyToken, verifierSuperadmin, async (req, res) =>
{
    const { matricule, nom, prenom, email, role } = req.body;

    if (!matricule || !nom || !prenom || !role)
    {
        return res.status(400).json({ message: 'Matricule, nom, prénom et rôle sont obligatoires.' });
    }
    if (!['admin', 'superadmin'].includes(role))
    {
        return res.status(400).json({ message: 'Rôle invalide.' });
    }

    try
    {
        const [existants] = await db.query('SELECT id FROM utilisateur WHERE matricule = ?', [matricule]);
        if (existants.length > 0)
        {
            return res.status(409).json({ message: 'Ce matricule est déjà utilisé.' });
        }

        const motDePasseTemporaire = genererMotDePasseTemporaire();
        const hash = await bcrypt.hash(motDePasseTemporaire, 10);

        const [result] = await db.query(
            `INSERT INTO utilisateur (matricule, nom, prenom, email, role, mot_de_passe, doit_changer_mot_de_passe, actif)
             VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
            [matricule, nom, prenom, email || null, role, hash]
        );

        res.status(201).json({
            message: 'Compte créé avec succès.',
            utilisateur: { id: result.insertId, matricule, nom, prenom, email: email || null, role, actif: 1 },
            mot_de_passe_temporaire: motDePasseTemporaire,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/utilisateurs/:id
// Route protegee (superadmin) : modifie nom/prenom/email/role d'un compte existant
router.put('/:id', verifyToken, verifierSuperadmin, async (req, res) =>
{
    const { id } = req.params;
    const { nom, prenom, email, role } = req.body;

    if (!nom || !prenom || !role)
    {
        return res.status(400).json({ message: 'Nom, prénom et rôle sont obligatoires.' });
    }
    if (!['admin', 'superadmin'].includes(role))
    {
        return res.status(400).json({ message: 'Rôle invalide.' });
    }
    // Un superadmin ne peut pas changer son propre role (evite de se retrouver bloque par erreur)
    if (Number(id) === req.user.id && role !== req.user.role)
    {
        return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle.' });
    }

    try
    {
        const [result] = await db.query(
            'UPDATE utilisateur SET nom = ?, prenom = ?, email = ?, role = ? WHERE id = ?',
            [nom, prenom, email || null, role, id]
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Compte introuvable.' });
        }

        res.json({ message: 'Compte mis à jour avec succès.' });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/utilisateurs/:id/statut
// Route protegee (superadmin) : active ou desactive un compte (jamais de suppression definitive,
// pour garder l'historique des tickets traites par ce compte)
router.put('/:id/statut', verifyToken, verifierSuperadmin, async (req, res) =>
{
    const { id } = req.params;
    const { actif } = req.body;

    if (typeof actif !== 'boolean')
    {
        return res.status(400).json({ message: 'Le champ actif (true/false) est requis.' });
    }
    if (Number(id) === req.user.id)
    {
        return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    try
    {
        const [cibles] = await db.query('SELECT role FROM utilisateur WHERE id = ?', [id]);
        if (cibles.length === 0)
        {
            return res.status(404).json({ message: 'Compte introuvable.' });
        }

        // Si on desactive un superadmin, il doit en rester au moins un autre actif
        if (!actif && cibles[0].role === 'superadmin')
        {
            const [[{ total }]] = await db.query(
                `SELECT COUNT(*) AS total FROM utilisateur WHERE role = 'superadmin' AND actif = 1 AND id != ?`,
                [id]
            );
            if (total === 0)
            {
                return res.status(400).json({ message: 'Impossible : il doit rester au moins un superadmin actif.' });
            }
        }

        await db.query('UPDATE utilisateur SET actif = ? WHERE id = ?', [actif ? 1 : 0, id]);

        res.json({ message: actif ? 'Compte réactivé.' : 'Compte désactivé.' });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/utilisateurs/:id/reinitialiser-mot-de-passe
// Route protegee (superadmin) : genere un nouveau mot de passe temporaire pour ce compte
router.put('/:id/reinitialiser-mot-de-passe', verifyToken, verifierSuperadmin, async (req, res) =>
{
    const { id } = req.params;

    try
    {
        const motDePasseTemporaire = genererMotDePasseTemporaire();
        const hash = await bcrypt.hash(motDePasseTemporaire, 10);

        const [result] = await db.query(
            'UPDATE utilisateur SET mot_de_passe = ?, doit_changer_mot_de_passe = 1 WHERE id = ?',
            [hash, id]
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Compte introuvable.' });
        }

        res.json({ message: 'Mot de passe réinitialisé.', mot_de_passe_temporaire: motDePasseTemporaire });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;
