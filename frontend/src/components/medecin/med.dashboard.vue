<script setup>
import { onMounted, ref, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getPatientFullById } from '@/utils/patient'
import {
    countDistinctPatientsTodayByProfessionnelId,
    countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation,
    countConsultationsEnAttenteConsultationToday,
    getWeeklyCompletedConsultationsStats,
    getConsultationsTerminees,
    countConsultationsEnCours
} from '@/utils/consultation'
import { getUserInfo } from '@/utils/auth';
import { updateOnlineStatus } from '@/utils/professionnel';
import {
    countRendezVousByProfessionnelId,
    countTodayRendezVousByProfessionnelId,
    getRendezVousByProfessionnelId, getTodayRendezVousWithPatient
} from '@/utils/rendezVous'

import { getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday } from '@/utils/consultation'
import { getExamensByProfessionnel } from '@/utils/examensMedicaux'
import Chart from 'chart.js/auto';

import DashboardLink from '../ui-components/DashboardLink.vue';
import SidebarSchedule from '../ui-components/sidebar.schedule.vue';
import SideBar from '../ui-components/SideBar.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';




const patientDatas = ref([])
const statData = ref({})
const fadeIn = ref(false)
let intervalId = null; // Variable pour stocker l'ID de l'intervalle
let refreshIntervalId = null; // Variable pour stocker l'ID de l'intervalle de rafraîchissement

//stat variables
const stat = ref({
    todyConsult: 0,
    rendezVous: 0,
    constultEnAttente: 0,
    consultationsEnCours: 0,

})

const userInfo = getUserInfo()
const router = useRouter()

const upcomingPatients = ref([])
const consultationChartInstance = ref(null)
const chartCanvas = ref(null)
const selectedPatient = ref(null)
const weeklyConsultationStats = ref([])
const completedConsultationsToday = ref([])
const examensWithResults = ref([])


// async function getData() {
//     patientDatas.value = await getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation(userDate.id_professionnel)
// }

const fetchUpcomingPatients = async () => {
    try {
        upcomingPatients.value = await getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday(userInfo.id_professionnel)
    } catch (error) {
        console.error(error);
    }
}

const fetchWeeklyConsultationStats = async () => {
    try {
        const response = await getWeeklyCompletedConsultationsStats(userInfo.id_professionnel)
        if (response.success) {
            weeklyConsultationStats.value = response.data
            console.log('weeklyConsultationStats', JSON.stringify(response));

        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques hebdomadaires:', error);
        // En cas d'erreur, utiliser des données par défaut
        weeklyConsultationStats.value = []
    }
}

const fetchData = async () => {
    try {
        stat.value.rendezVous = await countTodayRendezVousByProfessionnelId(userInfo.id_professionnel)
    } catch (error) {
        console.error(error);
    }

    try {
        stat.value.todyConsult = await countDistinctPatientsTodayByProfessionnelId(userInfo.id_professionnel)
    } catch (error) {
        console.error(error);
    }

    try {
        stat.value.constultEnAttente = await countConsultationsEnAttenteConsultationToday(userInfo.id_professionnel)
    } catch (error) {
        console.error(error);
    }

    try {
        stat.value.consultationsEnCours = await countConsultationsEnCours(userInfo.id_professionnel)
        console.log('consultationsEnCours', stat.value.consultationsEnCours);
    } catch (error) {
        console.error(error);
    }

    await fetchUpcomingPatients()
    await fetchWeeklyConsultationStats()

    try {
        const allCompleted = await getConsultationsTerminees(userInfo.id_professionnel)
        const today = new Date().toLocaleDateString('en-CA')
        completedConsultationsToday.value = allCompleted.data.filter(c => {
            if (!c.date_consultation) return false
            const date = new Date(c.date_consultation)
            const localDate = date.toLocaleDateString('en-CA')
            return localDate === today
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations terminées:', error);
        completedConsultationsToday.value = []
    }

    try {
        const allExamens = await getExamensByProfessionnel()
        // Filtrer les examens qui ont des résultats disponibles
        examensWithResults.value = allExamens.filter(examen =>
            examen.resultats || examen.fichier_resultat_url
        )
    } catch (error) {
        console.error('Erreur lors de la récupération des examens:', error);
        examensWithResults.value = []
    }
}

const drawConsultationChart = () => {
    // Vérifier que le canvas existe avant de dessiner
    if (!chartCanvas.value) {
        console.warn('Canvas non disponible pour le graphique');
        return;
    }

    const ctx = chartCanvas.value.getContext('2d');
    if (!ctx) {
        console.warn('Contexte 2D non disponible pour le canvas');
        return;
    }

    const colors = {
        primary: '#1e88e5',
        success: '#43a047',
        danger: '#e53935',
        warning: '#ffb300',
        text: '#313639',
        secondaryText: '#6d7880',
        grid: 'rgba(0, 0, 0, 0.1)',
        cardBg: '#ffffff',
    };

    // Mapping des jours anglais (de l'API) vers français
    const dayMapping = {
        'Monday': 'lundi',
        'Tuesday': 'mardi',
        'Wednesday': 'mercredi',
        'Thursday': 'jeudi',
        'Friday': 'vendredi',
        'Saturday': 'samedi',
        'Sunday': 'dimanche'
    };

    // Labels des jours de la semaine en français
    const labels = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    // Mapper les données de l'API aux jours de la semaine
    const counts = labels.map(day => {
        // Chercher dans les stats en utilisant le mapping inverse (français -> anglais)
        const englishDay = Object.keys(dayMapping).find(key => dayMapping[key] === day);
        const stat = weeklyConsultationStats.value.find(s => s.Jour_Semaine === englishDay);
        return stat ? stat.Nombre_Consultations_Terminees : 0;
    });

    if (consultationChartInstance.value) consultationChartInstance.value.destroy();

    consultationChartInstance.value = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consultations Terminées',
                data: counts,
                backgroundColor: 'rgba(30, 136, 229, 0.7)',
                borderColor: colors.primary,
                borderWidth: 2,
                borderRadius: 4,
                hoverBackgroundColor: colors.primary,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.secondaryText, stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: colors.secondaryText }
                }
            },
            plugins: {
                legend: { display: false },
            },
            color: colors.text
        }
    });
};

