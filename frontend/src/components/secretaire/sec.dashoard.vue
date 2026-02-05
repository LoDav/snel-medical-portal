<script setup>
/**
 * Dashboard Component for Receptionist
 * Displays key statistics and recent activities.
 * Author: @lorddavid alias @ôkami
 * Date: 2024-06-10
 */

// ============================================================================
// IMPORTS - Vue & Router
// ============================================================================
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// ============================================================================
// IMPORTS - Utils & Helpers
// ============================================================================
import { getUserInfo } from '@/utils/auth';
import { countPatientsToday, countAllPatients } from '@/utils/patient';
import {
    countOnlineProfessionals,
    countOnlineInfirmiers,
    updateOnlineStatus,
    getAllOnlineProfessionals
} from '@/utils/professionnel';
import {
    countConsultationsToday,
    getRecentConsultations,
    getTodayConsultations,
    getAllConsultationsWithDetails,
    countConsultationsEnAttentePriseConstantes,
    countConsultationsEnAttenteConsultationToday
} from '@/utils/consultation';
import { getRecentRendezVous, countTodayRendezVous } from '@/utils/rendezVous';
import { formatDate } from '../tools';

// ============================================================================
// IMPORTS - Components
// ============================================================================
import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const router = useRouter();
const userInfo = getUserInfo();
const REFRESH_INTERVAL = 5000; // 5 secondes

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'fa fa-home',
        path: '/secretaire/tableau-de-bord',
        active: true
    },
    {
        id: 2,
        name: 'Rendez-vous',
        icon: 'fa fa-calendar-plus-o',
        path: '/secretaire/rendezvous'
    },
    {
        id: 3,
        name: 'Identification et creation',
        icon: 'fa fa-id-card',
        path: '/secretaire/identification-create'
    }
];

// ============================================================================
// STATE - Statistics
// ============================================================================
const totalAllPatients = ref({ total: 0 });
const totalPatientToday = ref({ total: 0 });
const totalConsultationsToday = ref(0);
const todayAppointments = ref([]);
const waitingConstantesCount = ref({ count: 0 });
const waitingConsultationCount = ref({ count: 0 });

// ============================================================================
// STATE - Online Professionals
// ============================================================================
const onlineMedecinsCount = ref({ onlineCount: 0 });
const onlineInfirmiersCount = ref({ onlineCount: 0 });
const onlineProfessionals = ref([]);

// ============================================================================
// STATE - Recent Activities
// ============================================================================
const recentRendezVous = ref([]);
const recentConsultations = ref([]);
const consultationFilter = ref('today'); // 'today', 'recent', 'all'

// ============================================================================
// STATE - Modals & UI
// ============================================================================
const showDoctorsOnlineModal = ref(false);
const showInfirmiersOnlineModal = ref(false);
const showAlertModal = ref(false);
const alertTitle = ref('');
const alertMessage = ref('');

// ============================================================================
// STATE - Intervals
// ============================================================================
let intervalId = null;

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================
const totalWaitingCount = computed(() => {
    return (waitingConstantesCount.value.count || 0) + (waitingConsultationCount.value.count || 0);
});

const todayAppointmentsCount = computed(() => {
    return todayAppointments.value.count || 0;
});

const consultationsTodayCount = computed(() => {
    return totalConsultationsToday.value.count || 0;
});

// ============================================================================
// METHODS - Helpers
// ============================================================================
const isAppointmentPast = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;

    const now = new Date();
    // Créer une date à partir de la chaîne de date (qui est probablement au format ISO ou YYYY-MM-DD)
    const appointmentDate = new Date(dateStr);

    // Ajuster l'heure si timeStr est fourni
    if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        appointmentDate.setHours(parseInt(hours, 10));
        appointmentDate.setMinutes(parseInt(minutes, 10));
    }

    return appointmentDate < now;
};

// ============================================================================
// METHODS - Navigation
// ============================================================================
const goToPatientsToday = () => {
    if (totalPatientToday.value.total !== 0) {
        router.push({ path: '/secretaire/identification-create', query: { tab: 'list' } });
    }
};

