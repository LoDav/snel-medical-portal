import { apiRequest } from "./api";

const ENDPOINT = '/prelevements-examens';

export const createPrelevementExamen = (prelevementData) => {
    console.log(prelevementData);
    
    return apiRequest(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(prelevementData)
    });
};

export const getAllPrelevementsExamens = () => {
    return apiRequest(ENDPOINT);
};

/**
 * R cup re un pr levement d'examen par son ID.
 * @param {string} id - L'ID du pr levement d'examen  chercher.
 * @returns {Promise<object>} Les donn es du pr levement d'examen.
 * @throws {Error} Si le pr levement d'examen n'est pas trouv  ou si la requ te API  choue.
 */
export const getPrelevementExamenById = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`);
};

export const updatePrelevementExamen = (id, prelevementData) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(prelevementData)
    });
};

export const deletePrelevementExamen = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
};

export const getPrelevementsByPrescriptionExamenId = (id_prescription_examen) => {
    return apiRequest(`${ENDPOINT}/prescription-examen/${id_prescription_examen}`);
};

/**
 * Recuperere tous les prelevements d'examens associ s  un patient donn .
 * @param {string} id_patient - L'ID du patient.
 * @returns {Promise<Array<object>>} Un tableau des pr levements d'examens pour le patient donn .
 * @throws {Error} Si la requ te API  choue.
 */
export const getPrelevementsByPatientId = (id_patient) => {
    return apiRequest(`${ENDPOINT}/patient/${id_patient}`);
};

export const getPrelevementsByTechnicienId = (id_technicien) => {
    return apiRequest(`${ENDPOINT}/technicien/${id_technicien}`);
};

export const getPrelevementsByCentreId = (id_centre) => {
    return apiRequest(`${ENDPOINT}/centre/${id_centre}`);
};
