<script setup>
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';
import {
    countConsultationsEnAttentePriseConstantes,
    getConsultationsEnAttentePriseConstantesToday,
    getRecentConsultations,
    deleteConsultation,
    getConsultationsEnAttenteConsultation,
    countConsultationsEnAttenteConsultation
} from '@/utils/consultation';
import {
    countOnlineProfessionals,
    countOnlineInfirmiers,
    updateOnlineStatus,
    getAllOnlineProfessionals
} from '@/utils/professionnel';
import { countAllPatients } from '@/utils/patient';
import { formatDate } from '../tools';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';
import DoctorsOnlineModal from '../ui-components/DoctorsOnlineModal.vue';

const router = useRouter();
const userInfo = ref(null);
const totalConsultationsEnAttentePriseConstantes = ref(0);
const totalConsultationsEnAttenteConsultation = ref(0);
const consultationsEnAttenteToday = ref([]);
const onlineMedecinsCount = ref({});
const onlineInfirmiersCount = ref({});
const totalAllPatients = ref({});
const recentConsultations = ref([]);
const onlineProfessionals = ref([]);
const waitingForDoctorList = ref([]);
let intervalId = null;

const showDoctorsOnlineModal = ref(false);
const showInfirmiersOnlineModal = ref(false);

const toggleDoctorsOnlineModal = () => {
    showDoctorsOnlineModal.value = !showDoctorsOnlineModal.value;
};

const toggleInfirmiersOnlineModal = () => {
    showInfirmiersOnlineModal.value = !showInfirmiersOnlineModal.value;
};

const goTo = (path, query = {}) => {
    router.push({ path, query });
};

// ... existing code ...
const isDateBeforeToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
};

const dropConsultation = async (id_consultation) => {
    if (confirm("Voulez-vous vraiment supprimer cette consultation ?")) {
        try {
            await deleteConsultation(id_consultation);
            fetchStats();
        } catch (error) {
            console.error('Erreur lors de la suppression de la consultation:', error);
        }
    }
};

/**
 * Fonction pour récupérer les statistiques de l'infirmerie.
 * Elle récupère le nombre de consultations en attente de prise des constantes,
 * le nombre de consultations en attente de prise des constantes pour aujourd'hui,
 * le nombre de médecins en ligne, le nombre d'infirmiers en ligne,
 * le nombre total de patients et les consultations récentes.
 * Elle gère les erreurs qui peuvent survenir lors de la récupération des statistiques.
 */

const fetchStats = async () => {
    try {
        const countResponse = await countConsultationsEnAttentePriseConstantes();
        totalConsultationsEnAttentePriseConstantes.value = countResponse.count;
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre de consultations en attente de constantes:', error);
    }

    try {
        const waitingConsultResponse = await countConsultationsEnAttenteConsultation();
        totalConsultationsEnAttenteConsultation.value = waitingConsultResponse.count;
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre de consultations en attente de consultation:', error);
    }

    try {
        consultationsEnAttenteToday.value = await getConsultationsEnAttentePriseConstantesToday();
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations en attente aujourd\'hui:', error);
    }

    try {
        onlineMedecinsCount.value = await countOnlineProfessionals();
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre de médecins en ligne:', error);
    }

    try {
        onlineInfirmiersCount.value = await countOnlineInfirmiers();
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'infirmiers en ligne:', error);
    }

    try {
        totalAllPatients.value = await countAllPatients();
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre total de patients:', error);
    }

    try {
        recentConsultations.value = await getRecentConsultations();
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations récentes:', error);
    }

    try {
        onlineProfessionals.value = await getAllOnlineProfessionals();
    } catch (error) {
        console.error('Erreur lors de la récupération des professionnels en ligne:', error);
    }

    try {
        waitingForDoctorList.value = await getConsultationsEnAttenteConsultation();
    } catch (error) {
        console.error('Erreur lors de la récupération des attentes médecins:', error);
    }
};

onMounted(async () => {
    userInfo.value = getUserInfo();
    if (userInfo.value && userInfo.value.id_professionnel) {
        try {
            await updateOnlineStatus(userInfo.value.id_professionnel, 'Online');
        } catch (error) {
            console.log("Erreur lors de la mise à jour du statut en ligne", error);
        }
    }

    fetchStats();
    intervalId = setInterval(fetchStats, 5000);
});

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});

/*** New stuff */
import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'tachometer',
        path: '/infirmier/tableau-de-bord',
        active: true
    },
    {
        id: 2,
        name: 'Constante',
        icon: 'thermometer-half',
        path: '/infirmier/constentes',
        active: false
    },
    {
        id: 3,
        name: 'Patients',
        icon: 'users',
        path: '/infirmier/patients',
        active: false
    }
];