const goTo = (url, count = null, message = null) => {
    if (count !== null && count === 0) {
        alertTitle.value = 'Information';
        alertMessage.value = message || 'Aucune donnée disponible.';
        showAlertModal.value = true;
        return;
    }

    if (url.includes('/secretaire/identification-create/create_patient')) {
        router.push({ path: '/secretaire/identification-create', query: { tab: 'creation' } });
    } else if (url.includes('/secretaire/identification-create/identification')) {
        router.push({ path: '/secretaire/identification-create', query: { tab: 'identification' } });
    } else {
        router.push(url);
    }
};

// ============================================================================
// METHODS - Modal Toggles
// ============================================================================
const toggleDoctorsOnlineModal = () => {
    showDoctorsOnlineModal.value = !showDoctorsOnlineModal.value;
};

const toggleInfirmiersOnlineModal = () => {
    showInfirmiersOnlineModal.value = !showInfirmiersOnlineModal.value;
};

// ============================================================================
// METHODS - Data Fetching
// ============================================================================
const fetchStats = async () => {
    // Fetch all statistics in parallel with Promise.allSettled
    // This ensures that if one request fails, others can still succeed
    const results = await Promise.allSettled([
        countPatientsToday(),
        countAllPatients(),
        countOnlineProfessionals(),
        countOnlineInfirmiers(),
        countConsultationsToday(),
        getRecentRendezVous(),
        consultationFilter.value === 'today' ? getTodayConsultations() : (consultationFilter.value === 'all' ? getAllConsultationsWithDetails() : getRecentConsultations()),
        countTodayRendezVous(),
        getAllOnlineProfessionals(),
        countConsultationsEnAttentePriseConstantes(),
        countConsultationsEnAttenteConsultationToday()
    ]);

    // Update state for successful requests
    // ... index 0 to 8 existing code ...
    if (results[0].status === 'fulfilled') totalPatientToday.value = results[0].value;
    else console.error('Erreur countPatientsToday:', results[0].reason);

    if (results[1].status === 'fulfilled') totalAllPatients.value = results[1].value;
    else console.error('Erreur countAllPatients:', results[1].reason);

    if (results[2].status === 'fulfilled') onlineMedecinsCount.value = results[2].value;
    else console.error('Erreur countOnlineProfessionals:', results[2].reason);

    if (results[3].status === 'fulfilled') onlineInfirmiersCount.value = results[3].value;
    else console.error('Erreur countOnlineInfirmiers:', results[3].reason);

    if (results[4].status === 'fulfilled') totalConsultationsToday.value = results[4].value;
    else console.error('Erreur countConsultationsToday:', results[4].reason);

    if (results[5].status === 'fulfilled') recentRendezVous.value = results[5].value;
    else console.error('Erreur getRecentRendezVous:', results[5].reason);

    if (results[6].status === 'fulfilled') recentConsultations.value = results[6].value;
    else console.error('Erreur getRecentConsultations:', results[6].reason);

    if (results[7].status === 'fulfilled') todayAppointments.value = results[7].value;
    else console.error('Erreur countTodayRendezVous:', results[7].reason);

    if (results[8].status === 'fulfilled') onlineProfessionals.value = results[8].value;
    else console.error('Erreur getAllOnlineProfessionals:', results[8].reason);

    // Index 9: countConsultationsEnAttentePriseConstantes
    if (results[9].status === 'fulfilled') waitingConstantesCount.value = results[9].value;
    else console.error('Erreur countConsultationsEnAttentePriseConstantes:', results[9].reason);

    // Index 10: countConsultationsEnAttenteConsultationToday
    if (results[10].status === 'fulfilled') waitingConsultationCount.value = results[10].value;
    else console.error('Erreur countConsultationsEnAttenteConsultationToday:', results[10].reason);
};

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onMounted(async () => {
    // Set user online status
    if (userInfo && userInfo.id_professionnel) {
        try {
            await updateOnlineStatus(userInfo.id_professionnel, 'Online');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut en ligne:', error);
        }
    }

    // Initial fetch
    await fetchStats();

    // Set up auto-refresh interval
    intervalId = setInterval(fetchStats, REFRESH_INTERVAL);
});

