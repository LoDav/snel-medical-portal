<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { getPatientFullById, updatePatient } from '@/utils/patient';
import { getConsultationsByPatientId, getLastConsultationByPatientId } from '@/utils/consultation';
import { getConstantesVitalesByPatientId } from '@/utils/constantesVitales';
import { getExamensByPatientId } from '@/utils/examensMedicaux';
import { getPrescriptionsWithAllDetailsByConsultationId } from '@/utils/prescription';
import { useToast } from 'vue-toastification';
import Chart from 'chart.js/auto';

const props = defineProps({
    patientId: {
        type: [String, Number],
        required: false,
        default: null
    },
    isOpen: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const patientData = ref(null);
const consultations = ref([]);
const lastConsultation = ref(null);
const latestConstants = ref(null);
const historyConstants = ref([]);
const examens = ref([]);
const prescriptions = ref([]);
const isLoading = ref(true);
const activeTab = ref('resume'); // 'resume', 'examens', 'traitements'
const chartType = ref('tension'); // 'tension', 'poids'

const toast = useToast();
const isEditingBloodGroup = ref(false);
const editBloodGroup = ref('');
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

let mainChart = null;
const mainChartRef = ref(null);

const fetchDossierData = async () => {
    if (!props.patientId) {
        console.warn("PatientId manquant pour le chargement du dossier.");
        return;
    }

    isLoading.value = true;
    patientData.value = null;
    consultations.value = [];
    lastConsultation.value = null;

    try {
        // 1. Appel principal pour les données du patient
        try {
            patientData.value = await getPatientFullById(props.patientId);
        } catch (e) {
            console.error("Erreur critique: Impossible de charger le profil patient", e);
        }

        // 2. Appels secondaires (ne doivent pas bloquer si erreur 404/vide)
        try {
            consultations.value = await getConsultationsByPatientId(props.patientId) || [];
        } catch (e) {
            console.warn("Pas d'historique trouvé ou erreur lors du chargement:", e);
        }

        try {
            lastConsultation.value = await getLastConsultationByPatientId(props.patientId);
        } catch (e) {
            console.warn("Pas de dernière consultation trouvée:", e);
        }

        try {
            const constantsList = await getConstantesVitalesByPatientId(props.patientId);
            if (constantsList && constantsList.length > 0) {
                latestConstants.value = constantsList[0]; // La plus récente
                historyConstants.value = [...constantsList].reverse(); // Pour le graphique
                renderCharts();
            }
        } catch (e) {
            console.warn("Erreur lors de la récupération des constantes:", e);
        }

        // 4. Récupération des examens médicaux
        try {
            examens.value = await getExamensByPatientId(props.patientId) || [];
        } catch (e) {
            console.warn("Erreur lors de la récupération des examens:", e);
        }

        // 5. Récupération des prescriptions de la dernière consultation (ou toutes)
        if (lastConsultation.value) {
            try {
                const results = await getPrescriptionsWithAllDetailsByConsultationId(lastConsultation.value.id_consultation);
                prescriptions.value = results || [];
            } catch (e) {
                console.warn("Erreur lors de la récupération des prescriptions:", e);
            }
        }

    } catch (error) {
        console.error("Erreur générale lors du chargement du dossier patient:", error);
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.patientId, (newId) => {
    if (newId && props.isOpen) {
        fetchDossierData();
    }
}, { immediate: true });

watch(() => props.isOpen, (newVal) => {
    if (newVal && props.patientId) {
        fetchDossierData();
    }
});

watch(chartType, () => {
    renderCharts();
});

watch(activeTab, (newTab) => {
    if (newTab === 'resume') {
        renderCharts();
    }
});

const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('fr-FR');
};

const formatDateTime = (dateString) => {
    if (!dateString || dateString === '0000-00-00 00:00:00') return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const calculateAge = (dateNaissance) => {
    if (!dateNaissance || dateNaissance === '0000-00-00') return '';
    const birthDate = new Date(dateNaissance);
    if (isNaN(birthDate.getTime())) return '';
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const getDoctorName = (consult) => {
    if (!consult.professionnel_info) return 'Non renseigné';
    let info = consult.professionnel_info;

    // Si c'est une chaîne (JSON string), on la parse
    if (typeof info === 'string') {
        try { info = JSON.parse(info); } catch (e) { return 'Erreur format'; }
    }

    // Vérifier si on a un nom ou prénom (si id_professionnel était null, les champs sont null)
    if (!info.nom && !info.prenoms) return 'Non assigné';

    return `${info.nom} ${info.prenoms}`;
};

const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    // On assume que c'est un chemin relatif servi par le backend
    return `http://localhost:3000/${photoPath}`;
};

const startEditBloodGroup = () => {
    editBloodGroup.value = patient.value.groupe_sanguin || '';
    isEditingBloodGroup.value = true;
};

const saveBloodGroup = async () => {
    try {
        const p = patient.value;
        const patientDataUpdate = {
            nom: p.nom,
            prenoms: p.prenoms,
            post_nom: p.post_nom,
            date_naissance: p.date_naissance ? new Date(p.date_naissance).toISOString().split('T')[0] : null,
            sexe: p.sexe,
            groupe_sanguin: editBloodGroup.value,
            adresse: p.adresse,
            telephone: p.telephone,
            email: p.email,
            type_patient: p.type_patient,
            id_agent_snel: p.id_agent_snel,
            id_ayant_droit: p.id_ayant_droit
        };

        await updatePatient(props.patientId, patientDataUpdate);
        toast.success("Groupe sanguin mis à jour !");

        // Rafraîchir les données
        await fetchDossierData();
        isEditingBloodGroup.value = false;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du groupe sanguin:", error);
        toast.error("Erreur lors de la mise à jour.");
    }
};

const renderCharts = () => {
    if (!historyConstants.value.length) return;

    // Attendre que le DOM soit mis à jour
    setTimeout(() => {
        const ctx = mainChartRef.value?.getContext('2d');
        if (!ctx) return;

        if (mainChart) mainChart.destroy();

        const labels = historyConstants.value.map(c => {
            const d = new Date(c.date_mesure);
            return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        });

        if (chartType.value === 'tension') {
            const systolic = historyConstants.value.map(c => c.tension_arterielle_systolique);
            const diastolic = historyConstants.value.map(c => c.tension_arterielle_diastolique);

            mainChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Systolique', data: systolic, borderColor: '#d73a49', backgroundColor: 'rgba(215, 58, 73, 0.1)', borderWidth: 2, tension: 0.3, fill: true },
                        { label: 'Diastolique', data: diastolic, borderColor: '#0366d6', backgroundColor: 'rgba(3, 102, 214, 0.1)', borderWidth: 2, tension: 0.3, fill: true }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    resizeDelay: 200,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } }
                    },
                    scales: {
                        y: { ticks: { font: { size: 9 } } },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            });
        } else {
            const weights = historyConstants.value.map(c => c.poids_kg);
            mainChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Poids (kg)',
                        data: weights,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    resizeDelay: 200,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } }
                    },
                    scales: {
                        y: { ticks: { font: { size: 9 } } },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            });
        }
    }, 100);
};

