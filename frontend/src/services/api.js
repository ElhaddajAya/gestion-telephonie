import axios from 'axios';

// Instance axios preconfiguree avec l'adresse de base du backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Avant chaque requete, on ajoute automatiquement le token si on est connecte
api.interceptors.request.use((config) =>
{
    const token = localStorage.getItem('token');
    if (token)
    {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;