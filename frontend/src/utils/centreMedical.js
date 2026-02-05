import { apiRequest } from "./api";

export const createCentreMedical = (centreData) => {
    return apiRequest('/centres-medicaux', {
        method: 'POST',
        body: JSON.stringify(centreData)
    });
};

export const getAllCentresMedicaux = () => {
    return apiRequest('/centres-medicaux');
};

export const getCentreMedicalById = (id) => {
    return apiRequest(`/centres-medicaux/${id}`);
};

export const updateCentreMedical = (id, centreData) => {
    return apiRequest(`/centres-medicaux/${id}`, {
        method: 'PUT',
        body: JSON.stringify(centreData)
    });
};

export const deleteCentreMedical = (id) => {
    return apiRequest(`/centres-medicaux/${id}`, {
        method: 'DELETE'
    });
};
