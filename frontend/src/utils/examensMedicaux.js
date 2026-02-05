import { apiRequest } from "./api";

const ENDPOINT = '/examens-medicaux';

/**
 * Crée un nouvel examen médical.
 * Si un fichier de résultat est fourni, il sera envoyé en tant que multipart/form-data.
 * @param {object} examenData - Les données de l'examen médical (resultat, notes_laborantin, statut_examen, etc.).
 * @param {File} [fichierResultat] - Le fichier de résultat à télécharger.
 * @returns {Promise<object>} Les données de l'examen médical créé.
 * @throws {Error} Si la requête API échoue.
 */
export const createExamenMedical = (examenData, fichierResultat = null) => {
    if (fichierResultat) {
        const formData = new FormData();
        for (const key in examenData) {
            formData.append(key, examenData[key]);
        }
        formData.append('fichier_resultat', fichierResultat);

        return apiRequest(ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                // Ne pas définir 'Content-Type': 'application/json' ici,
                // le navigateur le fera automatiquement avec le bon boundary pour FormData.
            }
        });
    } else {
        return apiRequest(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(examenData)
        });
    }
};

/**
 * Récupère tous les examens médicaux.
 * @returns {Promise<Array<object>>} Un tableau de tous les examens médicaux.
 * @throws {Error} Si la requête API échoue.
 */
export const getAllExamensMedicaux = () => {
    return apiRequest(ENDPOINT);
};

/**
 * Récupère un examen médical par son ID.
 * @param {string} id - L'ID de l'examen médical à récupérer.
 * @returns {Promise<object>} Les données de l'examen médical.
 * @throws {Error} Si l'examen médical n'est pas trouvé ou si la requête API échoue.
 */
export const getExamenMedicalById = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`);
};

/**
 * Met à jour un examen médical existant.
 * @param {string} id - L'ID de l'examen médical à mettre à jour.
 * @param {object} updatedData - Les données mises à jour de l'examen médical.
 * @param {File} [fichierResultat] - Le fichier de résultat à télécharger (optionnel).
 * @returns {Promise<object>} La réponse de l'API après la mise à jour.
 * @throws {Error} Si l'examen médical n'est pas trouvé ou si la requête API échoue.
 */
export const updateExamenMedical = (id, updatedData, fichierResultat = null) => {
    if (fichierResultat) {
        const formData = new FormData();
        for (const key in updatedData) {
            formData.append(key, updatedData[key]);
        }
        formData.append('fichier_resultat', fichierResultat);

        return apiRequest(`${ENDPOINT}/${id}`, {
            method: 'PUT',
            body: formData,
            headers: {
                // Ne pas définir 'Content-Type': 'application/json' ici,
                // le navigateur le fera automatiquement avec le bon boundary pour FormData.
            }
        });
    } else {
        return apiRequest(`${ENDPOINT}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });
    }
};

/**
 * Supprime un examen médical par son ID.
 * @param {string} id - L'ID de l'examen médical à supprimer.
 * @returns {Promise<object>} La réponse de l'API après la suppression.
 * @throws {Error} Si l'examen médical n'est pas trouvé ou si la requête API échoue.
 */
export const deleteExamenMedical = (id) => {
    return apiRequest(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
};

/**
 * Récupère tous les examens médicaux associés à un patient spécifique.
 * @param {string} idPatient - L'ID du patient.
 * @returns {Promise<Array<object>>} Un tableau des examens médicaux pour le patient donné.
 * @throws {Error} Si la requête API échoue.
 */
export const getExamensByPatientId = (idPatient) => {
    return apiRequest(`${ENDPOINT}/patient/${idPatient}`);
};

/**
 * Récupère tous les examens médicaux associés à une consultation spécifique.
 * @param {string} idConsultation - L'ID de la consultation.
 * @returns {Promise<Array<object>>} Un tableau des examens médicaux pour la consultation donnée.
 * @throws {Error} Si la requête API échoue.
 */
export const getExamensByConsultationId = (idConsultation) => {
    return apiRequest(`${ENDPOINT}/consultation/${idConsultation}`);
};

/**
 * Récupère les détails complets d'un examen médical par ID de prescription d'examen,
 * incluant les informations de la prescription, du patient et du professionnel de santé.
 * @param {string} idPrescriptionExamen - L'ID de la prescription d'examen.
 * @returns {Promise<Array<object>>} Un tableau des détails de l'examen avec informations liées.
 * @throws {Error} Si la requête API échoue.
 */
export const getExamenDetailsByPrescriptionId = (idPrescriptionExamen) => {
    return apiRequest(`${ENDPOINT}/prescription/${idPrescriptionExamen}`);
};

/**
 * Récupère le nombre d'examens médicaux effectués aujourd'hui par le professionnel connecté.
 * @returns {Promise<object>} Un objet contenant le nombre d'examens.
 * @throws {Error} Si la requête API échoue.
 */
export const getCountExamensAujourdhui = () => {
    return apiRequest(`${ENDPOINT}/count/aujourdhui`);
};

/**
 * Récupère tous les examens médicaux avec informations patient pour le professionnel connecté.
 * @returns {Promise<Array<object>>} Un tableau des examens médicaux avec infos patient.
 * @throws {Error} Si la requête API échoue.
 */
export const getExamensByProfessionnel = () => {
    return apiRequest(`${ENDPOINT}/professionnel`);
};