const patient = computed(() => patientData.value?.patient_principal || {});
const ayantsDroitAvailable = computed(() => patientData.value?.ayants_droit || []);
const agentAffiliation = computed(() => patientData.value?.agent_affiliation || null);

const isVisitingToday = computed(() => {
    if (!consultations.value.length) return false;
    // Utiliser le format local YYYY-MM-DD (en-CA donne ce format) pour éviter les décalages UTC
    const today = new Date().toLocaleDateString('en-CA');
    return consultations.value.some(c => {
        const d = new Date(c.created_at || c.date_consultation);
        const consultDate = d.toLocaleDateString('en-CA');
        return consultDate === today;
    });
});

onMounted(() => {
    if (props.isOpen) {
        fetchDossierData();
    }
});
</script>

<template>
    <div v-if="isOpen" class="dossier-overlay" @click.self="emit('close')">
        <div class="dossier-modal animate-in">
            <header class="dossier-header">
                <div class="header-left">
                    <button class="btn-back" @click="emit('close')">
                        <i class="fa fa-chevron-left"></i> Retour
                    </button>
                    <h2>Dossier Médical</h2>
                </div>
                <!-- <div class="header-right">
                    <button class="btn btn-outline"><i class="fa fa-print"></i> Imprimer</button>
                    <button class="btn btn-primary" @click="emit('close')"><i class="fa fa-times"></i> Fermer</button>
                </div> -->
            </header>

            <div v-if="isLoading" class="dossier-loading">
                <i class="fa fa-spinner fa-spin"></i> Chargement des données...
            </div>

            <div v-else class="dossier-body scrollable">
                <!-- PATIENT PROFILE HEADER -->
                <section class="profile-section">
                    <div class="profile-flex">
                        <div class="avatar-circle">
                            <img v-if="patient.photo" :src="getPhotoUrl(patient.photo)" alt="Photo"
                                class="profile-photo">
                            <i v-else class="fa fa-user"></i>
                        </div>
                        <div class="profile-info">
                            <div class="name-row">
                                <h1>{{ patient.nom }} {{ patient.prenoms }} {{ patient.post_nom }}</h1>
                                <span class="badge"
                                    :class="patient.type_patient === 'Agent' ? 'badge-blue' : 'badge-orange'">
                                    {{ patient.type_patient === 'Agent' ? 'AGENT SNEL' : 'AYANT-DROIT' }}
                                </span>
                                <span v-if="isVisitingToday" class="status completed" style="margin-left: 10px;">
                                    <i class="fa fa-stethoscope"></i> En visite aujourd'hui
                                </span>
                            </div>
                            <p class="meta">
                                <span v-if="patient.matricule_snel">Matricule: <b>{{ patient.matricule_snel }}</b> •
                                </span>
                                Né(e) le {{ formatDate(patient.date_naissance) }} ({{
                                    calculateAge(patient.date_naissance) }} ans) • {{ patient.sexe }}
                            </p>
                            <div class="contact-info">
                                <span><i class="fa fa-phone"></i> {{ patient.telephone || 'Non renseigné' }}</span>
                                <span><i class="fa fa-envelope"></i> {{ patient.email || 'Non renseigné' }}</span>
                                <span><i class="fa fa-map-marker"></i> {{ patient.adresse || 'N/A' }}</span>
                            </div>
                        </div>
                        <div class="summary-top text-right">
                            <div v-if="lastConsultation" class="last-diagnosis">
                                <div class="stat-label">DERNIER DIAGNOSTIC</div>
                                <div class="diag-badge">{{ lastConsultation.diagnostic || 'Non spécifié' }}</div>
                            </div>
                            <div class="blood-group mt-15">
                                <div class="stat-label">GROUPE SANGUIN</div>
                                <div v-if="!isEditingBloodGroup" class="blood-display" @click="startEditBloodGroup"
                                    title="Cliquer pour modifier">
                                    <div class="stat-value blood">{{ patient.groupe_sanguin || '??' }}</div>
                                    <i class="fa fa-edit edit-icon-hint"></i>
                                </div>
                                <div v-else class="blood-edit-controls">
                                    <select v-model="editBloodGroup" class="blood-select">
                                        <option value="">--</option>
                                        <option v-for="bg in bloodGroups" :key="bg" :value="bg">{{ bg }}</option>
                                    </select>
                                    <div class="edit-actions">
                                        <button class="btn-action-save" @click="saveBloodGroup" title="Sauvegarder">
                                            <i class="fa fa-check"></i>
                                        </button>
                                        <button class="btn-action-cancel" @click="isEditingBloodGroup = false"
                                            title="Annuler">
                                            <i class="fa fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-title-row">
                        <div class="stats-grid-title">Dernières Constantes</div>
                        <div v-if="latestConstants" class="stats-date">
                            <i class="fa fa-calendar-alt"></i> Mesuré le {{ formatDateTime(latestConstants.date_mesure)
                            }}
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Dernière Tension</div>
                            <div class="stat-value">
                                {{ latestConstants?.tension_arterielle_systolique || '--' }}/{{
                                    latestConstants?.tension_arterielle_diastolique || '--' }}
                                <small>mmHg</small>
                            </div>
                            <div class="trend-indicator up" v-if="latestConstants?.tension_arterielle_systolique > 140">
                                Hypertension</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Poids / Taille</div>
                            <div class="stat-value">
                                {{ latestConstants?.poids_kg || '--' }}kg / {{ latestConstants?.taille_cm || '--' }}cm
                            </div>
                            <div class="text-muted mini">IMC: {{ (latestConstants?.poids_kg /
                                ((latestConstants?.taille_cm / 100) ** 2)).toFixed(1) || '--' }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Température</div>
                            <div class="stat-value">{{ latestConstants?.temperature_celsius || '--.-' }}°C</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Pouls</div>
                            <div class="stat-value">{{ latestConstants?.pouls_bpm || '--' }} <small>bpm</small></div>
                        </div>
                    </div>

                    <div class="dossier-tabs">
                        <button class="d-tab" :class="{ active: activeTab === 'resume' }"
                            @click="activeTab = 'resume'">Résumé Clinique</button>
                        <button class="d-tab" :class="{ active: activeTab === 'examens' }"
                            @click="activeTab = 'examens'">Examens ({{ examens.length }})</button>
                        <button class="d-tab" :class="{ active: activeTab === 'traitements' }"
                            @click="activeTab = 'traitements'">Traitements</button>
                    </div>
                </section>

                <div class="dossier-grid">
                    <!-- LEFT COLUMN -->
                    <div class="dossier-left">
                        <!-- RESUME TAB -->
                        <div v-if="activeTab === 'resume'">
                            <!-- CHART CARD WITH DROPDOWN -->
                            <div class="section-card">
                                <div class="dossier-card-header chart-header">
                                    <span><i class="fa fa-chart-line"></i> Évolution des Paramètres</span>
                                    <select v-model="chartType" class="chart-select">
                                        <option value="tension">Tension Artérielle</option>
                                        <option value="poids">Poids Corporel</option>
                                    </select>
                                </div>
                                <div class="chart-box main-chart-box">
                                    <canvas v-show="historyConstants.length > 0" ref="mainChartRef"></canvas>
                                    <div v-if="historyConstants.length === 0" class="empty-chart-msg">
                                        <i class="fa fa-chart-line"></i>
                                        <p>Aucune donnée historique disponible pour l'instant.</p>
                                        <span>Les mesures s'afficheront ici après plusieurs consultations.</span>
                                    </div>
                                </div>
                            </div>

                            <div class="section-card">
                                <div class="dossier-card-header">
                                    <span><i class="fa fa-history"></i> Historique des Consultations</span>
                                </div>
                                <div class="timeline">
                                    <div v-for="consult in consultations" :key="consult.id_consultation"
                                        class="timeline-item">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-content">
                                            <div class="timeline-date">{{ formatDateTime(consult.created_at) }}</div>
                                            <div class="timeline-title">{{ consult.motif_consultation || 'Consultation'
                                                }}
                                            </div>
                                            <div class="timeline-meta">
                                                <div class="meta-item">
                                                    <i class="fa fa-user-md"></i> <b>Méd. :</b> {{
                                                        getDoctorName(consult) }}
                                                </div>
                                                <div class="meta-item">
                                                    <i class="fa fa-stethoscope"></i> <b>Diag. :</b> {{
                                                        consult.diagnostic || 'Non renseigné' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="consultations.length === 0" class="empty-timeline">
                                        Aucune consultation enregistrée.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- EXAMENS TAB -->
                        <div v-if="activeTab === 'examens'">
                            <div class="section-card">
                                <div class="dossier-card-header">
                                    <span><i class="fa fa-microscope"></i> Examens Médicaux & Labo</span>
                                </div>
                                <div class="exam-list">
                                    <div v-for="ex in examens" :key="ex.id_examen" class="doc-item-row">
                                        <div class="doc-icon"><i class="fa fa-file-medical"></i></div>
                                        <div class="doc-info">
                                            <div class="doc-name">{{ ex.nom_examen }}</div>
                                            <div class="doc-meta">{{ ex.type_examen }} • {{ formatDate(ex.date_examen)
                                                }}</div>
                                        </div>
                                        <div class="doc-status"
                                            :class="ex.statut_examen === 'Terminé' ? 'success' : 'pending'">
                                            {{ ex.statut_examen || 'Effectué' }}
                                        </div>
                                        <button v-if="ex.fichier_resultat_url" class="btn-icon-mini"><i
                                                class="fa fa-download"></i></button>
                                    </div>
                                    <div v-if="examens.length === 0" class="empty-msg">Aucun examen enregistré.</div>
                                </div>
                            </div>
                        </div>

                        <!-- TRAITEMENTS TAB -->
                        <div v-if="activeTab === 'traitements'">
                            <div class="section-card">
                                <div class="dossier-card-header">
                                    <span><i class="fa fa-pills"></i> Ordonnances & Traitements</span>
                                </div>
                                <div class="prescription-list">
                                    <div v-for="presc in prescriptions" :key="presc.id_prescription"
                                        class="presc-group">
                                        <div class="presc-header">
                                            <span class="date">{{ formatDateTime(presc.date_prescription) }}</span>
                                            <span class="doc">Dr. {{ presc.professionnel_nom }}</span>
                                        </div>
                                        <div class="med-items">
                                            <div v-for="med in presc.medicaments" :key="med.id_ligne_prescription"
                                                class="med-row">
                                                <i class="fa fa-prescription-bottle"></i>
                                                <b>{{ med.nom_medicament }}</b> - {{ med.posologie }} ({{
                                                    med.duree_traitement_jours }}j)
                                            </div>
                                            <div v-for="exam in presc.examens" :key="exam.id_prescription_examen"
                                                class="med-row exam">
                                                <i class="fa fa-vial"></i>
                                                Examen: {{ exam.nom_examen }} ({{ exam.statut_examen }})
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="prescriptions.length === 0" class="empty-msg">Aucun traitement récent
                                        trouvé.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: RELATIONS ET ALERTES -->
                    <div class="dossier-right">
                        <!-- VIGILANCE -->
                        <!-- <div class="section-card vigilance">
                            <div class="dossier-card-header danger">
                                <span><i class="fa fa-exclamation-triangle"></i> Vigilance Médicale</span>
                            </div>
                            <div class="vigilance-body">
                                <div class="alert-item allergy">
                                    <i class="fa fa-virus-slash"></i>
                                    <span>Allergies: Non renseigné</span>
                                </div>
                            </div>
                        </div> -->

                        <!-- AFFILIATION / AYANTS DROIT -->
                        <div class="section-card">
                            <div class="dossier-card-header">
                                <span v-if="patient.type_patient === 'Agent'"><i class="fa fa-users"></i> Ayants-droit
                                    Rattachés</span>
                                <span v-else><i class="fa fa-user-tie"></i> Agent Titulaire</span>
                            </div>
                            <div class="relations-body">
                                <template v-if="patient.type_patient === 'Agent'">
                                    <div v-for="ad in ayantsDroitAvailable" :key="ad.id_ayant_droit"
                                        class="relation-item">
                                        <div class="relation-avatar">
                                            <img v-if="ad.photo" :src="getPhotoUrl(ad.photo)" alt="AD">
                                            <i v-else class="fa fa-user"></i>
                                        </div>
                                        <div class="relation-info">
                                            <div class="relation-name">{{ ad.nom }} {{ ad.prenoms }}</div>
                                            <div class="relation-type">{{ ad.lien_parente }} • {{
                                                calculateAge(ad.date_naissance) }} ans</div>
                                        </div>
                                    </div>
                                    <div v-if="ayantsDroitAvailable.length === 0" class="empty-msg">Aucun ayant-droit
                                        rattaché.</div>
                                </template>
                                <template v-else-if="agentAffiliation">
                                    <div class="relation-item">
                                        <div class="relation-avatar">
                                            <img v-if="agentAffiliation.photo"
                                                :src="getPhotoUrl(agentAffiliation.photo)" alt="Agent">
                                            <span v-else>{{ agentAffiliation.nom.charAt(0) }}{{
                                                agentAffiliation.prenoms.charAt(0) }}</span>
                                        </div>
                                        <div class="relation-info">
                                            <div class="relation-name">{{ agentAffiliation.nom }} {{
                                                agentAffiliation.prenoms }}</div>
                                            <div class="relation-meta">Titulaire • Matricule: {{
                                                agentAffiliation.matricule_snel }}</div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dossier-overlay {
    /* position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px; */
    width: 100%;
}

.dossier-modal {
    background: var(--gh-bg-color);
    width: 100%;
    /* max-width: 1100px;
    height: 90vh; */
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    border: 1px solid var(--gh-border-color);
}

.dossier-header {
    padding: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    /*background: var(--gh-header-bg); */
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-left h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.btn-back {
    background: none;
    border: 1px solid var(--gh-border-color);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--gh-text-color);
    transition: 0.2s;
}

.btn-back:hover {
    background: var(--gh-navbar-link-hover);
}

.header-right {
    display: flex;
    gap: 10px;
}

.dossier-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 15px;
    color: var(--gh-text-color-secondary);
}

.dossier-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.scrollable::-webkit-scrollbar {
    width: 8px;
}

.scrollable::-webkit-scrollbar-thumb {
    background: var(--gh-border-color);
    border-radius: 4px;
}

/* PROFILE SECTION */
.profile-section {
    padding: 30px;
    background: var(--gh-bg-color);
    border-bottom: 1px solid var(--gh-border-color);
}

.profile-flex {
    display: flex;
    gap: 25px;
    align-items: flex-start;
}

.avatar-circle {
    width: 80px;
    height: 80px;
    background: var(--gh-header-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--gh-text-color-secondary);
    border: 3px solid var(--gh-card-bg);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.profile-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-info {
    flex: 1;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 5px;
}

.name-row h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
}

.profile-info .meta {
    margin: 0 0 12px 0;
    color: var(--gh-text-color-secondary);
    font-size: 14px;
}

.contact-info {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: var(--gh-text-color);
}

.contact-info i {
    color: var(--gh-text-color-secondary);
    width: 16px;
}

.summary-top {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.mt-15 {
    margin-top: 15px;
}

.last-diagnosis {
    background: #e6ffed;
    border: 1px solid #28a74540;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: center;
}

.diag-badge {
    color: #22863a;
    font-weight: 800;
    font-size: 14px;
    text-transform: uppercase;
    margin-top: 4px;
}

.blood-group {
    text-align: right;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    margin-bottom: 4px;
}

.stat-value {
    font-size: 18px;
    font-weight: 700;
}

.stat-value.blood {
    font-size: 32px;
    color: var(--gh-danger-red);
}

.blood-display {
    cursor: pointer;
    position: relative;
    display: inline-block;
}

.edit-icon-hint {
    position: absolute;
    top: -5px;
    right: -15px;
    font-size: 12px;
    color: var(--gh-text-color-secondary);
    opacity: 0;
    transition: 0.2s;
}

.blood-display:hover .edit-icon-hint {
    opacity: 1;
}

.blood-edit-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
}

.blood-select {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--gh-border-color);
    background: var(--gh-bg-color);
    color: var(--gh-danger-red);
    font-weight: 800;
    font-size: 18px;
    width: 70px;
    text-align: center;
}

.edit-actions {
    display: flex;
    gap: 5px;
}

.btn-action-save,
.btn-action-cancel {
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: 0.2s;
}

.btn-action-save {
    background: #28a745;
    color: white;
}

.btn-action-cancel {
    background: #d73a49;
    color: white;
}

.btn-action-save:hover,
.btn-action-cancel:hover {
    filter: brightness(1.2);
}

.badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
}

