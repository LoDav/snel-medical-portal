import { apiRequest } from "./api";

export const createAyantDroit = (ayantDroitData) => {
    return apiRequest('/ayants-droit', {
        method: 'POST',
        body: JSON.stringify(ayantDroitData)
    });
};

export const getAllAyantsDroit = () => {
    return apiRequest('/ayants-droit');
};

export const getAyantDroitById = (id) => {
    return apiRequest(`/ayants-droit/${id}`);
};

export const updateAyantDroit = (id, ayantDroitData) => {
    return apiRequest(`/ayants-droit/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ayantDroitData)
    });
};

export const deleteAyantDroit = (id) => {
    return apiRequest(`/ayants-droit/${id}`, {
        method: 'DELETE'
    });
};

export const getAyantsByAgent = (agentId) => {
    return apiRequest(`/ayants-droit/agent/${agentId}`);
};

export const getAgentByAyantDroitId = (ayantDroitId) => {
    return apiRequest(`/ayants-droit/${ayantDroitId}/agent-principal`);
};