const filterDate = ref('today');
const filterDateDoctor = ref('today');

const filteredConsultations = computed(() => {
    let consultations = recentConsultations.value.filter(c => c.statut_consultation === 'En attente de prise des constantes');

    if (filterDate.value === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return consultations.filter(consultation => {
            if (!consultation.date_consultation) return false;
            const consultationDate = new Date(consultation.date_consultation);
            consultationDate.setHours(0, 0, 0, 0);
            return consultationDate.getTime() === today.getTime();
        });
    }
    return consultations;
});

const filteredWaitingForDoctor = computed(() => {
    let consultations = waitingForDoctorList.value;

    if (filterDateDoctor.value === 'today') {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

        return consultations.filter(c => {
            if (!c.date_consultation) return false;
            const consultDate = new Date(c.date_consultation).toLocaleDateString('en-CA');
            return consultDate === today;
        });
    }
    return consultations;
});

const doctorLoadData = computed(() => {
    // On ne garde que les médecins parmi les professionnels en ligne
    const doctors = onlineProfessionals.value.filter(pro => pro.role === 'Médecin' || pro.type_professionnel === 'Médecin');

    return doctors.map(doc => {
        // Compter les consultations assignées à ce médecin avec le statut "En attente de consultation"
        // On suppose que le médecin est identifié par id_professionnel dans la consultation
        const patientsWaiting = waitingForDoctorList.value.filter(c => c.id_medecin === doc.id_professionnel || c.id_professionnel === doc.id_professionnel).length;

        // Calculer un pourcentage pour la barre de progression (ex: max 10 patients pour 100%)
        const loadPercent = Math.min((patientsWaiting / 10) * 100, 100);

        // Déterminer la couleur selon la charge
        let color = 'var(--gh-success-green)';
        if (patientsWaiting > 3) color = 'var(--gh-warning-orange)';
        if (patientsWaiting > 6) color = 'var(--gh-danger-red)';

        return {
            id: doc.id_professionnel,
            name: `Dr. ${doc.nom}`,
            specialty: doc.specialite || 'Généraliste',
            count: patientsWaiting,
            percent: loadPercent,
            color: color
        };
    }).sort((a, b) => b.count - a.count); // Trier par nombre de patients
});

