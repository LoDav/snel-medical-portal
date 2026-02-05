<script setup>
/**
 * Appointments Management Component for Receptionist
 * Displays daily planning, doctor load, and allows appointment management.
 * Author: Antigravity (Assistant)
 * Date: 2026-02-02
 */

import { onMounted, ref, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';
import {
    getTodayRendezVousWithDetails,
    getRendezVousByPeriodWithDetails,
    updateStatutRendezVous
} from '@/utils/rendezVous';
import { getAllMedecins } from '@/utils/professionnel';
import { initConsultationRdv } from '@/utils/consultation';
import { formatDate } from '../tools';

// Components
import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';

const router = useRouter();
const rendezVousList = ref([]);
const doctorsList = ref([]);
const searchQuery = ref('');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const periodFilter = ref('today'); // 'today', 'week', 'month', 'custom'
const isLoading = ref(true);
const showArrivalModal = ref(false);
const selectedRdv = ref(null);
const redirectToDoctor = ref('');
const skipTriage = ref(true); // Default to true based on user request "en attente de consultation"
let refreshInterval = null;

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'fa fa-home',
        path: '/secretaire/tableau-de-bord',
        active: false
    },
    {
        id: 2,
        name: 'Rendez-vous',
        icon: 'fa fa-calendar-plus-o',
        path: '/secretaire/rendezvous',
        active: true
    },
    {
        id: 3,
        name: 'Identification et creation',
        icon: 'fa fa-id-card',
        path: '/secretaire/identification-create',
        active: false
    }
];

// Fetch all data
const fetchData = async () => {
    try {
        let rdvData;
        if (periodFilter.value === 'custom') {
            rdvData = await getTodayRendezVousWithDetails(selectedDate.value);
        } else {
            rdvData = await getRendezVousByPeriodWithDetails(periodFilter.value);
        }

        const docsData = await getAllMedecins();
        rendezVousList.value = rdvData;
        doctorsList.value = docsData;
    } catch (error) {
        console.error("Error fetching rendezvous data:", error);
    } finally {
        isLoading.value = false;
    }
};

// Refetch when date or period changes
watch([selectedDate, periodFilter], () => {
    isLoading.value = true;
    fetchData();
});

onMounted(() => {
    fetchData();
    refreshInterval = setInterval(fetchData, 10000); // Refresh every 10s
});

onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval);
});

// Computed for filtering
const filteredRendezVous = computed(() => {
    return rendezVousList.value.filter(rdv => {
        const query = searchQuery.value.toLowerCase();
        const patientName = `${rdv.patient_nom} ${rdv.patient_prenoms}`.toLowerCase();
        const docName = `${rdv.professionnel_nom} ${rdv.professionnel_prenoms}`.toLowerCase();

        return patientName.includes(query) ||
            docName.includes(query) ||
            rdv.id_rdv.toLowerCase().includes(query) ||
            (rdv.motif_rdv && rdv.motif_rdv.toLowerCase().includes(query));
    });
});

// Doctor Load Statistics
const doctorStats = computed(() => {
    return doctorsList.value.map(doc => {
        const rdvToday = rendezVousList.value.filter(r => r.id_professionnel === doc.id_professionnel);
        const waitingCount = rdvToday.filter(r => r.statut_rdv === 'En attente' || r.statut_rdv === 'Prévu').length;

        return {
            id: doc.id_professionnel,
            initial: doc.nom ? doc.nom.charAt(0).toUpperCase() : '?',
            name: `Dr. ${doc.nom}`,
            count: rdvToday.length,
            waiting: waitingCount,
            full: rdvToday.length >= 10 // Assumption for manual load status
        };
    }).slice(0, 3); // Display only top 3 as in mockup
});

// Day Progression
const dayProgression = computed(() => {
    if (rendezVousList.value.length === 0) return 0;
    const completed = rendezVousList.value.filter(r => r.statut_rdv === 'Terminé' || r.statut_rdv === 'Arrivé').length;
    return Math.round((completed / rendezVousList.value.length) * 100);
});

const getStatusClass = (status) => {
    switch (status) {
        case 'Arrivé': return 'status-present';
        case 'Terminé': return 'status-confirmed';
        case 'En retard': return 'status-late';
        case 'Annulé': return 'status-canceled';
        default: return 'status-waiting';
    }
};