.badge-blue {
    background: var(--gh-badge-agent-bg);
    color: var(--gh-badge-agent-text);
}

.badge-orange {
    background: var(--gh-badge-ayant-droit-bg);
    color: var(--gh-badge-ayant-droit-text);
}

/* STATS GRID */
/* VITAL SIGNS HEADER */
.section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
    margin-bottom: 10px;
}

.stats-grid-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gh-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stats-date {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
}

.stats-date i {
    font-size: 11px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-top: 0;
}

.stat-card {
    background: var(--gh-header-bg);
    border: 1px solid var(--gh-border-color);
    padding: 15px;
    border-radius: 8px;
    position: relative;
}

.trend-indicator {
    font-size: 10px;
    font-weight: 700;
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 2px 6px;
    border-radius: 10px;
}

.trend-indicator.up {
    background: #ffeef0;
    color: #d73a49;
}

.mini {
    font-size: 11px;
    margin-top: 5px;
}

.dossier-tabs {
    display: flex;
    gap: 25px;
    margin-top: 30px;
    border-bottom: 1px solid var(--gh-border-color);
}

.d-tab {
    background: none;
    border: none;
    padding: 10px 5px;
    font-size: 14px;
    color: var(--gh-text-color-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: 0.2s;
}

.d-tab.active {
    color: var(--gh-text-color);
    border-bottom-color: #f9826c;
    font-weight: 600;
}

/* GRID CONTENT */
.dossier-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
    padding: 30px;
}