const recentActivities = computed(() => {
    // On prend les 6 dernières consultations pour le flux d'activité
    return recentConsultations.value.slice(0, 6).map(c => {
        let content = "";
        let color = "var(--gh-primary-blue)"; // Bleu par défaut (Orientation)

        if (c.statut_consultation === 'En attente de prise des constantes') {
            content = `Nouvelle arrivée au triage : <strong>${c.nom_patient} ${c.prenoms_patient}</strong>`;
            color = "var(--gh-warning-orange)";
        } else if (c.statut_consultation === 'En attente de consultation') {
            content = `<strong>${c.nom_patient} ${c.prenoms_patient}</strong> orienté vers le medecin`;
            color = "var(--gh-primary-blue)";
        } else if (c.statut_consultation === 'Terminée') {
            content = `Consultation terminée pour <strong>${c.nom_patient} ${c.prenoms_patient}</strong>`;
            color = "var(--gh-success-green)";
        } else {
            content = `Mise à jour du statut pour <strong>${c.nom_patient}</strong> : ${c.statut_consultation}`;
        }

        return {
            id: c.id_consultation,
            content: content,
            time: `Le ${formatDate(c.date_consultation)} à ${c.heure_consultation}`,
            color: color
        };
    });
});
</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />
        <div class="main">
            <navbar />
            <!-- Page Title -->
            <div class="content animate-in">
                <div class="section-title">Tableau de bord Triage</div>

                <div class="grid-container-stat">
                    <div class="card stat-card">
                        <div class="label">en attente de prise des constantes</div>
                        <div class="value">
                            <i class="fa fa-clock-o" aria-hidden="true"></i>
                            {{ totalConsultationsEnAttentePriseConstantes }}
                        </div>
                    </div>
                    <div class="card stat-card">
                        <div class="label">en attente de consultation</div>
                        <div class="value">
                            <i class="fa fa-clock-o" aria-hidden="true"></i>
                            {{ totalConsultationsEnAttenteConsultation }}
                        </div>
                    </div>
                    <div class="card stat-card">
                        <div class="label">Professionnels en ligne</div>
                        <div class="value">
                            <i class="fa fa-clock-o" aria-hidden="true"></i>
                            {{ onlineProfessionals.length }}
                        </div>
                    </div>
                    <!-- <div class="card stat-card"></div> -->
                </div>

                <!-- <pre>{{ recentConsultations }}</pre> -->
                <!-- <pre>{{ onlineProfessionals }}</pre> -->
                <!-- <pre>{{ consultationsEnAttenteToday }}</pre> -->

                <div class="dashboard-grid">
                    <!-- COLONNE GAUCHE: LISTE ATTENTE -->
                    <div class="left-col">
                        <div class="card_data">
                            <div class="card-header">
                                <span>Patients en attente de prise de constantes</span>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <select v-model="filterDate"
                                        style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--gh-border-color); font-size: 12px; background-color: var(--gh-bg-color); color: var(--gh-text-color);">
                                        <option value="today">Aujourd'hui</option>
                                        <option value="all">Tout afficher</option>
                                    </select>
                                    <button
                                        style="border:none; background:none; color:var(--gh-primary-blue); cursor:pointer; font-size: 12px;"
                                        title="Actualiser">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Heure Arrivée</th>
                                            <th>Date</th>
                                            <th>Statut</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="consultation in filteredConsultations"
                                            :key="consultation.id_consultation">
                                            <td>
                                                <strong>{{ consultation.nom_patient }} {{ consultation.prenoms_patient
                                                }}</strong><br>
                                                <small class="text-muted">{{ consultation.type_patient }}</small>
                                            </td>
                                            <td>{{ consultation.heure_consultation }}</td>
                                            <td><span
                                                    :style="{ color: isDateBeforeToday(consultation.date_consultation) ? 'var(--gh-danger-red)' : '' }"
                                                    style="font-weight:600;">{{
                                                        formatDate(consultation.date_consultation) }}</span></td>
                                            <td>
                                                <span class="badge"
                                                    :class="{ 'badge-priority': consultation.degre_urgence === 'Urgent' || consultation.degre_urgence === 'Critique', 'badge-waiting': consultation.degre_urgence === 'Normal' || !consultation.degre_urgence }">
                                                    {{ consultation.degre_urgence || 'Normal' }}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-rounded btn-sm btn-outline"
                                                    style="cursor: pointer;"
                                                    @click="goTo('/infirmier/constentes', { id_consultation: consultation.id_consultation })">Prendre
                                                    constantes</button>
                                                <button @click="dropConsultation(consultation.id_consultation)"
                                                    class="ml-2 btn btn-rounded btn-sm btn-danger"
                                                    style="cursor: pointer;">
                                                    <i class="fa fa-trash-o"></i></button>
                                            </td>
                                        </tr>
                                        <tr v-if="filteredConsultations.length === 0">
                                            <td colspan="6"
                                                style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                                Aucun patient en attente de prise de constantes.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>



                        <div class="card_data">
                            <div class="card-header">Professionnels Connectés</div>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Rôle</th>
                                            <th>Service</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="pro in onlineProfessionals" :key="pro.id_professionnel">
                                            <td><strong>{{ pro.role === 'Médecin' ? 'Dr.' : (pro.role === 'Infirmier' ?
                                                'Inf.' : '') }} {{ pro.nom }} {{ pro.prenoms }}</strong></td>
                                            <td>{{ pro.type_professionnel }}</td>
                                            <td>{{ pro.specialite || 'Général' }}</td>
                                            <td>
                                                <span class="status completed">
                                                    <span class="dot online"></span> En ligne
                                                </span>
                                            </td>
                                        </tr>
                                        <tr v-if="onlineProfessionals.length === 0">
                                            <td colspan="4"
                                                style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                                Aucun professionnel en ligne.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- COLONNE DROITE: MÉDECINS ET ACTIVITÉS -->
                    <div class="right-col">
                        <!-- CHARGE MÉDECINS -->
                        <div class="card_data">
                            <div class="card-header">Attente par Médecin</div>
                            <ul class="doctor-load">
                                <li v-for="doc in doctorLoadData" :key="doc.id" class="doctor-load-item">
                                    <div>
                                        <div style="font-weight: 600; font-size: 13px;">{{ doc.name }}</div>
                                        <div style="font-size: 11px; color: var(--gh-text-color-secondary);">{{
                                            doc.specialty }}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 700;" :style="{ color: doc.color }">{{ doc.count }}
                                            pat.</div>
                                        <div class="load-bar-container">
                                            <div class="load-bar"
                                                :style="{ width: doc.percent + '%', background: doc.color }">
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li v-if="doctorLoadData.length === 0"
                                    style="padding: 20px; text-align: center; font-size: 12px; color: var(--gh-text-color-secondary);">
                                    Aucun médecin en ligne.
                                </li>
                            </ul>
                        </div>

                        <div class="card_data">
                            <div class="card-header">
                                <span>Patients en attente de consultation</span>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <select v-model="filterDateDoctor"
                                        style="padding: 2px 5px; border-radius: 4px; border: 1px solid var(--gh-border-color); font-size: 11px; background-color: var(--gh-bg-color); color: var(--gh-text-color);">
                                        <option value="today">Aujourd'hui</option>
                                        <option value="all">Tout</option>
                                    </select>
                                </div>
                            </div>
                            <ul class="doctor-load">
                                <li v-for="consultation in filteredWaitingForDoctor" :key="consultation.id_consultation"
                                    class="doctor-load-item">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 13px;">
                                            {{ consultation.patient_info?.nom }} {{ consultation.patient_info?.prenoms
                                            }}
                                        </div>
                                        <div style="font-size: 11px; color: var(--gh-text-color-secondary);">
                                            <i class="fa fa-user-md" style="margin-right: 4px;"></i>
                                            {{ consultation.professionnel_info?.nom ? 'Dr. ' +
                                                consultation.professionnel_info?.nom : 'Non assigné' }}
                                        </div>
                                    </div>
                                    <div style="text-align: right; min-width: 90px;">
                                        <div style="font-size: 11px; font-weight: 500; margin-bottom: 2px;">
                                            {{ consultation.heure_consultation }}
                                        </div>
                                        <div style="font-size: 10px; color: var(--gh-text-color-secondary); margin-bottom: 4px;"
                                            :style="{ color: isDateBeforeToday(consultation.date_consultation) ? 'var(--gh-danger-red)' : '' }">
                                            {{ formatDate(consultation.date_consultation) }}
                                        </div>
                                        <span class="badge"
                                            :class="{ 'badge-priority': consultation.degre_urgence === 'Urgent' || consultation.degre_urgence === 'Critique', 'badge-waiting': consultation.degre_urgence === 'Normal' || !consultation.degre_urgence }">
                                            {{ consultation.degre_urgence || 'Normal' }}
                                        </span>
                                    </div>
                                </li>
                                <li v-if="filteredWaitingForDoctor.length === 0"
                                    style="padding: 20px; text-align: center; font-size: 12px; color: var(--gh-text-color-secondary);">
                                    Aucun patient en attente.
                                </li>
                            </ul>
                        </div>

                        <!-- ACTIVITÉS RÉCENTES (PARCOURS) -->
                        <div class="card_data">
                            <div class="card-header">Activités Récentes</div>
                            <div class="activity-list">
                                <div v-for="act in recentActivities" :key="act.id" class="activity-item">
                                    <div class="activity-icon" :style="{ background: act.color }"></div>
                                    <div class="activity-content">
                                        <span v-html="act.content"></span>
                                        <div class="activity-time">{{ act.time }}</div>
                                    </div>
                                </div>
                                <div v-if="recentActivities.length === 0"
                                    style="text-align: center; padding: 20px; font-size: 12px; color: var(--gh-text-color-secondary);">
                                    Aucune activité récente à afficher.
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


