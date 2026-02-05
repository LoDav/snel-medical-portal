<script setup>
import { defineProps, ref, watch, computed } from 'vue';
import { getFullConsultationById } from '../../utils/consultation.js';
import { getLignesByPrescription } from '../../utils/lignePrescription.js';
import { getPrescriptionsByConsultation } from '../../utils/prescription'; // Importez getPrescriptionsByConsultation
import { getPrescriptionsWithExamsByConsultationId } from '../../utils/prescriptionsExamens.js';
import { getExamensByConsultationId } from '../../utils/examensMedicaux.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    consultation: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['close']);

const fullConsultationData = ref(null);
const prescriptions = ref([]);
const examens = ref([]);
const examensResults = ref([]);
const loading = ref(false);
const activeTab = ref('prescriptions');

// Computed property to filter prescriptions with non-empty lignes
const filteredPrescriptions = computed(() => {
    return prescriptions.value.filter(p => p.lignes && p.lignes.length > 0);
});

const closeModal = () => {
    emit('close');
};

const extractVital = (examenClinique, key) => {
    if (!examenClinique) return null;
    const regex = new RegExp(`${key}\\s*:\\s*([^\\s,]+)`, 'i');
    const match = examenClinique.match(regex);
    return match ? match[1] : null;
};

const getStatusClass = (status) => {
    switch (status) {
        case 'Réalisé':
        case 'Terminé':
            return 'completed';
        case 'En cours':
        case 'En attente des résultats':
            return 'pending';
        case 'Annulé':
            return 'danger';
        default:
            return 'pending';
    }
};

watch(() => props.show, async (newShow) => {
    console.log('Modal show changed:', newShow, 'consultation:', props.consultation);
    if (newShow && props.consultation) {
        console.log('Fetching data for consultation:', props.consultation.id_consultation);
        loading.value = true;
        try {
            // Fetch full consultation details
            const fullData = await getFullConsultationById(props.consultation.id_consultation);
            console.log('Full consultation data:', fullData);
            fullConsultationData.value = fullData;
        } catch (error) {
            console.error('Error fetching full consultation details:', error);
        }

        try {
            // Fetch prescriptions if there's a prescription ID
            const prescriptionData = await getPrescriptionsByConsultation(props.consultation.id_consultation);
            prescriptions.value = prescriptionData;
            console.log('Prescriptions data:', prescriptionData);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }

        try {
            // Fetch exam prescriptions
            const examData = await getPrescriptionsWithExamsByConsultationId(props.consultation.id_consultation);
            examens.value = examData;
            console.log('Examens data:', examData);
        } catch (error) {
            console.error('Error fetching exam prescriptions:', error);
        }

        try {
            // Fetch exam results
            const examResultsData = await getExamensByConsultationId(props.consultation.id_consultation);
            examensResults.value = examResultsData;
            console.log('Examens results data:', examResultsData);
        } catch (error) {
            console.error('Error fetching exam results:', error);
        } finally {
            loading.value = false;
        }
    } else if (!newShow) {
        // Reset data when modal closes
        fullConsultationData.value = null;
        prescriptions.value = [];
        examens.value = [];
        examensResults.value = [];
    }
});
</script>

