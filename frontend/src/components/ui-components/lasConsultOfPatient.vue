<script setup>
/**
 * Component to display the last consultation of a patient.
 * It fetches the last consultation details, prescriptions, and analyses.
 * Props:
 * - patientId: ID of the patient to fetch the last consultation for.
 * - consultationsId: ID of the current consultation to avoid displaying it again.
 * @author David MUKOKO <@necronemesis>
 */
import { ref, defineProps, watch, computed } from 'vue';
import { 
    getLastConsultationByPatientId,
    updatePreviousConsultation 
} from '@/utils/consultation';

import { getPrescriptionsWithExamsByConsultationId, getPrescriptionsByConsultation } from '@/utils/prescription';
import { getExamenDetailsByPrescriptionId } from '@/utils/examensMedicaux';
import { scrollToSection } from '../tools';


const props = defineProps({
    patientId: {
        type: String,
        required: false
    },
    consultationsId: {
        type: String,
        required: true
    },
    consultationsPrecedenteId: {
        type: String,
        default: ''
    }
})

const consultations = ref({})
const analyses = ref([])
const resultats = ref([])
const prescription = ref([])
const activeTab = ref('report');

// Computed property to determine if the component should be displayed
// It checks if the current consultation ID is different from the provided consultationsId prop
const shouldDisplay = computed(() => {
    if (consultations.value && consultations.value.id_consultation) {
        return consultations.value.id_consultation !== props.consultationsId;
    }
    return true;
});

const setActiveTab = (tab) => {
    activeTab.value = tab;
};

const fetshLastConsutation = async () => {
    if (!props.patientId) {
        consultations.value = {};
        return;
    }
    try {
        const result = await getLastConsultationByPatientId(props.patientId);
        consultations.value = result || {};
        console.log(consultations.value);
        if (consultations.value.id_consultation) {
            fetchPrescriptions();
            fetchAnalyses();
        }
    } catch (error) {
        consultations.value = {}
        console.log(error);
    }
}
const fetchPrescriptions = async () => {
    console.log('la fonction la', consultations.value.id_consultation);
    
    if (!consultations.value.id_consultation) return;
    try {
        const result = await getPrescriptionsByConsultation(consultations.value.id_consultation);
        prescription.value = result || [];
        console.log('les prescriptions', prescription.value);
    } catch (error) {
        prescription.value = []
        console.log(error);
    }
}

const linkConsultation = () => {
    if (!consultations.value.id_consultation || !props.consultationsId) return;
    if (confirm('Voulez-vous lier cette consultation à la précédente ?')) {
        updatePreviousConsultation(props.consultationsId,  consultations.value.id_consultation)
            .then(() => {
                alert('Consultation liée avec succès.');
            })
            .catch((error) => {
                console.error('Erreur lors de la liaison des consultations:', error);
                alert('Une erreur est survenue lors de la liaison des consultations.');
            });
        
    }
}

const fetchAnalyses = async () => {
    if (!consultations.value.id_consultation) return;
    try {
        const result = await getPrescriptionsWithExamsByConsultationId(consultations.value.id_consultation);
        analyses.value = result || [];
        console.log('les analyses', analyses.value);
    } catch (error) {
        analyses.value = []
        console.log(error);
    }
}

const showResultatSection = ref(false)
const showResutalt = (prescriptionID) => {
    showResultatSection.value = true
    getExamenDetailsByPrescriptionId(prescriptionID).then((res) => {
        console.log(res);
        resultats.value = res || []
        console.log(analyses.value);
    }).catch((err) => {
        console.log(err);
    })

    setTimeout(() => {
        scrollToSection('exam-result-item');
    }, 100);
}

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(' à ', ' - ');
};

const getStatusClass = (statut) => {
    if (statut === 'Réalisé') {
        return 'status completed';
    } else {
        return 'status pending';
    }
};