const startConsultation = (idConsultation) => {
    console.log(`Démarrage de la consultation pour l'ID: ${idConsultation}`);
    router.push(`/medecin/consultation?consultation=${idConsultation}`);
};

const gotToRdv = async () => {
    router.push('/medecin/rendezvous')
};

const goToConsultationsEnCours = () => {
    router.push('/medecin/consultation?tab=en-cours');
};

const viewResults = (examen) => {
    if (examen.id_consultation) {
        router.push(`/medecin/consultation?consultation=${examen.id_consultation}&tab=en-cours&view=results`);
    } else {
        console.error('ID consultation manquant pour cet examen');
    }
};


async function getSiderData(data) {
    // Nettoyer l'intervalle précédent s'il existe
    if (intervalId) {
        clearInterval(intervalId);
    }

    fadeIn.value = true
    intervalId = setInterval(() => {
        fadeIn.value = false
        console.log('intrvale')
        clearInterval(intervalId); // Détruire l'intervalle une fois qu'il a fait son travail
        intervalId = null; // Réinitialiser l'ID
    }, 400)


    patientDatas.value = await getPatientFullById(data.id_patient);
}

onMounted(async () => {
    if (userInfo && userInfo.id_professionnel) {
        try {
            await updateOnlineStatus(userInfo.id_professionnel, 'Online');
            console.log("update online status");
        } catch (error) {
            console.log(userInfo);

            console.log("error update online status", error);
        }
    }

    await fetchData()
    refreshIntervalId = setInterval(fetchData, 5000); // Rafraîchir les données toutes les 5 secondes
    await nextTick()
    setTimeout(() => drawConsultationChart(), 500)
})

onUnmounted(async () => {
    // Nettoyer l'intervalle si le composant est démonté
    if (intervalId) {
        clearInterval(intervalId);
    }
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }
    if (consultationChartInstance.value) {
        consultationChartInstance.value.destroy();
    }
})