.section-card {
    background: var(--gh-bg-color);
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 25px;
}

.dossier-card-header {
    background: var(--gh-header-bg);
    padding: 12px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
}

.dossier-card-header.danger {
    background: rgba(215, 58, 73, 0.1);
    color: var(--gh-danger-red);
    border-bottom: 1px solid var(--gh-danger-red);
}

.chart-box {
    padding: 20px;
    height: 200px;
}

.main-chart-box {
    height: 250px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-select {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--gh-border-color);
    background: var(--gh-bg-color);
    font-size: 12px;
    font-weight: 600;
    color: var(--gh-text-color);
    cursor: pointer;
    outline: none;
}

.chart-select:hover {
    border-color: var(--gh-primary-blue);
}

.empty-chart-msg {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--gh-text-color-secondary);
    text-align: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
}

.empty-chart-msg i {
    font-size: 24px;
    opacity: 0.3;
}

.empty-chart-msg p {
    margin: 0;
    font-weight: 600;
    font-size: 14px;
}

.empty-chart-msg span {
    font-size: 11px;
}

/* TIMELINE */
.timeline {
    padding: 20px 25px;
    position: relative;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 29px;
    top: 25px;
    bottom: 25px;
    width: 2px;
    background: var(--gh-border-color);
}

.timeline-item {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    position: relative;
}