watch(() => props.patientId, fetshLastConsutation, { immediate: true })
</script>
<template>
    <!-- <pre>{{ consultations }}</pre> -->
    <section class="mb-3" v-if="shouldDisplay">
        <div v-if="consultations && consultations.id_consultation">
            <h3 class="section-header">Dernière Consultation</h3>
            <ul class="consultation-list">
                <li class="consultation-item">
                    <div class="consultation-info w-100">
                        <h3><i class="fa fa-stethoscope"></i> Consultation du - {{ new
                            Date(consultations.date_consultation).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) }}</h3>
                        <div class="tabs">
                            <button class="tab-button" :class="{ active: activeTab === 'report' }"
                                @click="setActiveTab('report')">Compte-rendu</button>
                            <button class="tab-button" :class="{ active: activeTab === 'analyses' }"
                                @click="setActiveTab('analyses')">Analyses</button>
                            <button class="tab-button" :class="{ active: activeTab === 'prescriptions' }"
                                @click="setActiveTab('prescriptions')">Prescriptions</button>
                        </div>

                        <div class="tab-content" :class="{ active: activeTab === 'report' }">
                            <p><strong>Motif:</strong> {{ consultations.motif_consultation || 'Non renseigner'}}</p>
                            <p><strong>Hypothèses diagnostiques:</strong> {{ consultations.hypotheses_diagnostiques || 'Non renseigner'}}
                            </p>

                            <p v-if="!props.consultationsPrecedenteId"><strong>Liée à la consultation:</strong> Aucune</p>
                            <p v-else><strong class="status completed">Liée à cette consultation</strong></p>

                            <div class="text-right">
                                <button class="btn btn-primary mr-2" v-if="consultations.id_consultation != props.consultationsPrecedenteId" @click="linkConsultation">lier la consultation à celle-ci</button>
                            </div>
                        </div>
                        <div class="tab-content" :class="{ active: activeTab === 'analyses' }">
                            <p><strong>Analyses demandées:</strong></p>
                            <table v-if="analyses && analyses.some(p => p.examens && p.examens.length > 0)" class="data-table">
                                <thead>
                                    <tr>
                                        <th>Type Examen</th>
                                        <th>Nom Examen</th>
                                        <!-- <th>Instructions</th> -->
                                        <!-- <th>Priorité</th> -->
                                        <th>Statut</th>
                                        <th>Date Demande</th>
                                        <th>actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="examen in analyses.flatMap(p => p.examens || [])" :key="examen.id_prescription_examen">
                                        <td>{{ examen.type_examen }}</td>
                                        <td>{{ examen.nom_examen }}</td>
                                        <!-- <td>{{ examen.instructions }}</td> -->
                                        <!-- <td>{{ examen.priorite }}</td> -->
                                        <td><span class="status" :class="{panding: examen.statut_examen === 'En attente', completed: examen.statut_examen === 'Réalisé' }">{{ examen.statut_examen }}</span></td>
                                        <td>{{ new Date(examen.date_demande).toLocaleDateString('fr-FR') }}</td>
                                        <td style="text-align: center;">
                                            <button class="btn btn-sm btn-primary"  v-if="examen.statut_examen === 'En attente'">Réaliser</button>
                                            <button class="btn btn-sm text-primary" @click="showResutalt(examen.id_prescription_examen)" v-else><i class="fa fa-eye"></i></button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-else>Aucune analyse demandée pour cette consultation.</p>
                            
                            <section v-if="showResultatSection">
                                <hr>
                                <div class="exam-results-container">
                                    <!-- <div class="metadata-grid" v-if="resultats.length > 0">
                                        <div class="metadata-item">
                                            <strong>Patient</strong>
                                            <span>{{ resultats[0].prenoms_patient }} {{ resultats[0].nom_patient }}</span>
                                        </div>
                                        <div class="metadata-item">
                                            <strong>Date de Naissance</strong>
                                            <span>{{ formatDate(resultats[0].date_naissance) }}</span>
                                        </div>
                                        <div class="metadata-item">
                                            <strong>Professionnel</strong>
                                            <span>{{ resultats[0].prenoms_professionnel }} {{ resultats[0].nom_professionnel }}</span>
                                        </div>
                                        <div class="metadata-item">
                                            <strong>Spécialité</strong>
                                            <span>{{ resultats[0].specialite }}</span>
                                        </div>
                                    </div> -->
                                    <div v-for="examen in resultats" :key="examen.id_prescription_examen" class="exam-result-item" id="exam-result-item">
                                        <h3>
                                            <span><i class="fa fa-flask"></i> {{ examen.nom_examen }} ({{ examen.type_examen }})</span>
                                            <span :class="getStatusClass(examen.statut_examen)">{{ examen.statut_examen }}</span>
                                        </h3>
                                        <div class="metadata-grid exam-metadata-grid">
                                            <div class="metadata-item">
                                                <strong>Date de l'Examen</strong>
                                                <span>{{ formatDate(examen.date_examen) }}</span>
                                            </div>
                                            <div class="metadata-item">
                                                <strong>Date de la Demande</strong>
                                                <span>{{ formatDate(examen.date_demande) }}</span>
                                            </div>
                                            <div class="metadata-item">
                                                <strong>Instructions</strong>
                                                <span>{{ examen.instructions || 'Aucune' }}</span>
                                            </div>
                                            <div class="metadata-item">
                                                <strong>Priorité</strong>
                                                <span>{{ examen.priorite }}</span>
                                            </div>
                                        </div>
                                        <div class="report-section">
                                            <h4><i class="fa fa-bar-chart"></i> Résultats bruts</h4>
                                            <div class="report-content">
                                                {{ examen.resultats || 'Résultats en attente' }}
                                            </div>
                                        </div>
                                        <div class="report-section">
                                            <h4><i class="fa fa-comments-o"></i> Compte-rendu & Interprétation</h4>
                                            <div class="compte-rendu-content">
                                                {{ examen.compte_rendu || 'Compte-rendu en attente' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                            </section>
                        </div>
                        <div class="tab-content" :class="{ active: activeTab === 'prescriptions' }">
                            <p><strong>Prescriptions:</strong></p>
                            <table v-if="prescription && prescription.some(p => p.lignes && p.lignes.length > 0)" class="data-table">
                                <thead>
                                    <tr>
                                        <th>Nom Médicament</th>
                                        <th>Dosage</th>
                                        <th>Forme</th>
                                        <th>Posologie</th>
                                        <th>Quantité</th>
                                        <th>Durée (jours)</th>
                                        <th>Notes Spécifiques</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="ligne in prescription.flatMap(p => p.lignes || [])" :key="ligne.id_ligne_prescription">
                                        <td>{{ ligne.nom_medicament }}</td>
                                        <td>{{ ligne.dosage_medicament }}</td>
                                        <td>{{ ligne.forme_medicament }}</td>
                                        <td>{{ ligne.posologie }}</td>
                                        <td>{{ ligne.quantite_prescrite }}</td>
                                        <td>{{ ligne.duree_traitement_jours }}</td>
                                        <td>{{ ligne.notes_specifiques || 'Aucune'}}</td>
                                        
                                    </tr>
                                </tbody>
                            </table>
                            <p v-else>Aucune prescription avec lignes pour cette consultation.</p>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else>
            <p>Aucune consultation antérieure trouvée pour ce patient.</p>
        </div>

    </section>
</template>

<style scoped>
/* *{
    border: solid 1px red;
} */
.dossier-section-header>h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    /* border-bottom: 1px solid var(--gh-border-color); */
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Styles pour la liste des consultations */
.consultation-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 800px;
    /* Hauteur maximale pour le défilement */
    overflow-y: auto;
    /* Active le défilement */
}

.consultation-item {
    display: flex;
    flex-direction: column;
    padding: 15px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    margin-bottom: 10px;
    background-color: var(--gh-header-bg);
    cursor: pointer;
    transition: background-color 0.2s;
}

/* .consultation-item:hover {
    background-color: #e6edf4;
} */

.consultation-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.consultation-info h3 i {
    color: var(--gh-primary-blue);
}

.consultation-info p {
    font-size: 14px;
    margin: 2px 0;
    color: #586069;
}

/* Styles pour les tabs */
.tabs {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    margin-top: 10px;
}

.tab-button {
    padding: 8px 16px;
    cursor: pointer;
    border: none;
    background-color: transparent;
    font-weight: 600;
    color: #586069;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
}

.tab-button.active {
    color: var(--gh-text-color);
    border-bottom: 2px solid var(--gh-primary-blue);
}

.tab-content {
    padding-top: 15px;
    display: none;
}

.tab-content.active {
    display: block;
}

.metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
    padding: 15px;
    background-color: var(--gh-input-bg);
    border-radius: 6px;
    border: 1px solid var(--gh-border-color);
}

