// Importation des librairies
const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const db = require('./db');

const app = express();
// N'accepte les requetes que depuis le frontend (evite qu'un site tiers appelle notre API depuis le navigateur d'un admin connecte)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const incidentsRoutes = require('./routes/incidents');
app.use('/api/incidents', incidentsRoutes);

const agencesRoutes = require('./routes/agences');
app.use('/api/agences', agencesRoutes);

const utilisateursRoutes = require('./routes/utilisateurs');
app.use('/api/utilisateurs', utilisateursRoutes);

const espaceAgenceRoutes = require('./routes/espaceAgence');
app.use('/api/espace-agence', espaceAgenceRoutes);

app.get('/api/test', (req, res) =>
{
    res.json({ message: 'Le serveur backend fonctionne !' });
});

// Route de test : verifie que la connexion MySQL fonctionne
app.get('/api/test-db', async (req, res) =>
{
    try
    {
        const [rows] = await db.query('SELECT COUNT(*) AS nombre_agences FROM agence');
        res.json({ message: 'Connexion MySQL reussie !', nombre_agences: rows[0].nombre_agences });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur de connexion MySQL', erreur: error.message });
    }
});

// Gestionnaire d'erreurs global : transforme les erreurs Multer (ex: fichier trop volumineux)
// en reponse JSON propre, au lieu de la page d'erreur HTML par defaut d'Express
app.use((err, req, res, next) =>
{
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
    {
        return res.status(400).json({ message: 'Fichier trop volumineux (5 Mo maximum).' });
    }
    next(err);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
{
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});