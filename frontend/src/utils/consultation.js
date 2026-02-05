/**
 * Fichier contenant les fonctions utilitaires pour les consultations.
 * @module consultation
 * @requires api
 * auditeur @Necronemesis alias @Necromastery
 * @version 1.0
 * @since 2025-08-22
 */

// Importation de la fonction apiRequest depuis le module api
import { apiRequest } from "./api";

/**
 * Crée une nouvelle consultation.
 * @param {Object} consultationData - Objet contenant les informations de la consultation
 * @returns {Promise<void>} La promesse qui correspond à la création de la consultation
 * @throws {Error} si la requête API echoue
 */
export const createConsultation = (consultationData) => {
    return apiRequest('/consultations', {
        method: 'POST',
        body: JSON.stringify(consultationData)
    });
};

export const getAllConsultations = () => {
    return apiRequest('/consultations');
};

export const getConsultationById = (id) => {
    return apiRequest(`/consultations/${id}`);
};

export const updateConsultation = (id, consultationData) => {
    console.log(consultationData);

    return apiRequest(`/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(consultationData)
    });
};

export const deleteConsultation = (id) => {
    return apiRequest(`/consultations/${id}`, {
        method: 'DELETE'
    });
};

export const getFullConsultationById = (id) => {
    return apiRequest(`/consultations/full/${id}`);
};

export const getConsultationsByPatientId = (idPatient) => {
    return apiRequest(`/consultations/patient/${idPatient}`);
};

export const getConsultationsByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}`);
};

/**
 * Initialise une consultation pour un patient.
 * C'est une fonction qui prend un objet consultationData en paramètre, qui contient les informations de la consultation.
 * Elle envoie une requête POST à l'API pour initialiser la consultation.
 * @param {Object} consultationData - objet contenant les informations de la consultation
 * @returns {Promise<void>} La promesse qui correspond à l'initialisation de la consultation
 * @throws {Error} si la requête API echoue
 */
export const initConsultation = (consultationData) => {
    return apiRequest('/consultations/init', {
        method: 'POST',
        body: JSON.stringify(consultationData)
    });
};

/**
 * Initialise une consultation avec le type "Rendez-vous" pour un patient.
 * C'est une fonction qui prend un objet consultationData en paramètre, qui contient les informations de la consultation.
 * Elle envoie une requête POST à l'API pour initialiser la consultation avec type_consultation = 'Rendez-vous'.
 * @param {Object} consultationData - objet contenant les informations de la consultation (id_patient, id_centre, id_rendez_vous optionnel)
 * @returns {Promise<void>} La promesse qui correspond à l'initialisation de la consultation
 * @throws {Error} si la requête API echoue
 */
export const initConsultationRdv = (consultationData) => {
    return apiRequest('/consultations/init-rdv', {
        method: 'POST',
        body: JSON.stringify(consultationData)
    });
};

/**
 * Récupère la liste des consultations en attente de prise des constantes.
 * @returns {Promise<Array<Consultation>>} La liste des consultations en attente de prise des constantes.
 */
export const getConsultationsEnAttentePriseConstantes = () => {
    return apiRequest('/consultations/en-attente-constantes');
};

/**
 * Met à jour le statut d'une consultation.
 * @param {number} id L'identifiant de la consultation
 * @param {string} statut Le statut de la consultation
 * @returns {Promise<void>} La promesse de la requête
 */
export const updateConsultationStatus = (id, statut) => {
    return apiRequest(`/consultations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statut_consultation: statut })
    });
};

/**
 * Récupère la liste des consultations en attente de consultation.
 * @returns {Promise<Array<Consultation>>} La liste des consultations en attente de consultation.
 */
export const getConsultationsEnAttenteConsultation = () => {
    return apiRequest('/consultations/en-attente-consultation');
};

/**
 * Récupère la liste des consultations en attente de consultation
 * pour un professionnel.
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<Array<Consultation>>} La liste des consultations en attente de consultation
 * pour le professionnel.
 */
export const getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/en-attente-consultation`);
};

