import { apiRequest } from "./api";

export const getConstantesVitalesByPatientId = (idPatient) => {
    return apiRequest(`/constantes-vitales/patient/${idPatient}`);
};

export const getConstantesVitalesByConsultationId = (idConsultation) => {
    return apiRequest(`/constantes-vitales/consultation/${idConsultation}`);
};

export const getConstantesVitalesByProfessionnelId = (idProfessionnel) => {
    return apiRequest(`/constantes-vitales/professionnel/${idProfessionnel}`);
};

export const createConstanteVitale = (constanteData) => {
    return apiRequest('/constantes-vitales', {
        method: 'POST',
        body: JSON.stringify(constanteData)
    });
};

export const getAllConstantesVitales = () => {
    return apiRequest('/constantes-vitales');
};

export const getConstanteVitaleById = (id) => {
    return apiRequest(`/constantes-vitales/${id}`);
};

export const updateConstanteVitale = (id, constanteData) => {
    return apiRequest(`/constantes-vitales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(constanteData)
    });
};

export const deleteConstanteVitale = (id) => {
    return apiRequest(`/constantes-vitales/${id}`, {
        method: 'DELETE'
    });
};
