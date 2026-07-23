// Importation des librairies
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
{
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});