/**
 * Compte le nombre de consultations en attente de consultation
 * pour un professionnel.
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<number>} Le nombre de consultations en attente de consultation
 * pour le professionnel.
 */
export const countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/count-en-attente-consultation`);
};

/**
 * Compte le nombre de consultations en attente de consultation.
 * @returns {Promise<number>} Le nombre de consultations en attente de consultation.
 */
export const countConsultationsEnAttenteConsultation = () => {
    return apiRequest('/consultations/count-en-attente-consultation');
};

/**
 * Compte le nombre de consultations en attente de consultation pour aujourd'hui.
 * @returns {Promise<number>} Le nombre de consultations en attente de consultation pour aujourd'hui.
 */
export const countConsultationsEnAttenteConsultationToday = () => {
    return apiRequest('/consultations/count-en-attente-consultation/today');
};

/**
 * Compte le nombre de consultations en attente de prise des constantes.
 * @returns {Promise<number>} Le nombre de consultations en attente de prise des constantes.
 */
export const countConsultationsEnAttentePriseConstantes = () => {
    return apiRequest('/consultations/count-en-attente-constantes');
};

/**
 * Compte le nombre de consultations en cours pour un professionnel.
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<number>} Le nombre de consultations en cours pour le professionnel.
 */
export const countConsultationsEnCours = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/count-en-cours`);
};

/**
 * Récupère la liste des consultations d'un patient pour aujourd'hui.
 * @param {number} idPatient L'identifiant du patient
 * @returns {Promise<Array<Consultation>>} La liste des consultations du patient pour aujourd'hui
 */
export const getConsultationsForPatientToday = (idPatient) => {
    return apiRequest(`/consultations/patient/${idPatient}/today`);
};

/**
 * Met à jour le triage d'une consultation.
 * @param {number} id L'identifiant de la consultation
 * @param {object} triageData Les informations du triage
 * @returns {Promise<void>} La promesse qui correspond à la mise à jour du triage
 */
export const updateTriageConsultation = (id, triageData) => {
    return apiRequest(`/consultations/${id}/triage`, {
        method: 'PUT',
        body: JSON.stringify(triageData)
    });
};

/**
 * Récupère la liste des consultations en cours pour un professionnel pour un statut donné par professionnel.
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @param {string} statut Le statut de la consultation
 * @returns {Promise<Array<Consultation>>} La liste des consultations en cours pour le professionnel
 */
export const getConsultationsByStatut = (id_professionnel, statut) => {
    let url = `/consultations/professionnel/${id_professionnel}`;
    if (statut) {
        url += `?statut=${statut}`;
    }
    return apiRequest(url);
};

/**
 * Récupère la liste des consultations en cours pour un professionnel.
 * @param {number} id_professionnel L'identifiant du professionnel
 * @returns {Promise<Array<Consultation>>} La liste des consultations en cours pour le professionnel
 */
export const getConsultationsEnCours = (id_professionnel) => {
    console.log('hello');

    return apiRequest(`/consultations/professionnel/${id_professionnel}/en-cours`);
};

/**
 * Récupère la liste des consultations terminées pour un professionnel.
 * @param {number} id_professionnel L'identifiant du professionnel
 * @returns {Promise<Array<Consultation>>} La liste des consultations terminées pour le professionnel
 */
export const getConsultationsTerminees = (id_professionnel) => {
    return apiRequest(`/consultations/professionnel/${id_professionnel}/terminees`);
};

/**
 * Récupère les statistiques des consultations pour un professionnel.
 * @param {number} id_professionnel L'identifiant du professionnel
 * @returns {Promise<Object>} Les statistiques des consultations pour le professionnel
 */
export const getStatsConsultations = (id_professionnel) => {
    return apiRequest(`/consultations/professionnel/${id_professionnel}/stats`);
};

