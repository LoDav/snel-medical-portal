import { apiRequest } from "./api";

export const createAntecedent = (antecedentData) => {
    return apiRequest('/antecedents', {
        method: 'POST',
        body: JSON.stringify(antecedentData)
    });
};

export const getAllAntecedents = () => {
    return apiRequest('/antecedents');
};

export const getAntecedentById = (id) => {
    return apiRequest(`/antecedents/${id}`);
};

export const updateAntecedent = (id, antecedentData) => {
    return apiRequest(`/antecedents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(antecedentData)
    });
};

export const deleteAntecedent = (id) => {
    return apiRequest(`/antecedents/${id}`, {
        method: 'DELETE'
    });
};

export const getAntecedentsByPatientId = (idPatient) => {
    return apiRequest(`/antecedents/patient/${idPatient}`);
};