<template>
    <!-- Modal for consultation details -->
    <div :class="['modal-overlay', { active: show }]" @click="closeModal">
        <div class="modal-content animate__animated animate__fadeIn" @click.stop>
            <div class="modal-header">
                <h2>Détails de la Consultation</h2>
                <button class="modal-close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body" v-if="consultation">
                <div v-if="loading" class="loading">Chargement...</div>
                <div v-else-if="fullConsultationData">
                    <div class="consultation-header">
                        <div class="header-info">
                            <i class="fa fa-user-plus"></i>
                            <div class="header-info-text">
                                <strong>{{ fullConsultationData.patient?.nom || 'N/A' }} {{ fullConsultationData.patient?.prenoms || '' }}</strong>
                                <span>ID Patient: {{ fullConsultationData.patient?.id_patient || 'N/A' }}</span>
                            </div>
                        </div>
                        <div class="header-info">
                            <i class="fa fa-user-md"></i>
                            <div class="header-info-text">
                                <strong>{{ (fullConsultationData.professionnel_sante?.nom || '') + ' ' + (fullConsultationData.professionnel_sante?.prenoms || '') }}</strong>
                                <span>{{ fullConsultationData.professionnel_sante?.specialite || 'Médecin' }}</span>
                            </div>
                        </div>
                        <div class="header-info">
                            <i class="fa fa-calendar"></i>
                            <div class="header-info-text">
                                <strong>{{ new Date(fullConsultationData.date_consultation).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) }}</strong>
                                <span>ID Consultation: {{ fullConsultationData.id_consultation }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Signes Vitaux -->
                    <!-- <div class="vitals-grid" v-if="fullConsultationData.examen_clinique">
                        <div class="vital-item">
                            <i class="fas fa-heartbeat"></i>
                            <div>
                                <div class="vital-value">{{ extractVital(fullConsultationData.examen_clinique, 'Pouls') || 'N/A' }} <span style="font-size: 12px;">bpm</span></div>
                                <div class="vital-label">Fréq. Cardiaque</div>
                            </div>
                        </div>
                        <div class="vital-item">
                            <i class="fas fa-tint"></i>
                            <div>
                                <div class="vital-value">{{ extractVital(fullConsultationData.examen_clinique, 'TA') || 'N/A' }} <span style="font-size: 12px;">mmHg</span></div>
                                <div class="vital-label">Tension Artérielle</div>
                            </div>
                        </div>
                        <div class="vital-item">
                            <i class="fas fa-thermometer-half"></i>
                            <div>
                                <div class="vital-value">{{ extractVital(fullConsultationData.examen_clinique, 'Température') || 'N/A' }} <span style="font-size: 12px;">°C</span></div>
                                <div class="vital-label">Température</div>
                            </div>
                        </div>
                        <div class="vital-item">
                            <i class="fas fa-weight"></i>
                            <div>
                                <div class="vital-value">{{ extractVital(fullConsultationData.examen_clinique, 'FR') || 'N/A' }} <span style="font-size: 12px;">/min</span></div>
                                <div class="vital-label">Fréq. Respiratoire</div>
                            </div>
                        </div>
                    </div> -->

                    <!-- Anamnèse (S) -->
                    <div class="section-card mt-4">
                        <h3 class="section-title"><i class="fa fa-commenting"></i> Anamnèse (S)</h3>
                        <div class="form-group">
                            <label>Motif de Consultation (Subjectif)</label>
                            <p>{{ fullConsultationData.motif_consultation || 'Non spécifié' }}</p>
                        </div>
                        <div class="form-group" v-if="fullConsultationData.anamnese">
                            <label>Antécédents et Histoire de la Maladie</label>
                            <p>{{ fullConsultationData.anamnese || 'Aucun antécédent pertinent' }}</p>
                        </div>
                    </div>

                    <!-- Examen Clinique (O) & Diagnostic (A) -->
                    <div class="section-card">
                        <h3 class="section-title"><i class="fa fa-stethoscope"></i> Examen Clinique (O) & Diagnostic (A)</h3>
                        <div class="form-group" v-if="fullConsultationData.examen_clinique">
                            <label>Examen Clinique (Objectif)</label>
                            <p>{{ fullConsultationData.examen_clinique || 'Examen clinique normal' }}</p>
                        </div>
                        <div class="form-group">
                            <label>Diagnostic / Problèmes</label>
                            <p>{{ fullConsultationData.diagnostic_principal || 'Diagnostic en cours' }}</p>
                        </div>
                        <div class="form-group" v-if="fullConsultationData.diagnostic_cim10">
                            <label>Code CIM-10</label>
                            <p>{{ fullConsultationData.diagnostic_cim10 }}</p>
                        </div>
                    </div>

                    <!-- Plan de Traitement (P) -->
                    <div class="section-card">
                        <h3 class="section-title"><i class="fa fa-clipboard"></i> Plan de Traitement (P)</h3>

                        <!-- Tabs Container -->
                        <div class="tabs-container">
                            <button
                                :class="['tab-button', { active: activeTab === 'prescriptions' }]"
                                @click="activeTab = 'prescriptions'"
                            >
                                <i class="fa fa-medkit"></i> Prescriptions Médicamenteuses
                            </button>
                            <button
                                :class="['tab-button', { active: activeTab === 'examens' }]"
                                @click="activeTab = 'examens'"
                            >
                                <i class="fa fa-flask"></i> Analyses / Examens
                            </button>
                            <button
                                :class="['tab-button', { active: activeTab === 'recommandations' }]"
                                @click="activeTab = 'recommandations'"
                            >
                                <i class="fa fa-clipboard"></i> Recommandations
                            </button>
                        </div>

                        <!-- Tab Content -->
                        <div class="tab-content" :class="{ active: activeTab === 'prescriptions' }">
                            <div class="form-group">
                                <label>Prescriptions Médicamenteuses</label>
                                <div v-if="filteredPrescriptions.length > 0">
                                    <div v-for="prescription in filteredPrescriptions" :key="prescription.id_prescription" class="prescription-item">
                                        <h4>Prescription du {{ new Date(prescription.date_prescription).toLocaleDateString('fr-FR') }}</h4>
                                        <ul>
                                            <li v-for="ligne in prescription.lignes" :key="ligne.id_ligne_prescription">
                                                <strong>{{ ligne.nom_medicament || 'Médicament' }}</strong> -
                                                Posologie: {{ ligne.posologie || 'Non spécifiée' }}
                                                <br><small>Dosage: {{ ligne.dosage_medicament || 'N/A' }} - Forme: {{ ligne.forme_medicament || 'N/A' }} - Quantité: {{ ligne.quantite_prescrite || 'N/A' }} - Durée: {{ ligne.duree_traitement_jours || 'N/A' }} jours</small>
                                                <br><small>Description: {{ ligne.description_medicament || '' }}</small>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <p v-else class="no-data">Aucune prescription médicamenteuse</p>
                            </div>
                        </div>

                        <div class="tab-content" :class="{ active: activeTab === 'examens' }">
                            <div class="form-group">
                                <label>Demandes d'Analyses / Examens</label>
                                <div v-if="examens.length > 0">
                                    <div v-for="examen in examens" :key="examen.id_prescription_examen" class="prescription-item">
                                        <h4>{{ examen.nom_examen || 'Examen' }} - {{ examen.type_examen || 'Type non spécifié' }}</h4>
                                        <p><strong>Statut:</strong>
                                            <span :class="['status', getStatusClass(examen.statut_examen)]">
                                                {{ examen.statut_examen || 'Demandé' }}
                                            </span>
                                        </p>
                                        <p><strong>Priorité:</strong> {{ examen.priorite || 'Normale' }}</p>
                                        <p><strong>Date de demande:</strong> {{ new Date(examen.date_demande).toLocaleDateString('fr-FR') }}</p>
                                        <div v-if="examen.instructions">
                                            <strong>Instructions:</strong> {{ examen.instructions }}
                                        </div>
                                        <div v-if="examen.resultat_resultats">
                                            <strong>Résultats:</strong> {{ examen.resultat_resultats }}
                                        </div>
                                        <div v-if="examen.resultat_compte_rendu">
                                            <strong>Compte rendu:</strong> {{ examen.resultat_compte_rendu }}
                                        </div>
                                        <!-- Afficher les résultats détaillés si disponibles -->
                                        <div v-if="examensResults.length > 0">
                                            <div v-for="result in examensResults" :key="result.id_examen_medical">
                                                <div v-if="result.id_prescription_examen === examen.id_prescription_examen">
                                                    <strong>Résultats détaillés:</strong>
                                                    <p>{{ result.resultats || 'Aucun résultat détaillé' }}</p>
                                                    <p v-if="result.notes_laborantin"><strong>Notes du laborantin:</strong> {{ result.notes_laborantin }}</p>
                                                    <p v-if="result.date_examen"><strong>Date d'examen:</strong> {{ new Date(result.date_examen).toLocaleDateString('fr-FR') }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p v-else class="no-data">Aucun examen demandé</p>
                            </div>
                        </div>

                        <div class="tab-content" :class="{ active: activeTab === 'recommandations' }">
                            <div class="form-group">
                                <label>Plan de Traitement</label>
                                <p>{{ fullConsultationData.plan_traitement || 'Aucun plan de traitement spécifié' }}</p>
                            </div>
                            <div class="form-group" v-if="fullConsultationData.evolution">
                                <label>Évolution & Recommandations</label>
                                <p>{{ fullConsultationData.evolution || 'Aucune recommandation spécifique' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Statut -->
                    <div class="section-card">
                        <h3 class="section-title"><i class="fa fa-info-circle"></i> Statut de la Consultation</h3>
                        <span :class="{
                            'status pending': fullConsultationData.statut_consultation === 'En attente de prise des constantes' ||
                                fullConsultationData.statut_consultation === 'En attente de consultation',
                            'status completed': fullConsultationData.statut_consultation === 'Terminée',
                            'status cancelled': fullConsultationData.statut_consultation === 'Annulée'
                        }">
                            {{ fullConsultationData.statut_consultation }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Import main.css styles */
/* @import url('../../../css/main.css'); */

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--gh-modal-overlay-bg);
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal-overlay.active {
    display: flex;
    opacity: 1;
}

.modal-content {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 4px 12px var(--gh-shadow);
    width: 100%;
    max-width: 1100px;
    max-height: 800px;
    padding: 25px;
    position: relative;
    transform: translateY(-20px);
    transition: transform 0.3s ease;
    overflow: auto;
    margin-top: 50px;
}

.modal-overlay.active .modal-content {
    transform: translateY(0);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 15px;
    margin-bottom: 20px;
}

.modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.modal-close-btn {
    background: none;
    border: none;
    font-size: 24px;
    font-weight: 300;
    color: #586069;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s ease;
}

.modal-close-btn:hover {
    color: var(--gh-text-color);
}

.modal-body {
    font-size: 14px;
    line-height: 1.6;
    color: #586069;
    text-align: left;
    margin-bottom: 20px;
}

.loading {
    text-align: center;
    padding: 40px;
    font-size: 16px;
    color: var(--gh-text-color-secondary);
}

.consultation-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background-color: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    border-radius: 6px 6px 0 0;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin: 5px 10px;
}

.header-info i {
    font-size: 20px;
    color: var(--gh-primary-blue);
}

.header-info-text strong {
    display: block;
    font-size: 16px;
    color: var(--gh-text-color);
}

.header-info-text span {
    font-size: 14px;
    color: var(--gh-text-color-secondary);
}

.vitals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 20px;
    padding: 20px 25px;
    border-bottom: 1px solid var(--gh-border-color);
}