/**
 * Récupère la liste des consultations en attente de consultation
 * pour aujourd'hui. pour un professionnel.
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<Array<Consultation>>} La liste des consultations en attente de consultation
 * pour aujourd'hui pour le professionnel.
 */
export const getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/en-attente-consultation/today`);
};

/**
 * Récupère la liste des consultations en attente de prise des constantes
 * pour aujourd'hui.
 * @returns {Promise<Array<Consultation>>} La liste des consultations en attente de prise des constantes pour aujourd'hui.
 */
export const getConsultationsEnAttentePriseConstantesToday = () => {
    return apiRequest('/consultations/en-attente-constantes/today');
};

/**
 * Compte le nombre de consultations pour aujourd'hui
 * @returns {Promise<number>} Le nombre de consultations pour aujourd'hui
 */
export const countConsultationsToday = () => {
    return apiRequest('/consultations/count-today');
};

/**
 * Compte le nombre de patients distincts consultés aujourd'hui pour un professionnel.
 * ou compter le nombre de consultation terminées aujourd'hui par professionnel
 * @param {number} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<number>} Le nombre de patients distincts consultés aujourd'hui pour le professionnel
 */
export const countDistinctPatientsTodayByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/patients/today/count`);
};

/**
 * Récupère la liste des consultations récentes (7 derniers jours).
 * @returns {Promise<Array<Consultation>>} La liste des consultations récentes.
 */
export const getRecentConsultations = () => {
    return apiRequest('/consultations/recent');
};

/**
 * Récupère la liste des consultations d'aujourd'hui.
 * @returns {Promise<Array<Consultation>>} La liste des consultations d'aujourd'hui.
 */
export const getTodayConsultations = () => {
    return apiRequest('/consultations/today');
};

/**
 * Récupère toutes les consultations avec les détails (patient, professionnel).
 * @returns {Promise<Array<Consultation>>} La liste de toutes les consultations.
 */
export const getAllConsultationsWithDetails = () => {
    return apiRequest('/consultations/all-with-details');
};

/**
 * Récupère la dernière consultation d'un patient.
 * @param {string} idPatient L'identifiant du patient
 * @returns {Promise<Object>} La dernière consultation du patient
 */
export const getLastConsultationByPatientId = (idPatient) => {
    return apiRequest(`/consultations/patient/${idPatient}/last`);
};

/**
 * Récupère les consultations terminées d'un patient.
 * @param {string} idPatient L'identifiant du patient
 * @returns {Promise<Array>} Les consultations terminées du patient
 */
export const getConsultationsTermineesByPatientId = (idPatient) => {
    return apiRequest(`/consultations/patient/${idPatient}/terminees`);
};

/**
 * Met à jour la consultation précédente.
 * @param {string} id L'identifiant de la consultation
 * @param {string} id_consultation_precedente L'identifiant de la consultation précédente
 * @returns {Promise<void>} La promesse de la requête
 */
export const updatePreviousConsultation = (id, id_consultation_precedente) => {
    return apiRequest(`/consultations/${id}/previous-consultation`, {
        method: 'PUT',
        body: JSON.stringify({ id_consultation_precedente })
    });
};

/**
 * Met à jour le type de consultation.
 * @param {string} id L'identifiant de la consultation
 * @param {string} type_consultation Le type de consultation
 * @returns {Promise<void>} La promesse de la requête
 */
export const updateTypeConsultation = (id, type_consultation) => {
    return apiRequest(`/consultations/${id}/type-consultation`, {
        method: 'PUT',
        body: JSON.stringify({ type_consultation })
    });
};

/**
 * Récupère les statistiques hebdomadaires des consultations terminées pour un professionnel.
 * @param {string} idProfessionnel L'identifiant du professionnel
 * @returns {Promise<Object>} Les statistiques hebdomadaires des consultations terminées
 */
export const getWeeklyCompletedConsultationsStats = (idProfessionnel) => {
    return apiRequest(`/consultations/professionnel/${idProfessionnel}/weekly-completed-stats`);
};
