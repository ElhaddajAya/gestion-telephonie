// Ce fichier centralise la connexion a la base de donnees MySQL
// pour que tous les autres fichiers puissent l'utiliser sans la recreer

const mysql = require('mysql2');
require('dotenv').config();

// Creation du pool de connexions
// Un "pool" gere plusieurs connexions en meme temps, plus efficace qu'une seule connexion
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// On exporte une version "promise" pour pouvoir utiliser async/await plus tard
const promisePool = pool.promise();

module.exports = promisePool;