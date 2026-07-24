const express = require('express');
const db = require('../db');

const router = express.Router();
const verifyToken = require('../middleware/auth');

// GET /api/utilisateurs
// Route protegee : liste des admins, filtrable par nom/prenom/matricule via ?recherche=
router.get('/', verifyToken, async (req, res) =>
{
    const { recherche } = req.query;

    try
    {
        let sql = 'SELECT id, nom, prenom, matricule, role FROM utilisateur WHERE 1=1';
        const params = [];

        if (recherche)
        {
            sql += ' AND (nom LIKE ? OR prenom LIKE ? OR matricule LIKE ?)';
            params.push(`%${recherche}%`, `%${recherche}%`, `%${recherche}%`);
        }

        sql += ' ORDER BY nom ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;