.metadata-item {
    font-size: 14px;
    line-height: 1.5;
}

.metadata-item strong {
    display: block;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    margin-bottom: 4px;
    text-transform: uppercase;
    font-size: 12px;
}

.exam-metadata-grid {
    margin-bottom: 0;
    padding: 10px;
    background-color: var(--gh-card-bg);
}

.exam-result-item {
    border: 1px solid var(--gh-primary-blue-light-border);
    border-radius: 6px;
    margin-bottom: 25px;
    padding: 20px;
    background-color: var(--gh-primary-blue-lighter-bg);
}

.exam-result-item:last-child {
    margin-bottom: 0;
}

.exam-result-item h3 {
    font-size: 18px;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 15px;
    border-bottom: 1px dashed var(--gh-primary-blue-light-border);
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.exam-result-item h3 span:first-child {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--gh-primary-blue);
}

.report-section {
    margin-top: 20px;
    margin-bottom: 20px;
    border-left: 4px solid var(--gh-primary-blue-light-border);
    padding-left: 20px;
}

.report-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--gh-text-color-secondary);
}

.report-content {
    background-color: var(--gh-card-bg);
    padding: 15px;
    border: 1px dashed var(--gh-border-color);
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 14px;
}

.compte-rendu-content {
    background-color: var(--gh-navbar-link-hover);
    padding: 15px;
    border-left: 3px solid var(--gh-success-green);
    border-radius: 4px;
    line-height: 1.6;
    font-size: 15px;
}

/* .status {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 2em;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-left: 10px;
}

.status.completed {
    background-color: var(--gh-success-green);
    color: #fff;
}

.status.pending {
    background-color: var(--gh-warning-yellow);
    color: #000;
} */
</style>
