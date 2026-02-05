// Utilitaires pour la gestion de l'authentification

import { apiRequest } from "./api";

// Récupérer le token stocké
export const getToken = () => {
    return localStorage.getItem('authToken');
}

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true' && getToken();
}

// Récupérer les informations utilisateur
export const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Stocker le token et les informations utilisateur
export const setAuthData = (token, userInfo = null) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('isAuthenticated', 'true');

    if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
}

// Supprimer toutes les données d'authentification
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userInfo');
}

// Créer un header d'autorisation pour les requêtes API
export const getAuthHeader = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Vérifier si le token est expiré (si votre API retourne une date d'expiration)
export const isTokenExpired = () => {
    // Implémentez cette fonction selon votre logique d'expiration
    // Par exemple, si vous stockez une date d'expiration
    const expirationDate = localStorage.getItem('tokenExpiration');
    if (expirationDate) {
        return new Date() > new Date(expirationDate);
    }
    return false;
}


export const login = (credentials) => {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
};

export const register = (userData) => {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};