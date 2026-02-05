<script setup>
/**
 * code by @david alias @necronemesis ,
 * 20/08/2025
 *
 */

/**
 * New stuff
 */
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';

import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';

// Api methods
import { getConsultationsEnAttentePriseConstantes, getConsultationsEnAttenteConsultation, updateTriageConsultation } from '@/utils/consultation';
import { createConstanteVitale } from '@/utils/constantesVitales';
import { getAllOnlineProfessionals } from '@/utils/professionnel';
import { getUserInfo } from '@/utils/auth';
import { formatDate } from '../tools';

const toast = useToast();
const route = useRoute();

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'tachometer',
        path: '/infirmier/tableau-de-bord',
        active: false
    },
    {
        id: 2,
        name: 'Constante',
        icon: 'thermometer-half',
        path: '/infirmier/constentes',
        active: true
    },
    {
        id: 3,
        name: 'Patients',
        icon: 'users',
        path: '/infirmier/patients',
        active: false
    }
];

const consultationListe = ref([]);
const selectedPatient = ref(null);

const fetchConsultations = async () => {
    try {
        consultationListe.value = await getConsultationsEnAttentePriseConstantes();

        const targetId = route.query.id_consultation;
        if (targetId) {
            const found = consultationListe.value.find(c => String(c.id_consultation) === String(targetId));
            if (found) {
                selectedPatient.value = found;
                return;
            }
        }

        if (consultationListe.value.length > 0 && !selectedPatient.value) {
            selectedPatient.value = consultationListe.value[0];
        }
    } catch (error) {
        console.error("Erreur de récupération des consultations:", error);
        toast.error("Erreur lors de la mise à jour de la liste d'attente.");
    }
};

const selectPatient = (patient) => {
    selectedPatient.value = patient;
    currentUrgency.value = patient.degre_urgence || 'Normal';
};

const getUrgencyColor = (urgency) => {
    switch (urgency) {
        case 'Critique': return 'var(--gh-danger-red)';
        case 'Urgent': return 'var(--gh-warning-orange)';
        default: return 'var(--gh-success-green)';
    }
};

