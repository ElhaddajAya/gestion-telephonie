const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) =>
{
    const { matricule, mot_de_passe } = req.body;

    if (!matricule || !mot_de_passe)
    {
        return res.status(400).json({ message: 'Matricule et mot de passe requis.' });
    }

    try
    {
        // 1. Chercher l'utilisateur par matricule
        const [rows] = await db.query('SELECT * FROM utilisateur WHERE matricule = ?', [matricule]);

        if (rows.length === 0)
        {
            return res.status(401).json({ message: 'Matricule ou mot de passe incorrect.' });
        }

        const user = rows[0];

        // 2. Comparer le mot de passe envoye avec le mot de passe hache en base
        const motDePasseValide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!motDePasseValide)
        {
            return res.status(401).json({ message: 'Matricule ou mot de passe incorrect.' });
        }

        // 3. Creer un token qui prouve que l'utilisateur est connecte
        const token = jwt.sign(
            { id: user.id, matricule: user.matricule, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 4. Renvoyer le token + les infos utiles (jamais le mot de passe)
        res.json({
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role,
                doit_changer_mot_de_passe: !!user.doit_changer_mot_de_passe,
            },
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;