onUnmounted(() => {
    // Clean up interval
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />

        <div class="main">
            <navbar />

            <div class="content animate-in">
                <!-- Page Title -->
                <div class="section-title">Tableau de bord Receptionniste</div>

                <!-- Statistics Cards -->
                <div class="grid-container-stat">
                    <div class="card stat-card">
                        <div class="label" style="color: var(--gh-text-color-secondary);">
                            <i class="fas fa-chair"></i>
                            En Attente
                        </div>
                        <div class="value">{{ totalWaitingCount }}</div>
                    </div>

                    <!-- <div class="card stat-card">
                        <div class="label" style="color: var(--gh-text-color-secondary);">
                            <i class="fa fa-stethoscope"></i>
                            Patients vus aujourd'hui
                        </div>
                        <div class="value">{{ consultationsTodayCount }}</div>
                    </div> -->

                    <div class="card stat-card">
                        <div class="label" style="color: var(--gh-text-color-secondary);">
                            <i class="fa fa-calendar"></i>
                            RDV du Jour
                        </div>
                        <div class="value">{{ todayAppointmentsCount }}</div>
                    </div>

                    <div class="card stat-card" style="cursor: pointer;" @click="goToPatientsToday">
                        <div class="label" style="color: var(--gh-text-color-secondary);">
                            <i class="fas fa-clock"></i>
                            Patients créés aujourd'hui
                        </div>
                        <div class="value">{{ totalPatientToday.total }}</div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid-container">
                    <!-- Consultations History Card -->
                    <div class="card">
                        <div class="card-header">
                            <span>Historique de visites</span>
                            <div class="filter-group">
                                <select v-model="consultationFilter" @change="fetchStats" class="filter-select">
                                    <option value="today">Aujourd'hui</option>
                                    <option value="recent">7 derniers jours</option>
                                    <option value="all">Toute historique</option>
                                </select>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Activité</th>
                                        <th>Date</th>
                                        <th>Heure</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="consultation in recentConsultations" :key="consultation.id_consultation">
                                        <td>
                                            Consultation de {{ consultation.nom_patient }} {{
                                                consultation.prenoms_patient
                                            }}
                                        </td>
                                        <td>{{ formatDate(consultation.date_consultation) }}</td>
                                        <td>{{ consultation.heure_consultation }}</td>
                                        <td>
                                            <span :class="['status', 'status-text-truncate', {
                                                'completed': consultation.statut_consultation === 'Terminée',
                                                'waiting': consultation.statut_consultation === 'En attente de prise des constantes' || consultation.statut_consultation === 'En attente de consultation',
                                                'consulting': consultation.statut_consultation === 'En cours'
                                            }]" :title="consultation.statut_consultation">
                                                {{ consultation.statut_consultation }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr v-if="recentConsultations.length === 0">
                                        <td colspan="4"
                                            style="text-align: center; color: var(--gh-text-color-secondary);">
                                            Aucune activité récente.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Appointments Card -->
                    <div class="card rdv-section">
                        <div class="card-header">
                            Rendez-vous
                            <router-link to="/secretaire/rendezvous"
                                style="font-size: 12px; color: var(--gh-primary-blue); text-decoration: none;">
                                Tous voir
                            </router-link>
                        </div>
                        <div class="appointment-list">
                            <div class="appointment-item" v-for="appointment in recentRendezVous"
                                :key="appointment.id_rdv">
                                <div class="app-time">
                                    <div>{{ formatDate(appointment.date_rdv) }}</div>
                                    <div style="font-size: 14px; font-weight: 700;">
                                        {{ appointment.heure_debut.substring(0, 5) }}
                                    </div>
                                    <span :class="[
                                        'time-badge',
                                        isAppointmentPast(appointment.date_rdv, appointment.heure_debut) ? 'past' : 'future'
                                    ]">
                                        {{ isAppointmentPast(appointment.date_rdv, appointment.heure_debut) ? 'Passé' :
                                            'À venir' }}
                                    </span>
                                </div>
                                <div class="app-info">
                                    <span class="app-patient">
                                        {{ appointment.patient_nom }} {{ appointment.patient_prenom }}
                                    </span>
                                    <span class="app-meta">
                                        {{ appointment.motif_rdv }} - Dr. {{ appointment.professionnel_nom }} {{
                                            appointment.professionnel_prenom }}
                                    </span>
                                </div>
                                <span :class="['status', {
                                    'completed': appointment.statut_rdv === 'Arrivé',
                                    'pending': appointment.statut_rdv === 'Confirmé',
                                }]">
                                    {{ appointment.statut_rdv }}
                                </span>
                            </div>
                            <div v-if="recentRendezVous.length === 0" class="appointment-item">
                                <div class="app-info">
                                    <span class="app-meta">Aucun rendez-vous récent</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Online Professionals Card -->
                    <div class="card professionals-section">
                        <div class="card-header">
                            Professionnels connectés
                            <span style="font-size: 12px; color: var(--gh-text-color-secondary);">
                                {{ onlineProfessionals.length }} en ligne
                            </span>
                        </div>
                        <div class="professionals-list">
                            <div class="professional-item" v-for="professional in onlineProfessionals"
                                :key="professional.id_professionnel">
                                <div class="prof-avatar">
                                    <i :class="[
                                        'fa',
                                        professional.type_professionnel === 'Médecin' ? 'fa-user-md' :
                                            professional.type_professionnel === 'Infirmier' ? 'fa-user-plus' :
                                                'fa-user'
                                    ]"></i>
                                </div>
                                <div class="prof-info">
                                    <span class="prof-name">
                                        {{ professional.nom }} {{ professional.prenoms }}
                                    </span>
                                    <span class="prof-meta">
                                        {{ professional.type_professionnel }}
                                        <span v-if="professional.specialite"> - {{ professional.specialite }}</span>
                                    </span>
                                </div>
                                <span class="status-indicator online"></span>
                            </div>
                            <div v-if="onlineProfessionals.length === 0" class="professional-item">
                                <div class="prof-info">
                                    <span class="prof-meta">Aucun professionnel connecté</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:root {
    --border-radius: 6px;
    --gh-shadow: rgba(27, 31, 35, 0.08) 0px 1px 0px, rgba(27, 31, 35, 0.04) 0px 0px 1px;
}

