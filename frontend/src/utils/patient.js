import { apiRequest } from "./api";

export const getPatients = () => {
    return apiRequest('/patients');
};

export const getPatientById = (id) => {
    return apiRequest(`/patients/${id}`);
};

export const createPatient = (patientData) => {
    return apiRequest('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData)
    });
};

export const updatePatient = (id, patientData) => {
    return apiRequest(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patientData)
    });
};

export const deletePatient = (id) => {
    return apiRequest(`/patients/${id}`, {
        method: 'DELETE'
    });
};

export const getPatientFullById = (id) => {
    return apiRequest(`/patients/full/${id}`);
};

export const searchPatientsByName = (name) => {
    return apiRequest(`/patients/getLikebyname/${name}`);
};

/**
 * Rechercher des patients par ID (LIKE)
 * @param {string} id - ID du patient à rechercher
 * @returns {Promise} - Promesse contenant la liste des patients trouvés
 */
export const searchPatientsByIdLike = (id) => {
    return apiRequest(`/patients/getLikebyid/${id}`);
};

// le patient crée aujourd'hui
export const getPatientsToday = () => {
    return apiRequest('/patients/today');
};
// Nombre de patients crrées aujourd'hui
export const countPatientsToday = () => {
    return apiRequest('/patients/countToday');
};
//nombre total de patients
export const countAllPatients = () => {
    return apiRequest('/patients/countAll');
};