const openArrivalModal = (rdv) => {
    console.log("Opening arrival modal for:", rdv);
    if (!rdv) {
        console.error("No RDV provided to openArrivalModal");
        return;
    }
    try {
        selectedRdv.value = rdv;
        // Ensure doctorsList is loaded or handle gracefully
        if (!doctorsList.value || doctorsList.value.length === 0) {
            console.warn("Doctors list is empty when opening modal");
        }

        redirectToDoctor.value = rdv.id_professionnel || '';
        showArrivalModal.value = true;
        console.log("Modal state set to true");
    } catch (e) {
        console.error("Error in openArrivalModal:", e);
    }
};

const closeArrivalModal = () => {
    console.log("Closing arrival modal");
    showArrivalModal.value = false;
    selectedRdv.value = null;
};

const handleArrival = async () => {
    if (!selectedRdv.value) {
        console.error("No selected rendezvous");
        return;
    }

    try {
        isLoading.value = true;

        const userInfo = getUserInfo();
        if (!userInfo) {
            alert("Erreur: Utilisateur non connecté.");
            return;
        }

        // 1. Update Rendez-vous status
        await updateStatutRendezVous(selectedRdv.value.id_rdv, 'Arrivé');

        // 2. Initialize Consultation
        const consultationData = {
            id_patient: selectedRdv.value.id_patient,
            id_centre: userInfo.id_centre || selectedRdv.value.id_centre || 1, // Fallback to 1 or rdv's centre
            id_rendez_vous: selectedRdv.value.id_rdv,
            id_professionnel: redirectToDoctor.value || selectedRdv.value.id_professionnel,
            statut_consultation: skipTriage.value ? 'En attente de consultation' : 'En attente de prise des constantes'
        };

        if (!consultationData.id_centre) {
            console.warn("id_centre is missing, using default 1");
            consultationData.id_centre = 1;
        }

        await initConsultationRdv(consultationData);

        // 3. Refresh and Close
        closeArrivalModal();
        await fetchData();
        alert("Arrivée enregistrée avec succès. Le patient est " + (skipTriage.value ? "en attente de consultation." : "en attente de triage."));

    } catch (error) {
        console.error("Error confirming arrival:", error);
        alert("Une erreur est survenue lors de l'enregistrement de l'arrivée. Vérifiez que toutes les informations sont correctes.");
    } finally {
        isLoading.value = false;
    }
};