.vital-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.vital-item i {
    font-size: 24px;
    color: var(--gh-text-color-secondary);
}

.vital-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.vital-label {
    font-size: 13px;
    color: var(--gh-text-color-secondary);
}

.section-card {
    background-color: var(--gh-header-bg);
    padding: 20px;
    border-radius: 6px;
    border: 1px solid var(--gh-border-color);
    margin-bottom: 20px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-title i {
    color: var(--gh-primary-blue);
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--gh-text-color-secondary);
}

.form-group p {
    margin: 0;
    padding: 10px 12px;
    background-color: var(--gh-input-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    font-size: 14px;
    color: var(--gh-text-color);
    box-sizing: border-box;
}

.form-group ul {
    margin: 0;
    padding: 10px 12px;
    background-color: var(--gh-input-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    font-size: 14px;
    color: var(--gh-text-color);
    box-sizing: border-box;
}

.form-group li {
    margin-bottom: 5px;
}

.prescription-item {
    margin-bottom: 20px;
    padding: 15px;
    background-color: var(--gh-input-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
}

.prescription-item h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: var(--gh-text-color);
}

.treatment-plan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.status {
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
    text-align: center;
}

.status.completed {
    background-color: rgba(46, 204, 113, 0.1);
    color: var(--accent-green);
}

.status.pending {
    background-color: rgba(243, 156, 18, 0.1);
    color: var(--accent-orange);
}

.status.danger {
    background-color: rgba(231, 76, 60, 0.1);
    color: var(--accent-red);
}

/* Tab Styles */
.tabs-container {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    margin-bottom: 15px;
    overflow-x: auto;
}

.tab-button {
    background-color: transparent;
    border: none;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gh-text-color);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
}

.tab-button:hover {
    color: var(--gh-primary-blue);
    border-color: var(--gh-primary-blue-hover);
    opacity: 0.8;
}

.tab-button.active {
    color: var(--gh-primary-blue);
    border-color: var(--gh-primary-blue);
    font-weight: 600;
}

.tab-content {
    display: none;
    max-height: 400px;
    overflow-y: auto;
}

.tab-content.active {
    display: block;
}

.no-data {
    color: var(--gh-text-color-secondary);
    font-style: italic;
    text-align: center;
    padding: 20px;
}
</style>