</script>
<template>
    <nav>
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer-alt" to="/medecin/tableau-de-bord"
                    :active="true" />
                <DashboardLink text="Consutations" icon="user-md" to="/medecin/consultation" />
                <DashboardLink text="Patients" icon="users" to="/medecin/patients" />
                <DashboardLink text="Rendez-vous" icon="calendar-plus-o" to="/medecin/rendezvous" />
            </ul>
            <div class="d-flex">

                <div>
                    <ThemeSwitcher />
                </div>

                <div class="ml-3">
                    <header-user />
                </div>
            </div>
        </div>
    </nav>

    <div class="content">
        <!-- <pre>{{ weeklyConsultationStats }}</pre> -->
        <!-- <pre>{{ upcomingPatients }}</pre> -->
        <!-- <h1 class="section-title">Bonjour, Dr. {{ userInfo.nom }} {{ userInfo.prenoms }}</h1> -->
        <h1 class="section-title">Tableau de Bord - Médecin</h1>

        <div class="grid-container-stat">
            <div class="card stat-card">
                <div class="label" style="color: var(--primary-color);">
                    <i class="fa fa-users"></i> Patients Prévus (Auj.)
                </div>
                <!-- <div class="value">{{ stat.rendezVous.count }}</div> -->
                <div class="value">{{ upcomingPatients.length }}</div>
            </div>
            <div class="card stat-card">
                <div class="label" style="color: var(--success-color);">
                    <i class="fa fa-check-circle"></i> Consultations Terminées
                </div>
                <div class="value">{{ stat.todyConsult.count }}</div>
            </div>
            <div class="card stat-card" @click="gotToRdv" style="cursor: pointer;">
                <div class="label" style="color: var(--danger-color);">
                    <i class="fa fa-exclamation-triangle"></i> Rendez-vous(Auj)
                </div>
                <div class="value">{{ stat.rendezVous.count }}</div>
            </div>
            <div class="card stat-card" @click="goToConsultationsEnCours" style="cursor: pointer;">
                <div class="label" style="color: var(--warning-color);">
                    <i class="fa fa-hourglass-half"></i> Consultations en attente de resultats
                </div>
                <div class="value">{{ stat.consultationsEnCours.count }}</div>
            </div>
        </div>
        <div class="main-grid">

            <div>
                <div class="card agenda-card">
                    <div class="card-header">Prochains Patients (Aujourd'hui)</div>
                    <div class="patient-list" v-if="upcomingPatients.length > 0">
                        <div v-for="patient in upcomingPatients" :key="patient.id_consultation" class="patient-item"
                            @click="selectedPatient = patient">
                            <div class="patient-info">
                                <span class="time">{{ patient.heure_consultation }}</span>
                                <div class="patient-details">
                                    <strong>{{ patient.patient_info.nom }} {{ patient.patient_info.prenoms }}</strong>
                                    <span>
                                        <span>{{ patient.motif_consultation }}</span>
                                        <span class="status" :class="{
                                            'completed': patient.degre_urgence === 'Normal',
                                            'pending': patient.degre_urgence !== 'Normal'
                                        }">{{ patient.degre_urgence }}</span>
                                    </span>
                                    <span class="status completed ml-2" v-if="patient.id_rendez_vous !== null">
                                        Rendez-vous</span>

                                </div>
                            </div>
                            <div class="patient-actions">
                                <button class="btn btn-primary"
                                    @click.stop="startConsultation(patient.id_consultation)">
                                    <i class="fa fa-play"></i> Démarrer
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center p-4 text-muted">
                        <p>Aucun patient prevu aujourd'hui</p>
                    </div>
                </div>

                <div class="card mt-3">
                    <div class="card-header">Consultations Terminées (aujourd'hui)</div>
                    <div class="consultation-list">
                        <div v-for="consultation in completedConsultationsToday" :key="consultation.id_consultation"
                            class="consultation-item">
                            <div class="consultation-info">
                                <span class="time">{{ consultation.heure_consultation }}</span>
                                <div class="consultation-details">
                                    <strong>{{ consultation.patient_info.nom }} {{ consultation.patient_info.prenoms
                                    }}</strong>
                                    <span>{{ consultation.motif_consultation }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="completedConsultationsToday.length === 0" class="no-data text-center p-4 text-muted">
                            Aucune consultation terminée aujourd'hui.
                        </div>
                    </div>
                </div>

            </div>



            <div>
                <div class="card">
                    <div class="card-header">Notifications</div>
                    <div class="notification-list" v-if="examensWithResults.length > 0">
                        <div v-for="examen in examensWithResults" :key="examen.id_examen" class="notification-item">
                            <div class="notification-icon">
                                <i class="fa fa-flask"></i>
                            </div>
                            <div class="d-flex w-100 justify-content-between">
                                <div class="notification-content">
                                    <strong class="status completed">Résultats disponibles</strong>
                                    <span>{{ examen.nom_examen }} - {{ examen.nom }} {{ examen.prenoms }}</span>
                                    <small>{{ new Date(examen.date_examen).toLocaleDateString('fr-FR') }}</small>
                                </div>
                                <button class="btn btn-muted" @click="viewResults(examen)">voir les resultat</button>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center p-4 text-muted">
                        <p>Aucune nouvelle notification</p>
                    </div>
                </div>
                <div class="card mt-3">
                    <div class="card-header">Consultations (7 derniers jours)</div>
                    <div class="chart-container">
                        <canvas ref="chartCanvas"></canvas>
                    </div>
                </div>
            </div>




        </div>
    </div>
</template>
<style scoped>
/* Styles inspirés du mockup */
.content {
    padding: 30px;
    max-width: 1300px;
    margin: 0 auto;
}

/* .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 30px;
    background-color: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
}

.navbar-brand {
    font-size: 20px;
    font-weight: 600;
    color: var(--gh-primary-blue);
    text-decoration: none;
}

.navbar-user {
    display: flex;
    align-items: center;
    gap: 15px;
} */

.theme-selector {
    padding: 5px 10px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    background-color: var(--gh-card-bg);
    color: var(--gh-text-color);
    cursor: pointer;
}

.navbar-icon {
    color: var(--gh-text-color-secondary);
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 25px;
    color: var(--gh-text-color);
    padding-top: 10px;
}

.grid-container-stat {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(4, 1fr);
    margin-bottom: 30px;
}

.card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: rgba(27, 31, 35, 0.08) 0px 1px 0px, rgba(27, 31, 35, 0.04) 0px 0px 1px;
    padding: 20px;
}

.card-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
}