.body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    margin: 0;
    display: flex;
    height: 100vh;
}

/** MAIN */
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

.section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
}

.grid-container-stat {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(4, 1fr);
    margin-bottom: 25px;
}

.card {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: var(--gh-shadow);
    padding: 16px;
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: var(--gh-shadow);
    transition: all 0.3s ease;
}

.stat-card .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.stat-card .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gh-text-color);
}


/* --- ANALYTICS GRID (3 colonnes pour inclure RDV) --- */
.grid-container {
    display: grid;
    gap: 20px;
    grid-template-columns: 1.2fr 1fr 1fr;
}

.card-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
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

.filter-select:focus {
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
}

/* --- TABLE STYLE --- */
.table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.table th {
    text-align: left;
    padding: 8px 12px;
    color: var(--gh-text-color-secondary);
    border-bottom: 2px solid var(--gh-border-color);
    /* background-color: #fcfcfc; */
}

.table td {
    padding: 12px;
    border-bottom: 1px solid var(--gh-border-color);
}

/* --- SCROLLABLE CONTENT AREAS --- */
/* --- SCROLLABLE CONTENT AREAS --- */
.table-wrapper {
    max-height: 300px;
    overflow-y: auto;
}

/* --- APPOINTMENT LIST STYLE --- */
.appointment-list {
    max-height: 300px;
    overflow-y: auto;
}

.appointment-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--gh-border-color);
}

.appointment-item:last-child {
    border-bottom: none;
}

.app-time {
    font-weight: 700;
    color: var(--gh-primary-blue);
    min-width: 80px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
}

.app-info {
    flex: 1;
}

.app-patient {
    font-weight: 600;
    display: block;
}

.app-meta {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

/* --- STATUS PILLS --- */
.status-text-truncate {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    cursor: help;
}

/* --- PROFESSIONALS LIST STYLE --- */
.professionals-list {
    max-height: 300px;
    overflow-y: auto;
}

.professional-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--gh-border-color);
}

.professional-item:last-child {
    border-bottom: none;
}

.prof-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gh-primary-blue), #0969da);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
}

.prof-info {
    flex: 1;
}

.prof-name {
    font-weight: 600;
    display: block;
    color: var(--gh-text-color);
}

.prof-meta {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}

.status-indicator.online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* --- TIME BADGE STYLE --- */
.time-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
    margin-top: 4px;
    display: inline-block;
    text-align: center;
}

.time-badge.past {
    background-color: rgba(231, 76, 60, 0.1);
    color: var(--gh-danger-red);
}

.time-badge.future {
    background-color: rgba(46, 204, 113, 0.1);
    color: var(--gh-success-green);
}

@media screen and (max-width: 1800px) {
    .content {
        margin: 0;
        width: auto;
    }
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
