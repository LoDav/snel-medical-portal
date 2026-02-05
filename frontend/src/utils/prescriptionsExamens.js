/**
 * Module utilitaire pour gérer les prescriptions d'examens.
 * Ce module fournit des fonctions pour créer, récupérer, mettre à jour et supprimer des prescriptions d'examens.
 * Il inclut également des fonctions pour récupérer des listes détaillées d'examens.
 * Il interagit avec l'API backend pour effectuer ces opérations.
 * Code backend associé : backend/controllers/prescriptionsExamens.controller.js et backend/routes/prescriptionsExamens.routes.js
 * Auteur : @Ôkami alias @Necromastery (Adapté par Cline)
 * Date : 2025-09-04
 */
import { apiRequest } from './api.js';

const ENDPOINT = '/prescriptions-examens';

/**
 * Crée une nouvelle prescription d'examen.
 * @param {object} prescriptionExamenData - Les données de la nouvelle prescription d'examen.
 * @returns {Promise<object>} Les données de la prescription d'examen créée.
 * @throws {Error} Si la requête API échoue.
 */
export const createPrescriptionExamen = async (prescriptionExamenData) => {
    const response = await apiRequest(ENDPOINT, prescriptionExamenData);
    return response
};

/**
 * Récupère toutes les prescriptions d'examens.
 * @returns {Promise<Array<object>>} Un tableau de toutes les prescriptions d'examens.
 * @throws {Error} Si la requête API échoue.
 */
export const getAllPrescriptionsExamens = async () => {
    const response = await apiRequest(ENDPOINT);
    return response
};

/**
 * Récupère une prescription d'examen par son ID.
 * @param {string} id - L'ID de la prescription d'examen à récupérer.
 * @returns {Promise<object>} Les données de la prescription d'examen.
 * @throws {Error} Si la prescription d'examen n'est pas trouvée ou si la requête API échoue.
 */
export const getPrescriptionExamenById = async (id) => {
    const response = await apiRequest(`${ENDPOINT}/${id}`);
    return response
};

/**
 * Met à jour une prescription d'examen existante.
 * @param {string} id - L'ID de la prescription d'examen à mettre à jour.
 * @param {object} updatedData - Les données mises à jour de la prescription d'examen.
 * @returns {Promise<object>} La réponse de l'API après la mise à jour.
 * @throws {Error} Si la prescription d'examen n'est pas trouvée ou si la requête API échoue.
 */
export const updatePrescriptionExamen = async (id, updatedData) => {
    const response = await apiRequest(`${ENDPOINT}/${id}`, updatedData);
    return response
};

/**
 * Supprime une prescription d'examen par son ID.
 * @param {string} id - L'ID de la prescription d'examen à supprimer.
 * @returns {Promise<object>} La réponse de l'API après la suppression.
 * @throws {Error} Si la prescription d'examen n'est pas trouvée ou si la requête API échoue.
 */
export const deletePrescriptionExamen = async (id) => {
    const response = await apiRequest(`${ENDPOINT}/${id}`);
    return response
};

/**
 * Récupère une liste détaillée de toutes les prescriptions d'examens,
 * regroupées par centre médical et incluant des informations sur le patient,
 * le médecin, la consultation et les résultats d'examen.
 * @returns {Promise<Array<object>>} Un tableau d'objets détaillés de prescriptions d'examens.
 * @throws {Error} Si la requête API échoue.
 */
export const getDetailedPrescriptionsExamens = async () => {
    const response = await apiRequest(`${ENDPOINT}/detailed`);
    return response
};

/**
 * Récupère toutes les prescriptions d'examens associées à une consultation spécifique,
 * incluant des détails sur le patient, le médecin et les résultats d'examen.
 * @param {string} id_consultation - L'ID de la consultation.
 * @returns {Promise<Array<object>>} Un tableau des prescriptions d'examens pour la consultation donnée.
 * @throws {Error} Si la requête API échoue.
 */
export const getPrescriptionsWithExamsByConsultationId = async (id_consultation) => {
    const response = await apiRequest(`${ENDPOINT}/by-consultation/${id_consultation}`);
    return response
};

/**
 * Change le statut d'une prescription d'examen.
 * @param {string} id_prescription_examen - L'ID de la prescription d'examen.
 * @param {string} statut_examen - Le nouveau statut ('Demandé', 'En cours', 'Réalisé', 'Annulé', 'En attente des résultats').
 * @returns {Promise<object>} La réponse de l'API après le changement de statut.
 * @throws {Error} Si l'ID ou le statut n'est pas fourni, ou si la requête API échoue.
 */
export const changeStatutExamen = async (id_prescription_examen, statut_examen) => {
    if (!id_prescription_examen) {
        throw new Error('L\'ID de la prescription d\'examen est requis');
    }

    if (!statut_examen) {
        throw new Error('Le statut d\'examen est requis');
    }

    // Validation des statuts valides
    const statutsValides = ['Demandé', 'En cours', 'Réalisé', 'Annulé', 'En attente des résultats'];
    if (!statutsValides.includes(statut_examen)) {
        throw new Error(`Statut invalide. Les statuts valides sont: ${statutsValides.join(', ')}`);
    }

    const response = await apiRequest(`${ENDPOINT}/${id_prescription_examen}/statut`, {
        method: 'PUT',
        body: JSON.stringify({ statut_examen })
    });
    return response
};

/**
 * Récupère le nombre de demandes d'examen pour aujourd'hui.
 * @returns {Promise<object>} Un objet contenant le nombre de demandes.
 * @throws {Error} Si la requête API échoue.
 */
export const getCountDemandesAujourdhui = async () => {
    const response = await apiRequest(`${ENDPOINT}/count/demandes-aujourdhui`);
    return response;
};

/**
 * Récupère le nombre d'examens réalisés pour aujourd'hui.
 * @returns {Promise<object>} Un objet contenant le nombre d'examens réalisés.
 * @throws {Error} Si la requête API échoue.
 */
export const getCountRealisesAujourdhui = async () => {
    const response = await apiRequest(`${ENDPOINT}/count/realises-aujourdhui`);
    return response;
};

/**
 * Récupère les prescriptions d'examens récentes (8 derniers jours),
 * incluant des informations sur le patient, le prescripteur et la consultation.
 * @returns {Promise<Array<object>>} Un tableau des prescriptions d'examens récentes.
 * @throws {Error} Si la requête API échoue.
 */
export const getRecentPrescriptionsExamens = async () => {
    const response = await apiRequest(`${ENDPOINT}/recent`);
    return response;
};
