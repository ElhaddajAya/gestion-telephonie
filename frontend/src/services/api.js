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

// Si le token est invalide/expire (401), on nettoie la session et on renvoie vers le login
// plutot que de laisser chaque page planter avec des donnees manquantes
api.interceptors.response.use(
    (response) => response,
    (error) =>
    {
        if (error.response?.status === 401 && window.location.pathname !== '/login')
        {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;