.grid-container {
    display: grid;
    gap: 20px;
    grid-template-columns: 1.2fr 1fr 1fr;
}

/* .card-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
} */


.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
}

/* --- TABLES & CARDS --- */
.card_data {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    margin-bottom: 20px;
    overflow: hidden;

}

.card-header {
    padding: 12px 15px;
    background: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.table th {
    text-align: left;
    padding: 12px;
    background: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    color: var(--gh-text-color-secondary);
}

.table td {
    padding: 12px;
    border-bottom: 1px solid var(--gh-border-color);
}

.table-container {
    max-height: 400px;
    overflow-y: auto;
}

/* --- STATUS & BADGES --- */
.badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
}

.badge-waiting {
    background: #fff5b1;
    color: #735c0f;
}

.badge-priority {
    background: #ffeef0;
    color: #d73a49;
}

.dot {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 5px;
}

.online {
    background: var(--gh-success-green);
}

/* --- DOCTOR LOAD LIST --- */
.doctor-load {
    list-style: none;
    padding: 0;
    margin: 0;
}

.doctor-load-item {
    padding: 12px 15px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.load-bar-container {
    width: 60px;
    height: 6px;
    background: var(--gh-border-color);
    border-radius: 3px;
    overflow: hidden;
}

.load-bar {
    height: 100%;
    background: var(--gh-primary-blue);
}

/* --- TIMELINE / ACTIVITY --- */
.activity-list {
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    position: relative;
}

.activity-item::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 20px;
    bottom: -10px;
    width: 1px;
    background: var(--gh-border-color);
}

.activity-item:last-child::before {
    display: none;
}

.activity-icon {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--gh-primary-blue);
    margin-top: 4px;
    z-index: 1;
}

.activity-content {
    flex: 1;
    font-size: 12px;
}

.activity-time {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
}

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