.stat-card .value {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--gh-text-color);
    margin-bottom: 10px;
}

.stat-card .label {
    font-size: 0.875rem;
    color: var(--gh-text-color-secondary);
    text-transform: uppercase;
    display: flex;
    align-items: center;
}

.stat-card .label i {
    margin-right: 8px;
    font-size: 1.1rem;
}

.main-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.agenda-card {
    grid-column: span 1;
    overflow: auto;
}

.patient-list {
    display: flex;
    flex-direction: column;
    max-height: 20vh;
    padding-bottom: 15px;
    gap: 10px;
}

.patient-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-radius: 6px;
    background-color: var(--gh-header-bg);
    border: 1px solid var(--gh-border-color);
}

.patient-item:hover {
    box-shadow: 0 2px 4px rgba(27, 31, 35, 0.08);
    background-color: var(--gh-card-bg);
}

.patient-item:last-child {
    margin-bottom: 10px;
}

.patient-item.active {
    background-color: var(--gh-primary-blue);
    color: white;
}

.patient-item.active .patient-details strong,
.patient-item.active {
    color: white;
}

.patient-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.patient-info .time {
    font-size: 14px;
    font-weight: 600;
    color: var(--gh-primary-blue);
    background-color: color-mix(in srgb, var(--gh-primary-blue) 15%, transparent);
    padding: 5px 10px;
    border-radius: 4px;
}

.patient-details strong {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.patient-details span {
    font-size: 13px;
    /* color: var(--gh-text-color-secondary); */
}

/* .patient-actions .btn-primary {
    background-color: var(--gh-success-color, #28a745);
}

.patient-actions .btn-primary:hover {
    background-color: color-mix(in srgb, var(--gh-success-color, #28a745) 80%, black);
} */

.chart-container {
    position: relative;
    flex-grow: 1;
    min-height: 250px;
    margin-top: 20px;
}

/* .btn {
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

.btn-primary {
    background-color: var(--gh-primary-blue);
    color: var(--gh-card-bg);
    border-color: var(--gh-primary-blue);
}

.btn-primary:hover {
    background-color: var(--gh-primary-blue-hover, #005cc5);
} */

/* Media queries */
@media (max-width: 1024px) {
    .grid-container-stat {
        grid-template-columns: repeat(2, 1fr);
    }

    .main-grid {
        grid-template-columns: 1fr;
    }

    .agenda-card {
        grid-column: span 1;
    }
}

@media (max-width: 600px) {
    .content {
        padding: 15px;
    }

    .grid-container-stat {
        grid-template-columns: 1fr;
    }

    .patient-item {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .patient-actions {
        width: 100%;
    }

    .patient-actions .btn {
        width: 100%;
    }
}

.consultation-list {
    display: flex;
    flex-direction: column;
    min-height: 150px;
    gap: 10px;
}

.consultation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-radius: 6px;
    background-color: var(--gh-header-bg);
    border: 1px solid var(--gh-border-color);
}

.consultation-item:hover {
    box-shadow: 0 2px 4px rgba(27, 31, 35, 0.08);
    background-color: var(--gh-card-bg);
}

.consultation-item:last-child {
    margin-bottom: 10px;
}

.consultation-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.consultation-info .time {
    font-size: 14px;
    font-weight: 600;
    color: var(--gh-primary-blue);
    background-color: color-mix(in srgb, var(--gh-primary-blue) 15%, transparent);
    padding: 5px 10px;
    border-radius: 4px;
}

.consultation-details strong {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.consultation-details span {
    font-size: 13px;
    color: var(--gh-text-color-secondary);
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 180px;
    overflow-y: auto;
}

.notification-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
    background-color: var(--gh-header-bg);
    border: 1px solid var(--gh-border-color);
    gap: 12px;
}

.notification-item:hover {
    box-shadow: 0 2px 4px rgba(27, 31, 35, 0.08);
    background-color: var(--gh-card-bg);
}

.notification-icon {
    color: var(--success-color);
    font-size: 1.2rem;
    min-width: 20px;
}

.notification-content strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    /* color: var(--gh-text-color); */
    margin-bottom: 2px;
}

.notification-content span {
    display: block;
    font-size: 13px;
    color: var(--gh-text-color-secondary);
    margin-bottom: 2px;
}

.notification-content small {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}
</style>
