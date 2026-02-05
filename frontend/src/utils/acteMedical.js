import { apiRequest } from "./api";

export const createActeMedical = (acteData) => {
    return apiRequest('/actes-medicaux', {
        method: 'POST',
        body: JSON.stringify(acteData)
    });
};

export const getAllActesMedicaux = () => {
    return apiRequest('/actes-medicaux');
};

export const getActeMedicalById = (id) => {
    return apiRequest(`/actes-medicaux/${id}`);
};

export const updateActeMedical = (id, acteData) => {
    return apiRequest(`/actes-medicaux/${id}`, {
        method: 'PUT',
        body: JSON.stringify(acteData)
    });
};

export const deleteActeMedical = (id) => {
    return apiRequest(`/actes-medicaux/${id}`, {
        method: 'DELETE'
    });
};

export const getActesByPatient = (patientId) => {
    return apiRequest(`/actes-medicaux/patient/${patientId}`);
};

export const getActesByConsultation = (consultationId) => {
    return apiRequest(`/actes-medicaux/consultation/${consultationId}`);
};