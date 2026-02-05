import { apiRequest } from "./api";

export const createMouvementStock = (mouvementStockData) => {
    return apiRequest('/mouvements-stock', {
        method: 'POST',
        body: JSON.stringify(mouvementStockData)
    });
};

export const getAllMouvementsStock = () => {
    return apiRequest('/mouvements-stock');
};

export const getMouvementsStockByMedicament = (medicamentId) => {
    return apiRequest(`/mouvements-stock/medicament/${medicamentId}`);
};

export const getMouvementsStockByCentre = (centreId) => {
    return apiRequest(`/mouvements-stock/centre/${centreId}`);
};

export const getMouvementStockById = (id) => {
    return apiRequest(`/mouvements-stock/${id}`);
};

export const deleteMouvementStock = (id) => {
    return apiRequest(`/mouvements-stock/${id}`, {
        method: 'DELETE'
    });
};

export const getWeeklyMovements = () => {
    return apiRequest('/mouvements-stock/weekly');
};

export const getMonthlyIncomingLots = () => {
    return apiRequest('/mouvements-stock/monthly-incoming-lots');
};

export const getMonthlyReceptions = () => {
    return apiRequest('/mouvements-stock/monthly-receptions');
};

export const getTodayExitsByMedicament = () => {
    return apiRequest('/mouvements-stock/today-exits-by-medicament');
};

export const getTodayTotalExits = () => {
    return apiRequest('/mouvements-stock/today-total-exits');
};

export const getRecentMovements = (limit = 5) => {
    return apiRequest(`/mouvements-stock/recent?limit=${limit}`);
};

export const getDetailedMovements = () => {
    return apiRequest('/mouvements-stock/detailed');
};