const calculateAge = (date_naissance) => {
    if (!date_naissance) return 'N/A';
    const birthDate = new Date(date_naissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const constantes = ref({
    temperature_celsius: null,
    tension_arterielle_systolique: null,
    tension_arterielle_diastolique: null,
    pouls_bpm: null,
    frequence_respiratoire_rpm: null,
    poids_kg: null,
    taille_cm: null,
    saturation_oxygene_pourcentage: null,
    notes: ''
});

const resetConstantes = () => {
    constantes.value = {
        temperature_celsius: null,
        tension_arterielle_systolique: null,
        tension_arterielle_diastolique: null,
        pouls_bpm: null,
        frequence_respiratoire_rpm: null,
        poids_kg: null,
        taille_cm: null,
        saturation_oxygene_pourcentage: null,
        notes: ''
    };
};

const onlineProfessionals = ref([]);
const waitingForDoctorList = ref([]);
const selectedDoctorId = ref(null);
const currentUrgency = ref('Normal');

const fetchDoctorsData = async () => {
    try {
        onlineProfessionals.value = await getAllOnlineProfessionals();
        waitingForDoctorList.value = await getConsultationsEnAttenteConsultation();
    } catch (error) {
        console.error("Erreur lors de la récupération des médecins:", error);
    }
};

const doctorLoadData = computed(() => {
    const doctors = onlineProfessionals.value.filter(pro => pro.role === 'Médecin' || pro.type_professionnel === 'Médecin');

    return doctors.map(doc => {
        const patientsWaiting = waitingForDoctorList.value.filter(c => c.id_medecin === doc.id_professionnel || c.id_professionnel === doc.id_professionnel).length;

        let status = 'Libre';
        let statusColor = 'var(--gh-success-green)';

        if (patientsWaiting > 3) {
            status = 'Occupé';
            statusColor = 'var(--gh-warning-orange)';
        }
        if (patientsWaiting > 6) {
            status = 'Surchargé';
            statusColor = 'var(--gh-danger-red)';
        }

        return {
            id: doc.id_professionnel,
            name: `Dr. ${doc.nom}`,
            specialty: doc.specialite || 'Généraliste',
            count: patientsWaiting,
            status: status,
            statusColor: statusColor
        };
    }).sort((a, b) => a.count - b.count);
});

const saveConstantes = async () => {
    if (!selectedPatient.value) {
        toast.warning("Veuillez sélectionner un patient.");
        return;
    }

    if (!selectedDoctorId.value) {
        toast.warning("Veuillez sélectionner un médecin pour l'orientation.");
        return;
    }

    try {
        const userInfo = getUserInfo();
        const id_professionnel = userInfo?.id_professionnel;

        if (!id_professionnel) {
            toast.error("Erreur d'authentification. Veuillez vous reconnecter.");
            return;
        }

        // 1. Enregistrer les constantes vitales
        const constanteData = {
            ...constantes.value,
            id_patient: selectedPatient.value.id_patient || selectedPatient.value.patient_info?.id_patient,
            id_consultation: selectedPatient.value.id_consultation,
            id_professionnel: id_professionnel
        };

        await createConstanteVitale(constanteData);

        // 2. Mettre à jour la consultation (Triage + Orientation)
        const triageData = {
            id_medecin: selectedDoctorId.value,
            statut_consultation: 'En attente de consultation',
            degre_urgence: currentUrgency.value
        };

        await updateTriageConsultation(selectedPatient.value.id_consultation, triageData);

        toast.success("Constantes enregistrées et patient orienté !");

        // 3. Réinitialiser et rafraîchir
        resetConstantes();
        selectedPatient.value = null;
        selectedDoctorId.value = null;
        await fetchConsultations();
        await fetchDoctorsData();

    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        toast.error("Une erreur est survenue lors de l'enregistrement.");
    }
};

onMounted(() => {
    fetchConsultations();
    fetchDoctorsData();

    // Refresh doctors every 10 seconds
    const interval = setInterval(fetchDoctorsData, 10000);
    return () => clearInterval(interval);
});

</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />
        <div class="main">
            <navbar />

            <div class="content">
                <div class="waiting-list">
                    <div class="list-header">
                        <span style="font-weight: 600; font-size: 14px;">File d'attente ({{ consultationListe.length
                            }})</span>
                        <i class="fas fa-sync-alt" @click="fetchConsultations"
                            style="font-size: 12px; cursor: pointer; color: var(--gh-primary-blue);"></i>
                    </div>
                    <div class="patient-items">
                        <div v-for="c in consultationListe" :key="c.id_consultation" class="patient-item"
                            :class="{ active: selectedPatient?.id_consultation === c.id_consultation }"
                            @click="selectPatient(c)">
                            <span class="time">{{ c.heure_consultation }}</span>
                            <div class="name">{{ c.patient_info?.nom }} {{ c.patient_info?.prenoms }}</div>
                            <div class="meta">
                                <span class="urgency-dot"
                                    :style="{ background: getUrgencyColor(c.degre_urgence) }"></span>
                                ID: {{ c.patient_info?.id_patient }} • {{ calculateAge(c.patient_info?.date_naissance)
                                }} ans
                            </div>
                        </div>
                        <div v-if="consultationListe.length === 0"
                            style="padding: 20px; text-align: center; color: var(--gh-text-color-secondary); font-size: 13px;">
                            Aucun patient en attente.
                        </div>
                    </div>
                </div>

                <div class="content-inner animate-in">


                    <form class="card" v-if="selectedPatient" @submit.prevent="saveConstantes">
                        <!-- Bandeau Patient -->
                        <div class="patient-banner">
                            <div class="patient-info">
                                <h2>{{ selectedPatient.patient_info?.nom }} {{ selectedPatient.patient_info?.prenoms }}
                                </h2>
                                <p>{{ selectedPatient.patient_info?.sexe }}, {{
                                    calculateAge(selectedPatient.patient_info?.date_naissance) }} ans • ID: {{
                                        selectedPatient.patient_info?.id_patient }} • Sang: {{
                                        selectedPatient.patient_info?.groupe_sanguin || 'N/A' }}</p>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Statut
                                    :</span><br>
                                <span :style="{ color: getUrgencyColor(selectedPatient.degre_urgence) }"
                                    style="font-weight: 700;">{{ selectedPatient.degre_urgence || 'NORMAL' }}</span>
                            </div>
                        </div>

                        <!-- Grille des Constantes -->
                        <div class="vitals-grid">
                            <div class="vital-input-group">
                                <label>Température</label>
                                <div class="input-wrapper"
                                    :class="{ danger: constantes.temperature_celsius > 38 || constantes.temperature_celsius < 36 }">
                                    <input type="number" step="0.1" v-model="constantes.temperature_celsius"
                                        placeholder="37.0" required>
                                    <span class="unit">°C</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Tension Systolique</label>
                                <div class="input-wrapper">
                                    <input type="number" v-model="constantes.tension_arterielle_systolique"
                                        placeholder="120" required>
                                    <span class="unit">mmHg</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Tension Diastolique</label>
                                <div class="input-wrapper">
                                    <input type="number" v-model="constantes.tension_arterielle_diastolique"
                                        placeholder="80" required>
                                    <span class="unit">mmHg</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Fréquence Cardiaque</label>
                                <div class="input-wrapper">
                                    <input type="number" v-model="constantes.pouls_bpm" placeholder="75" required>
                                    <span class="unit">bpm</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Saturation (SpO2)</label>
                                <div class="input-wrapper"
                                    :class="{ warning: constantes.saturation_oxygene_pourcentage < 95 }">
                                    <input type="number" v-model="constantes.saturation_oxygene_pourcentage"
                                        placeholder="98" required>
                                    <span class="unit">%</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Fréq. Respiratoire</label>
                                <div class="input-wrapper">
                                    <input type="number" v-model="constantes.frequence_respiratoire_rpm"
                                        placeholder="16" required>
                                    <span class="unit">rpm</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Poids</label>
                                <div class="input-wrapper">
                                    <input type="number" step="0.1" v-model="constantes.poids_kg" placeholder="70.5"
                                        required>
                                    <span class="unit">kg</span>
                                </div>
                            </div>

                            <div class="vital-input-group">
                                <label>Taille</label>
                                <div class="input-wrapper">
                                    <input type="number" step="1" v-model="constantes.taille_cm" placeholder="175"
                                        required>
                                    <span class="unit">cm</span>
                                </div>
                            </div>
                        </div>

                        <!-- Orientation -->
                        <div class="section-title"
                            style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Orientation Vers Médecin</span>
                            <div class="urgency-selector">
                                <label style="font-size: 12px; margin-right: 8px; font-weight: 600;">Degré d'urgence
                                    :</label>
                                <select v-model="currentUrgency" class="filter-select"
                                    :style="{ color: getUrgencyColor(currentUrgency), fontWeight: '700' }">
                                    <option value="Normal">Normal</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="Très urgent">Très urgent</option>
                                    <option value="Critique">Critique</option>
                                </select>
                            </div>
                        </div>
                        <div class="doctor-selector">
                            <label v-for="doc in doctorLoadData" :key="doc.id" class="doc-card"
                                :class="{ selected: selectedDoctorId === doc.id }">
                                <input type="radio" name="doctor" :value="doc.id" v-model="selectedDoctorId" required>
                                <div class="doctor-name-container">
                                    <span class="online-indicator"></span>
                                    <div style="font-weight: 600; font-size: 13px;">{{ doc.name }}</div>
                                </div>
                                <div style="font-size: 11px; color: var(--gh-text-color-secondary);">
                                    {{ doc.count }} patient{{ doc.count > 1 ? 's' : '' }} •
                                    <span :style="{ color: doc.statusColor }">{{ doc.status }}</span>
                                </div>
                            </label>

                            <div v-if="doctorLoadData.length === 0"
                                style="padding: 15px; font-size: 13px; color: var(--gh-text-color-secondary); background: var(--gh-bg-secondary); border-radius: 6px; width: 100%; text-align: center;">
                                Aucun médecin disponible en ligne actuellement.
                            </div>
                        </div>

                        <!-- Observations -->
                        <div class="form-footer">
                            <div class="vital-input-group">
                                <label>Observations cliniques</label>
                                <textarea v-model="constantes.notes"
                                    placeholder="Ex: Céphalées, douleurs thoraciques depuis ce matin..."></textarea>
                            </div>
                            <div class="actions">
                                <button type="button" class="btn btn-cancel"
                                    @click="resetConstantes">Réinitialiser</button>
                                <button type="submit" class="btn btn-save">
                                    <i class="fa fa-save"></i> Enregistrer et Envoyer en consultation
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

            </div>
        </div>

    </div>

