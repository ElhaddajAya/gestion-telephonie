import axios from 'axios';

// Instance axios dediee a l'espace agence (routes publiques, sans compte).
// Contrairement a api.js, celle-ci n'ajoute JAMAIS le token admin : si un admin est
// connecte sur le meme navigateur, son token ne doit surtout pas se retrouver attache
// a une requete de l'espace agence (ex: un commentaire serait alors attribue a l'admin
// au lieu de l'agence).
const apiPublic = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

export default apiPublic;
