import { apiRequest } from "./api";

export const createDispensation = (dispensationData) => {
    return apiRequest('/dispensations', {
        method: 'POST',
        body: JSON.stringify(dispensationData)
    });
};

export const getAllDispensations = () => {
    return apiRequest('/dispensations');
};

export const getDispensationById = (id) => {
    return apiRequest(`/dispensations/${id}`);
};

export const updateDispensation = (id, dispensationData) => {
    return apiRequest(`/dispensations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dispensationData)
    });
};

export const deleteDispensation = (id) => {
    return apiRequest(`/dispensations/${id}`, {
        method: 'DELETE'
    });
};

export const getDispensationsByPatient = (patientId) => {
    return apiRequest(`/dispensations/patient/${patientId}`);
};

export const getDispensationsByMedicament = (medicamentId) => {
    return apiRequest(`/dispensations/medicament/${medicamentId}`);
};

export const getTopDispensedMedicaments = () => {
    return apiRequest('/dispensations/top-monthly');
};