</template>


<style scoped>
.body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    margin: 0;
    display: flex;
    height: 100vh;
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.content {
    /* padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%; */
    display: flex;
    flex: 1;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
}


.content-inner {
    min-width: 1000px;
    margin: 15px auto;
}

/* --- PATIENT LIST (COLONNE GAUCHE) --- */
.waiting-list {
    width: 320px;
    background: var(--gh-card-bg);
    border-right: 1px solid var(--gh-border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.list-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--gh-header-bg);
}

.patient-items {
    overflow-y: auto;
    flex: 1;
}

.patient-item {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
}

.patient-item:hover {
    background-color: var(--gh-sidebar-active-bg);
}

.patient-item.active {
    background-color: var(--gh-sidebar-active-bg);
    border-left: 4px solid var(--gh-primary-blue);
}

.patient-item .name {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 3px;
}

.patient-item .meta {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.patient-item .time {
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

.urgency-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
}

/* --- CARD STYLES --- */
.card {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    box-shadow: var(--gh-shadow);
    margin-bottom: 25px;
    overflow: hidden;
    color: var(--gh-text-color);
}

/* --- PATIENT BANNER --- */
.patient-banner {
    padding: 20px;
    background: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.patient-info h2 {
    margin: 0;
    font-size: 18px;
    color: var(--gh-primary-blue);
}

.patient-info p {
    margin: 5px 0 0;
    font-size: 13px;
    color: var(--gh-text-color-secondary);
}

/* --- INPUT STYLES --- */
.vitals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    padding: 25px;
}

.vital-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vital-input-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-wrapper input {
    width: 100%;
    padding: 12px;
    font-size: 18px;
    font-weight: 700;
    background: var(--gh-input-bg);
    color: var(--gh-text-color);
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    outline: none;
    transition: all 0.2s;
    text-align: center;
}

.input-wrapper input:focus {
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.unit {
    position: absolute;
    right: 12px;
    font-size: 11px;
    font-weight: 700;
    color: var(--gh-text-color-secondary);
    background: var(--gh-header-bg);
    padding: 2px 6px;
    border-radius: 4px;
}

/* Alert States */
.input-wrapper.warning input {
    border-color: var(--gh-warning-orange);
    color: var(--gh-warning-orange);
}

.input-wrapper.danger input {
    border-color: var(--gh-danger-red);
    color: var(--gh-danger-red);
}

/* --- DOCTOR SELECTION --- */
.urgency-selector {
    display: flex;
    align-items: center;
}

.filter-select {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--gh-border-color);
    background-color: var(--gh-card-bg);
    color: var(--gh-text-color);
    font-size: 12px;
    outline: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-select:hover {
    border-color: var(--gh-primary-blue);
    background-color: var(--gh-bg-color);
}

.section-title {
    padding: 15px 25px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid var(--gh-border-color);
    background: var(--gh-header-bg);
}

.doctor-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 20px 25px;
}

.doc-card {
    border: 1px solid var(--gh-border-color);
    padding: 12px;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    background: var(--gh-card-bg);
    color: var(--gh-text-color);
}

.doc-card:hover {
    border-color: var(--gh-primary-blue);
    background: var(--gh-sidebar-active-bg);
}

.doc-card.selected {
    background: var(--gh-sidebar-active-bg);
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 2px var(--gh-focus-shadow);
}

.doctor-name-container {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
}

.online-indicator {
    width: 6px;
    height: 6px;
    background-color: var(--gh-success-green);
    border-radius: 50%;
    margin-right: 8px;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.doc-card input {
    position: absolute;
    opacity: 0;
}

/* --- FOOTER --- */
.form-footer {
    padding: 25px;
    border-top: 1px solid var(--gh-border-color);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

textarea {
    width: 100%;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    padding: 10px;
    background: var(--gh-input-bg);
    color: var(--gh-text-color);
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* .dossier-details {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
}

.dossier-details h2 {
    font-size: 24px;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--gh-primary-blue);
}

.dossier-section {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
}

.dossier-section-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dossier-section p {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 10px;
}

.dossier-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.dossier-section li {
    padding: 8px 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.dossier-section li:last-child {
    border-bottom: none;
} */

/* Animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeIn 0.4s ease forwards;
}
</style>
