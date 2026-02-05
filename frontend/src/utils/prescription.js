/**
 * Module utilitaire pour gérer les prescriptions.
 * Ce module fournit des fonctions pour créer et récupérer des prescriptions,
 * y compris des prescriptions avec lignes de médicaments et examens.
 * Il interagit avec l'API backend pour effectuer ces opérations.
 * code backend associé : backend/controllers/prescriptions.controller.js et backend/routes/prescriptions.routes.js
 * Auteur : @Ôkami alias @Necromastery
 * Date : 2024-07-27
 */
import { apiRequest } from "./api";

const ENDPOINT = '/prescriptions';

/**
 * Crée une prescription complète avec ses lignes.
 * la creation d'une prescription avec lignes cree des prescriptions sans examens.
 * @param {object} data - L'objet contenant la prescription et ses lignes.
 * @param {object} data.prescription - Les données de la prescription (id_consultation, id_professionnel, notes_supplementaires).
 * @param {Array<object>} data.lignes - Le tableau des lignes de prescription.
 * @returns {Promise<any>}
 */
export const createPrescriptionWithLines = (data) => {
    return apiRequest(`${ENDPOINT}/with-lines`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/**
 * Crée une prescription complète avec ses examens.
 * la creation d'une prescription avec examens cree des prescriptions sans lignes.
 * @param {object} examenData - L'objet contenant la prescription et ses examens.
 * @param {object} examenData.prescription - Les données de la prescription (id_consultation, id_professionnel, notes_supplementaires).
 * @param {Array<object>} examenData.examens - Le tableau des examens à prescrire.
 * @returns {Promise<any>}
 */
export const createPrescriptionWithExamen = (examenData) => {
    return apiRequest(`${ENDPOINT}/with-exams`, {
        method: 'POST',
        body: JSON.stringify(examenData)
    });
};



/**
 * Récupère toutes les prescriptions pour une consultation donnée.
 * on peut avoir zéro, une ou plusieurs prescriptions pour une consultation.
 * les prescriptions peuvent être de différents types (médicaments, examens, etc.).
 * les prescriptions sont liées à une consultation spécifique via son ID.
 * il se peut qu'une prescription n'ait pas de lignes associées (par exemple, une prescription d'examen).
 * dans ce cas, la prescription sera retournée avec un tableau vide pour la clé "lignes".
 * cela permet de toujours avoir une structure cohérente dans la réponse.
 * les autres prescriptions n'on pas de lignes parce qu'il paut être des prescriptions d'examens ou autres.
 * cas de préscriptions sans lignes :
*   - Prescription d'examen : Une prescription peut être uniquement pour un examen (ex. radiographie) sans lignes de médicaments.   
        {
            "id_prescription": "VSjgYFJGUdis",
            "id_consultation": "AawZXtrVHj0W",
            "id_professionnel": "dc59eada-daa6-4411-a034-5a520c2d9c03",
            "date_prescription": "2025-09-02T15:00:12.000Z",
            "notes_supplementaires": "",
            "statut_prescription": "Active",
            "date_derniere_maj": "2025-09-02T15:00:12.000Z",
            "lignes": []
        }
 * @param {string} id_consultation - L'ID de la consultation.
 * @returns {Promise<any>}
 */
export const getPrescriptionsByConsultation = (id_consultation) => {
    return apiRequest(`${ENDPOINT}/consultation/${id_consultation}`);
};

/**
 * Récupère toutes les prescriptions avec leurs examens pour une consultation donnée.
 * il se peut qu'il n'y ait pas d'examens pour certaines prescriptions.
 * les prescriptions sans examens auront un tableau vide pour la clé "examens".
 * cela permet de toujours avoir une structure cohérente dans la réponse.
 * les autres prescriptions n'on pas d'examens parce qu'il paut être des prescriptions de médicaments ou autres.
 * cas de préscriptions sans examens :
*   - Prescription de médicaments : Une prescription peut être uniquement pour des médicaments sans examens.   
    {
        "id_prescription": "slXauEx0dG6S",
        "id_consultation": "AawZXtrVHj0W",
        "id_professionnel": "dc59eada-daa6-4411-a034-5a520c2d9c03",
        "date_prescription": "2025-09-01T15:00:29.000Z",
        "notes_supplementaires": "",
        "statut_prescription": "Active",
        "date_derniere_maj": "2025-09-01T15:00:28.000Z",
        "examens": []
    }
 * @param {string} id_consultation - L'ID de la consultation.
 * @returns {Promise<any>}
 */
export const getPrescriptionsWithExamsByConsultationId = (id_consultation) => {
    return apiRequest(`${ENDPOINT}/with-exams/${id_consultation}`);
};

/**
 * Récupère toutes les prescriptions avec tous les détails (examens et médicaments) pour une consultation donnée.
 * un prescription ne peut pas avoir à la fois des examens et des lignes de médicaments.
 * une prescription peut avoir soit des examens, soit des lignes de médicaments, soit aucune des deux.
 * les prescriptions sans examens auront un tableau vide pour la clé "examens".
 * les prescriptions sans lignes de médicaments auront un tableau vide pour la clé "lignes".
 * cas de préscriptions sans examens et sans lignes : il ne devrait pas y en avoir.
*   - Prescription vide : Une prescription ne peut pas être créée sans examens ni lignes de médicaments.   
        {
            "id_prescription": "abc123",
            "id_consultation": "AawZXtrVHj0W",
            "id_professionnel": "dc59eada-daa6-4411-a034-5a520c2d9c03",
            "date_prescription": "2025-09-03T10:00:00.000Z",
            "notes_supplementaires": "",
            "statut_prescription": "Active",
            "date_derniere_maj": "2025-09-03T10:00:00.000Z",
            "examens": [],
            "lignes": []
        }
 * @param {string} id_consultation - L'ID de la consultation.
 * @returns {Promise<any>}
 */
export const getPrescriptionsWithAllDetailsByConsultationId = (id_consultation) => {
    return apiRequest(`${ENDPOINT}/with-all/${id_consultation}`);
};

/**
 * Récupère toutes les prescriptions d'un professionnel de santé donné.
 * @param {string} id_professionnel - L'ID du professionnel de santé.
 * @returns {Promise<any>}
 */
export const getPrescriptionsByProfessionnelId = (id_professionnel) => {
    return apiRequest(`${ENDPOINT}/professionnel/${id_professionnel}`);
};

/**
 * Crée une nouvelle prescription.
 * @param {object} data - Les données de la prescription.
 * @returns {Promise<any>}
 */
export const createPrescription = (data) => {
    return apiRequest(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

/**
 * Récupère toutes les prescriptions.
 * @returns {Promise<any>}
 */
export const getAllPrescriptions = () => {
    return apiRequest(ENDPOINT);
};

/**
 * Récupère une prescription par son ID.
 * @param {string} id - L'ID de la prescription.
 * @returns {Promise<any>}
 */
export const getPrescriptionById = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`);
};

/**
 * Met à jour une prescription existante.
 * @param {string} id - L'ID de la prescription à mettre à jour.
 * @param {object} data - Les données de la prescription à mettre à jour.
 * @returns {Promise<any>}
 */
export const updatePrescription = (id, data) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

/**
 * Supprime une prescription par son ID.
 * @param {string} id - L'ID de la prescription à supprimer.
 * @returns {Promise<any>}
 */
export const deletePrescription = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
};

/**
 * Compte le nombre de prescriptions avec des lignes actives (statut = 'PRESCRITE').
 * @returns {Promise<any>}
 */
export const countPrescriptionsWithActiveLines = () => {
    return apiRequest(`${ENDPOINT}/count-active-lines`);
};
