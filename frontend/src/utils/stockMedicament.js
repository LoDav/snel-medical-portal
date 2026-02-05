import { apiRequest } from "./api";

export const createStockMedicament = (stockData) => {
    return apiRequest('/stocks-medicaments', {
        method: 'POST',
        body: JSON.stringify(stockData)
    });
};

export const getAllStocksMedicaments = () => {
    return apiRequest('/stocks-medicaments');
};

export const getStockMedicamentById = (id) => {
    return apiRequest(`/stocks-medicaments/${id}`);
};

export const updateStockMedicament = (id, stockData) => {
    return apiRequest(`/stocks-medicaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(stockData)
    });
};

export const deleteStockMedicament = (id) => {
    return apiRequest(`/stocks-medicaments/${id}`, {
        method: 'DELETE'
    });
};

export const getStockByMedicamentAndCentre = (medicamentId, centreId) => {
    return apiRequest(`/stocks-medicaments/medicament/${medicamentId}/centre/${centreId}`);
};

export const getStockWithMedicamentById = (medicamentId) => {
    return apiRequest(`/stocks-medicaments/medicament/${medicamentId}`);
};

export const getStockWithDispositifById = (dispositifId) => {
    return apiRequest(`/stocks-medicaments/dispositif/${dispositifId}`);
};

export const getLowStockMedicaments = () => {
    return apiRequest('/stocks-medicaments/low-stock');
};

export const getExpiringMedicaments = () => {
    return apiRequest('/stocks-medicaments/expiring');
};

export const updateExpiredStockStatus = () => {
    return apiRequest('/stocks-medicaments/update-expired', {
        method: 'PUT'
    });
};

