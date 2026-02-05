import { apiRequest } from "./api";

export const createLignePrescription = (ligneData) => {
    return apiRequest('/lignes-prescription', {
        method: 'POST',
        body: JSON.stringify(ligneData)
    });
};

export const getAllLignesPrescription = () => {
    return apiRequest('/lignes-prescription');
};

export const getLignePrescriptionById = (id) => {
    return apiRequest(`/lignes-prescription/${id}`);
};

export const updateLignePrescription = (id, ligneData) => {
    return apiRequest(`/lignes-prescription/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ligneData)
    });
};

export const deleteLignePrescription = (id) => {
    return apiRequest(`/lignes-prescription/${id}`, {
        method: 'DELETE'
    });
};

export const getLignesByPrescription = (prescriptionId) => {
    return apiRequest(`/lignes-prescription/prescription/${prescriptionId}`);
};

export const getPrescriptionsByPatient = (patientId) => {
    return apiRequest(`/lignes-prescription/patient/${patientId}`);
};

export const getDetailedPrescriptionsByPatient = (patientId) => {
    return apiRequest(`/lignes-prescription/patient/detailed/${patientId}`);
};

export const getAllDetailedPrescriptions = () => {
    return apiRequest('/lignes-prescription/detailed/all');
};

export const getPrescribedLinesCount = () => {
    return apiRequest('/lignes-prescription/prescribed/count');
};