const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const ageDifMs = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />
        <div class="main">
            <navbar />

            <div class="content animate-in">
                <!-- Page Title & Quick Search -->
                <div class="topbar-context">
                    <div class="search-container">
                        <i class="fa fa-search"></i>
                        <input type="text" v-model="searchQuery"
                            placeholder="Rechercher un patient, un médecin ou un motif...">
                    </div>
                    <div class="progression-box">
                        <div class="progression-info">
                            <span>Progression Journée</span>
                            <span>{{ dayProgression }}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" :style="{ width: dayProgression + '%' }"></div>
                        </div>
                        <!-- <button class="btn btn-primary" @click="router.push('/secretaire/identification-create')">
                            <i class="fa fa-plus"></i> Nouveau RDV
                        </button> -->
                    </div>
                </div>

                <!-- Top Summary Cards -->
                <div class="stats-grid">
                    <div v-for="doc in doctorStats" :key="doc.id" class="stat-card">
                        <div class="avatar-circle" :class="{ 'bg-alt': doc.id % 2 === 0 }">
                            {{ doc.initial }}
                        </div>
                        <div class="stat-info">
                            <span class="name">{{ doc.name }}</span>
                            <span class="count">{{ doc.count }}</span>
                            <span class="label">RDVs ({{ doc.waiting }} en attente)</span>
                        </div>
                    </div>

                    <!-- Fallback if no docs/rdvs -->
                    <div v-if="doctorStats.length === 0" class="stat-card">
                        <div class="avatar-circle">?</div>
                        <div class="stat-info">
                            <span class="name">Aucun planning</span>
                            <span class="count">0</span>
                            <span class="label">Aucun RDV pour le moment</span>
                        </div>
                    </div>
                </div>

                <!-- Main Table Card -->
                <div class="card">
                    <div class="card-header">
                        <div class="header-title">
                            <span class="date-text">{{ periodFilter === 'today' ? "Aujourd'hui" : (periodFilter ===
                                'week' ? 'Cette semaine' : (periodFilter === 'month' ? 'Ce mois' :
                                    formatDate(selectedDate))) }}</span>
                            <span class="total-badge">{{ filteredRendezVous.length }} RDV</span>
                        </div>
                        <div class="header-filters">
                            <select v-model="periodFilter" class="date-input" style="margin-right: 10px;">
                                <option value="today">Aujourd'hui</option>
                                <option value="week">Cette semaine</option>
                                <option value="month">Ce mois</option>
                                <option value="all">Tout</option>
                                <option value="custom">Date spécifique</option>
                            </select>
                            <template v-if="periodFilter === 'custom'">
                                <span class="filter-label">Choisir :</span>
                                <input type="date" v-model="selectedDate" class="date-input">
                            </template>
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Heure</th>
                                    <th>Patient</th>
                                    <th>Médecin</th>
                                    <th>Motif</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="rdv in filteredRendezVous" :key="rdv.id_rdv">
                                    <td>
                                        {{ formatDate(rdv.date_rdv) }}
                                    </td>
                                    <td class="time-cell">
                                        {{ rdv.heure_debut }}
                                    </td>
                                    <td>
                                        <div class="patient-info">
                                            <span class="patient-name">{{ rdv.patient_nom }} {{ rdv.patient_prenoms
                                                }}</span>
                                            <span class="patient-sub">
                                                Né(e) le {{ formatDate(rdv.patient_date_naissance) }} • {{
                                                    rdv.type_patient }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="doc-cell">
                                            Dr. {{ rdv.professionnel_nom }}
                                            <small>{{ rdv.professionnel_specialite }}</small>
                                        </div>
                                    </td>
                                    <td>{{ rdv.motif_rdv || 'Consultation' }}</td>
                                    <td>
                                        <span class="status" :class="getStatusClass(rdv.statut_rdv)">
                                            <i v-if="rdv.statut_rdv === 'Terminé'" class="fa fa-check"></i>
                                            {{ rdv.statut_rdv || 'En attente' }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-group">
                                            <button v-if="rdv.statut_rdv !== 'Arrivé' && rdv.statut_rdv !== 'Terminé'"
                                                class="btn btn-outline btn-sm" @click="openArrivalModal(rdv)">
                                                Pointer Arrivée
                                            </button>
                                            <div class="action-icons">
                                                <i class="fa fa-eye" title="Voir dossier"></i>
                                                <i class="fa fa-ellipsis-h" title="Plus"></i>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="filteredRendezVous.length === 0">
                                    <td colspan="6" class="empty-state">
                                        <i class="fa fa-calendar-times-o"></i>
                                        <p>Aucun rendez-vous trouvé pour les critères sélectionnés.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Arrival Confirmation Modal -->
        <div v-if="showArrivalModal" class="arrival-modal-overlay">
            <div class="arrival-modal-card">
                <div class="arrival-modal-header">
                    <h3>Confirmer l'arrivée</h3>
                    <button @click="closeArrivalModal" class="close-btn">&times;</button>
                </div>
                <div class="arrival-modal-body">
                    <p>Patient: <strong>{{ selectedRdv?.patient_nom }} {{ selectedRdv?.patient_prenoms }}</strong></p>

                    <div class="form-group">
                        <label>Orienter vers le médecin :</label>
                        <select v-model="redirectToDoctor" class="form-control">
                            <option v-for="doc in doctorsList" :key="doc.id_professionnel"
                                :value="doc.id_professionnel">
                                Dr. {{ doc.nom }} {{ doc.prenoms }} ({{ doc.specialite }})
                            </option>
                        </select>
                    </div>

                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="skipTriage">
                            Passer directement en consultation (Sauter le triage)
                        </label>
                    </div>
                </div>
                <div class="arrival-modal-footer">
                    <button class="btn btn-outline" @click="closeArrivalModal">Annuler</button>
                    <button class="btn btn-primary" @click="handleArrival">Confirmer l'Arrivée</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.body {
    display: flex;
    height: 100vh;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    overflow: hidden;
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.content {
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

/* --- TOPBAR CONTEXT --- */
.topbar-context {
    padding: 15px 0;
    margin-bottom: 25px;
    background: transparent;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-container {
    display: flex;
    align-items: center;
    background: var(--gh-bg-color);
    padding: 8px 15px;
    border-radius: 20px;
    border: 1px solid var(--gh-border-color);
    width: 400px;
}

.search-container input {
    border: none;
    background: transparent;
    margin-left: 10px;
    font-size: 13px;
    width: 100%;
    outline: none;
    color: var(--gh-text-color);
}

.progression-box {
    display: flex;
    align-items: center;
    gap: 20px;
}

.progression-info {
    display: flex;
    flex-direction: column;
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

.progression-info span:last-child {
    font-weight: 700;
    color: var(--gh-text-color);
}

.progress-bar-bg {
    width: 150px;
    height: 8px;
    background: #e1e4e8;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: var(--gh-success-green);
    transition: width 0.3s ease;
}

/* --- STAT CARDS --- */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
}

.stat-card {
    background: var(--gh-card-bg);
    padding: 18px;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.avatar-circle {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background: #f0f7ff;
    color: var(--gh-primary-blue);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    border: 1px solid #c8e1ff;
    font-size: 18px;
}

.avatar-circle.bg-alt {
    background: #f0fff4;
    color: #28a745;
    border-color: #dcffe4;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-info .name {
    font-size: 14px;
    font-weight: 600;
}

.stat-info .count {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
}

.stat-info .label {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

/* --- MAIN CARD --- */
.card {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--gh-header-bg);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-text {
    font-weight: 600;
    font-size: 15px;
}

.total-badge {
    font-size: 11px;
    background: var(--gh-bg-color);
    padding: 2px 10px;
    border-radius: 12px;
    border: 1px solid var(--gh-border-color);
    color: var(--gh-text-color-secondary);
}

.header-filters {
    display: flex;
    align-items: center;
    gap: 10px;
}

.filter-label {
    font-size: 13px;
    color: var(--gh-text-color-secondary);
}

.date-input {
    border: 1px solid var(--gh-border-color);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    background: var(--gh-bg-color);
    color: var(--gh-text-color);
    outline: none;
}

/* --- TABLE --- */
.table-container {
    overflow-x: auto;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table th {
    text-align: left;
    padding: 12px 20px;
    background: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    font-size: 12px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    text-transform: uppercase;
}

.table td {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    font-size: 14px;
}

.time-cell {
    font-weight: 700;
    color: var(--gh-primary-blue);
    width: 80px;
}

.patient-info {
    display: flex;
    flex-direction: column;
}

.patient-name {
    font-weight: 600;
}

.patient-sub {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

.doc-cell {
    display: flex;
    flex-direction: column;
}

.doc-cell small {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

/* --- STATUS CAPSULES --- */
.status {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.status-waiting {
    background: #fff5b1;
    color: #735c0f;
}

.status-present {
    background: #dbedff;
    color: #005cc5;
}

.status-confirmed {
    background: #dcffe4;
    color: #155724;
}

.status-late {
    background: #ffeef0;
    color: #d73a49;
}

.status-canceled {
    background: #f3f4f6;
    color: #6a737d;
}

/* --- ACTIONS --- */
.action-group {
    display: flex;
    align-items: center;
    gap: 15px;
}

.action-icons {
    display: flex;
    gap: 12px;
    color: var(--gh-text-color-secondary);
}

.action-icons i {
    cursor: pointer;
    transition: color 0.1s;
}

.action-icons i:hover {
    color: var(--gh-primary-blue);
}

.btn {
    padding: 8px 16px;
    border-radius: var(--border-radius);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid var(--gh-border-color);
    transition: all 0.2s;
}

.btn-primary {
    background: var(--gh-primary-blue);
    color: white;
    border: none;
}

.btn-primary:hover {
    filter: brightness(1.1);
}

.btn-outline {
    background: var(--gh-bg-color);
    color: var(--gh-text-color);
}

.btn-outline:hover {
    background: var(--gh-header-bg);
}

.btn-sm {
    padding: 4px 10px;
    font-size: 12px;
}

.empty-state {
    text-align: center;
    padding: 60px !important;
    color: var(--gh-text-color-secondary);
}

.empty-state i {
    font-size: 40px;
    margin-bottom: 15px;
    opacity: 0.3;
}

@media screen and (max-width: 1800px) {
    .content {
        margin: 0;
        width: auto;
    }
}

/* --- MODAL STYLES RENAMED --- */
.arrival-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.arrival-modal-card {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    width: 450px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
}

.arrival-modal-header {
    padding: 16px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.arrival-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.arrival-modal-body {
    padding: 20px;
}

.arrival-modal-footer {
    padding: 16px;
    border-top: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--gh-text-color-secondary);
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-top: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    background: var(--gh-bg-color);
    color: var(--gh-text-color);
    font-size: 14px;
}

.checkbox-group {
    margin-top: 20px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
}

.modal-footer {
    padding: 16px;
    border-top: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* Animations */
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