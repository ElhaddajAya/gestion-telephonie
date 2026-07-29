const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../../db');

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

        // Un compte desactive par un superadmin ne peut plus se connecter
        if (!user.actif)
        {
            return res.status(403).json({ message: 'Ce compte a été désactivé. Contactez un superadmin.' });
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
                photo: user.photo,
                doit_changer_mot_de_passe: !!user.doit_changer_mot_de_passe,
            },
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;

const jwtMiddleware = require('../../middleware/auth'); // on va le créer juste après

// PUT /api/auth/change-password (utilisateur déjà connecté)
router.put('/change-password', jwtMiddleware, async (req, res) =>
{
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8)
    {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    try
    {
        const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);

        await db.query(
            'UPDATE utilisateur SET mot_de_passe = ?, doit_changer_mot_de_passe = 0 WHERE id = ?',
            [hash, req.user.id]
        );

        res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/auth/me
// Route protegee : profil complet de l'utilisateur connecte, pour la page "Mon profil"
router.get('/me', jwtMiddleware, async (req, res) =>
{
    try
    {
        const [rows] = await db.query(
            'SELECT id, nom, prenom, matricule, email, role, photo FROM utilisateur WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0)
        {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        res.json(rows[0]);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/auth/profil
// Route protegee : modifie son propre nom/prenom/email (matricule et role ne sont pas modifiables ici)
router.put('/profil', jwtMiddleware, async (req, res) =>
{
    const { nom, prenom, email } = req.body;

    if (!nom || !prenom)
    {
        return res.status(400).json({ message: 'Nom et prénom obligatoires.' });
    }

    try
    {
        await db.query(
            'UPDATE utilisateur SET nom = ?, prenom = ?, email = ? WHERE id = ?',
            [nom, prenom, email || null, req.user.id]
        );

        const [rows] = await db.query(
            'SELECT id, nom, prenom, matricule, email, role, photo FROM utilisateur WHERE id = ?',
            [req.user.id]
        );

        res.json({ message: 'Profil mis à jour avec succès.', user: rows[0] });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// Stockage sur disque pour les photos de profil : contrairement a l'import Excel (traite en memoire
// puis jete), une photo doit rester disponible pour etre reaffichee plus tard
const dossierAvatars = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(dossierAvatars, { recursive: true });

const TYPES_IMAGE_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadAvatar = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, dossierAvatars),
        filename: (req, file, cb) => cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo : largement suffisant pour un avatar
});

// POST /api/auth/photo
// Route protegee : upload/remplacement de la photo de profil de l'utilisateur connecte
router.post('/photo', jwtMiddleware, uploadAvatar.single('photo'), async (req, res) =>
{
    if (!req.file)
    {
        return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }
    if (!TYPES_IMAGE_ACCEPTES.includes(req.file.mimetype))
    {
        fs.unlink(req.file.path, () => {}); // fichier refuse, on nettoie
        return res.status(400).json({ message: 'Format invalide : seules les images JPEG, PNG ou WEBP sont acceptées.' });
    }

    try
    {
        // On supprime l'ancienne photo (si elle existe) pour ne pas accumuler des fichiers orphelins
        const [[utilisateurActuel]] = await db.query('SELECT photo FROM utilisateur WHERE id = ?', [req.user.id]);
        if (utilisateurActuel?.photo)
        {
            fs.unlink(path.join(dossierAvatars, utilisateurActuel.photo), () => {});
        }

        await db.query('UPDATE utilisateur SET photo = ? WHERE id = ?', [req.file.filename, req.user.id]);

        res.json({ message: 'Photo mise à jour avec succès.', photo: req.file.filename });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});