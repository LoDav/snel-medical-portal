
import { apiRequest } from "./api";

export const createAgent = (agentData) => {
    return apiRequest('/agents-snel', {
        method: 'POST',
        body: JSON.stringify(agentData)
    });
};

export const getAllAgents = () => {
    return apiRequest('/agents-snel');
};

export const getAgentById = (id) => {
    return apiRequest(`/agents-snel/${id}`);
};

export const updateAgent = (id, agentData) => {
    return apiRequest(`/agents-snel/${id}`, {
        method: 'PUT',
        body: JSON.stringify(agentData)
    });
};

export const deleteAgent = (id) => {
    return apiRequest(`/agents-snel/${id}`, {
        method: 'DELETE'
    });
};

export const getAgentAndAyantsByMatricule = (matricule) => {
    return apiRequest(`/agents-snel/matricule/${matricule}`);
};

/**
 * Récupère un agent et ses ayants droit par le nom de l'agent.
 * @param {string} nom - Le nom de l'agent à rechercher.
 * @returns {Promise<Object>} Les données de l'agent et de ses ayants droit.
 */
export const getAgentAndAyantsByName = (nom) => {
    return apiRequest(`/agents-snel/nom/${nom}`);
};
