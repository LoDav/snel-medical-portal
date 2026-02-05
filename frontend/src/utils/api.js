/**
 * code by @lorddavid alias @ôkami
 * 
 * Local serveur IP:
 * 'http://localhost:3000/api'
 * 
 * network serveur IP snel 01
 * http://192.168.1.124:3000/api
 * 
 * 
 * network serveur snel 02
 * http://10.1.44.195:3000/api
 * 
 * http://10.1.44.114:3000/api
 * 
 */

import { getAuthHeader, logout } from './auth.js';


const API_BASE_URL = 'http://localhost:3000/api';


// Fonction pour faire des requêtes API avec authentification automatique
// Cette fonction est genial
export const apiRequest = async (endpoint, options = {}) => {
    const isLogin = endpoint.startsWith('/auth/login');

    const defaultHeaders = {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(isLogin ? {} : getAuthHeader())
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        keepalive: options.keepalive || false
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        console.warn(response.status);
        if (response.status === 401 && !isLogin) {
            logout();
            window.location.href = '/';
            throw new Error('Token invalide ou expiré');
        }

        if (response.status === 403 && !isLogin) {
            logout();
            window.location.href = '/logout';
            throw new Error('Connection non autorisé');
        }

        if (!response.ok) {
            // window.location.href = '/';
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
};

// export const getProfessionnelsSante = () => {
//     return apiRequest('/professionnels-sante/users');
// };

// export default api;
