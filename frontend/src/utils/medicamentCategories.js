import { apiRequest } from "./api";

export const createMedicamentCategory = (categoryData) => {
    return apiRequest('/medicament-categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
};

export const getAllMedicamentCategories = () => {
    return apiRequest('/medicament-categories');
};

export const getMedicamentCategoryById = (id) => {
    return apiRequest(`/medicament-categories/${id}`);
};

export const updateMedicamentCategory = (id, categoryData) => {
    return apiRequest(`/medicament-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
    });
};

export const deleteMedicamentCategory = (id) => {
    return apiRequest(`/medicament-categories/${id}`, {
        method: 'DELETE'
    });
};

export const searchMedicamentCategoriesByName = (name) => {
    return apiRequest(`/medicament-categories/search?name=${name}`);
};

export const getCatalogueGrouped = () => {
    return apiRequest('/medicament-categories/catalogue-grouped');
};