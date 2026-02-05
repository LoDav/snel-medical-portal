import { apiRequest } from "./api";

export const createDispositifMedical = (dispositifData) => {
    return apiRequest('/dispositifs-medicaux', {
        method: 'POST',
        body: JSON.stringify(dispositifData)
    });
};

export const getAllDispositifsMedicaux = () => {
    return apiRequest('/dispositifs-medicaux');
};

export const getDispositifMedicalById = (id) => {
    return apiRequest(`/dispositifs-medicaux/${id}`);
};

export const updateDispositifMedical = (id, dispositifData) => {
    return apiRequest(`/dispositifs-medicaux/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dispositifData)
    });
};

export const deleteDispositifMedical = (id) => {
    return apiRequest(`/dispositifs-medicaux/${id}`, {
        method: 'DELETE'
    });
};

export const searchDispositifsMedicauxByName = (name) => {
    return apiRequest(`/dispositifs-medicaux/search?name=${name}`);
};