.timeline-dot {
    width: 10px;
    height: 10px;
    background: var(--gh-bg-color);
    border: 2px solid var(--gh-primary-blue);
    border-radius: 50%;
    z-index: 1;
    margin-top: 5px;
}

.timeline-content {
    flex: 1;
}

.timeline-date {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
    margin-bottom: 3px;
}

.timeline-title {
    font-weight: 600;
    font-size: 14px;
}

.timeline-meta {
    font-size: 13px;
    color: var(--gh-text-color-secondary);
    margin-top: 5px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.meta-item i {
    width: 14px;
    text-align: center;
    opacity: 0.7;
}

/* VIGILANCE & RELATIONS */
.vigilance-body,
.relations-body {
    padding: 15px 20px;
}

.alert-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 10px;
}

.alert-item.allergy {
    background: rgba(215, 58, 73, 0.1);
    color: var(--gh-danger-red);
    border: 1px solid var(--gh-danger-red);
}

.relation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--gh-border-color);
}

.relation-item:last-child {
    border-bottom: none;
}

.relation-avatar,
.avatar-mini {
    width: 32px;
    height: 32px;
    background: var(--gh-header-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--gh-text-color-secondary);
    overflow: hidden;
}

.relation-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.relation-info {
    flex: 1;
}

.relation-name {
    font-weight: 600;
    font-size: 13px;
}

