import { apiRequest } from "./api";

export const getAllMedecins = () => {
    return apiRequest('/auth/medecins');
};

export const getCentreByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`/auth/centre/${idProfessionnel}`);
};

export const countOnlineProfessionals = () => {
    return apiRequest('/auth/online/count');
};

export const getOnlineMedecins = () => {
    return apiRequest('/auth/online/medecins');
};

export const countOnlineInfirmiers = () => {
    return apiRequest('/auth/online/infirmier/count');
};

/**
 * on mettra en ligne ou hors ligne un professionnel de type medecin
 * @param {*} idProfessionnel 
 * @param {*} isOnlineStatus 
 * @returns 
 * 
 */
export const updateOnlineStatus = (idProfessionnel, isOnlineStatus, options = {}) => {
    return apiRequest(`/auth/set-online-status/${idProfessionnel}`, {
        method: 'PUT',
        body: JSON.stringify({ is_online: isOnlineStatus }),
        ...options
    });
};

export const getOnlineInfirmiers = () => {
    return apiRequest('/auth/online/infirmier');
};

export const getProfessionnelById = (id) => {
    return apiRequest(`/auth/professionnels/${id}`);
};

/**
 * Récupère tous les professionnels de santé en ligne (tous types confondus)
 * @returns {Promise} Liste de tous les professionnels en ligne
 */
export const getAllOnlineProfessionals = () => {
    return apiRequest('/auth/online');
};
