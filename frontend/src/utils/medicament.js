import { apiRequest } from "./api";

export const createMedicament = (medicamentData) => {
    console.log('c');
    
    return apiRequest('/medicaments', {
        method: 'POST',
        body: JSON.stringify(medicamentData)
    });
};

export const getAllMedicaments = () => {
    return apiRequest('/medicaments');
};

export const getMedicamentById = (id) => {
    return apiRequest(`/medicaments/${id}`);
};

export const updateMedicament = (id, medicamentData) => {
    return apiRequest(`/medicaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(medicamentData)
    });
};

export const deleteMedicament = (id) => {
    return apiRequest(`/medicaments/${id}`, {
        method: 'DELETE'
    });
};

export const searchMedicamentsByName = (name) => {
    return apiRequest(`/medicaments/search?name=${name}`);
};

export const getStockStatusSummary = () => {
    return apiRequest('/medicaments/stock-status-summary');
};