.relation-meta {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

.empty-msg {
    text-align: center;
    color: var(--gh-text-color-secondary);
    font-size: 13px;
    padding: 10px 0;
}

/* ANIMATIONS */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeIn 0.4s ease-out;
}

.btn {
    padding: 8px 16px;
    border-radius: var(--border-radius);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--gh-border-color);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: 0.2s;
}

.btn-primary {
    background: var(--gh-primary-blue);
    color: white;
    border: none;
}

.btn-outline {
    background: var(--gh-bg-color);
    color: var(--gh-text-color);
}

.btn:hover {
    filter: brightness(0.95);
}

/* EXAMS & PRESC LISTS */
.doc-item-row {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid var(--gh-border-color);
}

.doc-info {
    flex: 1;
}

.doc-name {
    font-weight: 600;
    font-size: 13px;
}

.doc-meta {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

.doc-status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.doc-status.success {
    background: #e6ffed;
    color: #22863a;
}

.doc-status.pending {
    background: #fff5eb;
    color: #c69105;
}

.presc-group {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
}

.presc-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--gh-text-color-secondary);
    margin-bottom: 8px;
    text-transform: uppercase;
}

.med-row {
    font-size: 13px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.med-row i {
    color: var(--gh-primary-blue);
    font-size: 11px;
}

.med-row.exam i {
    color: var(--gh-danger-red);
}

.btn-icon-mini {
    background: none;
    border: 1px solid var(--gh-border-color);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--gh-text-color-secondary);
}
</style>
