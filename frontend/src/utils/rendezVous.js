import { apiRequest } from "./api";

const ENDPOINT = '/rendez-vous';

export const createRendezVous = (rendezVousData) => {
    return apiRequest(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(rendezVousData)
    });
};

export const getAllRendezVous = () => {
    return apiRequest(ENDPOINT);
};

export const getRendezVousById = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`);
};

export const updateRendezVous = (id, rendezVousData) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rendezVousData)
    });
};

/**
 * Met à jour le statut d'un rendez-vous.
 * @param {number} id L'identifiant du rendez-vous
 * @param {string} statut_rdv Le statut du rendez-vous
 * @returns {Promise<void>} La promesse de la requête
 */
export const updateStatutRendezVous = (id, statut_rdv) => {
    return apiRequest(`${ENDPOINT}/${id}/statut`, {
        method: 'PUT',
        body: JSON.stringify({ statut_rdv })
    });
};

export const deleteRendezVous = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
};

export const getRendezVousByPatientId = (idPatient) => {
    return apiRequest(`${ENDPOINT}/patient/${idPatient}`);
};

export const getRendezVousByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`${ENDPOINT}/professionnel/${idProfessionnel}`);
};

export const getRendezVousByCentreId = (idCentre) => {
    return apiRequest(`${ENDPOINT}/centre/${idCentre}`);
};

export const getRecentRendezVous = (limit = 3) => {
    return apiRequest(`${ENDPOINT}/recent?limit=${limit}`);
};

export const countRendezVousByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`${ENDPOINT}/professionnel/${idProfessionnel}/count`);
};

export const countTodayRendezVousByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`${ENDPOINT}/professionnel/${idProfessionnel}/today/count`);
};

export const countTodayRendezVous = () => {
    return apiRequest(`${ENDPOINT}/today/count`);
};

export const getArrivedTodayRendezVous = () => {
    return apiRequest(`${ENDPOINT}/arrived-today`);
};

export const getRendezVousByStatus = (status) => {
    return apiRequest(`${ENDPOINT}/status/${status}`);
};

export const getRendezVousByStatusToday = (id_professionnel, status) => {
    return apiRequest(`${ENDPOINT}/professionnel/${id_professionnel}/status/${status}/today`);
};

export const getTodayRendezVousWithPatient = (idProfessionnel) => {
    return apiRequest(`${ENDPOINT}/professionnel/${idProfessionnel}/today-with-patient`);
};

export const getTodayRendezVousWithDetails = (date) => {
    let url = `${ENDPOINT}/today-with-details`;
    if (date) url += `?date=${date}`;
    return apiRequest(url);
};

export const getRendezVousByPeriodWithDetails = (period) => {
    return apiRequest(`${ENDPOINT}/period-with-details?period=${period}`);
};
