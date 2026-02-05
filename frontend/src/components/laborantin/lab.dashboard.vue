<script setup>
import { onMounted, ref } from 'vue';
import { getUserInfo } from '@/utils/auth';
import { getCountDemandesAujourdhui, getDetailedPrescriptionsExamens, getRecentPrescriptionsExamens } from '@/utils/prescriptionsExamens';
import { getCountExamensAujourdhui } from '@/utils/examensMedicaux';

import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import DashboardLink from '../ui-components/DashboardLink.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';




const userInfo = ref(null)
const stats = ref({
    totalExamDemandesAujourdhui: 0,
    totalExamTermineAujourdhui: 0
})
const prescriptionsDetails = ref([])
const recentPrescriptions = ref([])

onMounted(() => {
    userInfo.value = getUserInfo()
    getCountDemandesAujourdhui().then(response => {
        stats.value.totalExamDemandesAujourdhui = response
    })

    getCountExamensAujourdhui().then(response => {
        stats.value.totalExamTermineAujourdhui = response
    })

    getDetailedPrescriptionsExamens().then(response => {
        prescriptionsDetails.value = response
    })

    getRecentPrescriptionsExamens().then(response => {
        recentPrescriptions.value = response
    })
})
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const options = { hour: 'numeric', minute: 'numeric' };
    return date.toLocaleTimeString('fr-FR', options);
}

</script>

<template>

    <nav>
        <div class="navbar animate__animated animate__fadeIn">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/laborantin/tableau-de-bord"
                    :active="true" />
                <DashboardLink text="Examens" icon="medkit" to="/laborantin/examens" />
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


    <div class="main-wrapper animate__animated animate__fadeIn">
        <div class="container">
            <div class="header">
                <h1>Tableau de bord Laborantin</h1>
            </div>

            <!-- <pre>{{ prescriptionsDetails }}</pre> -->

            <div class="main-content">

                <div class="card">
                    <div class="card-header">Statistiques des Examens</div>
                    <div class="card-content stat-grid">
                        <div class="stat-item">
                            <div class="value">{{ stats.totalExamDemandesAujourdhui.count }}</div>
                            <div class="label">Examens en attente ajd</div>
                        </div>
                        <div class="stat-item">
                            <div class="value">{{ stats.totalExamTermineAujourdhui.count }}</div>
                            <div class="label">Examens realiser ajd</div>
                        </div>
                        <!-- <div class="stat-item">
                            <div class="value">25</div>
                            <div class="label">Examens urgents</div>
                        </div>
                        <div class="stat-item">
                            <div class="value">320</div>
                            <div class="label">Total Examens ce mois</div>
                        </div> -->
                    </div>
                </div>



                <div class="card">
                    <div class="card-header">Examens Récents</div>
                    <div class="card-content">
                        <ul class="notification-list">
                            <!-- <li class="notification-item">
                                <span class="notification-icon info">&#9432;</span>
                                <div>
                                    **Patient: Jean Dupont** - Examen Sanguin (En attente)<br>
                                    <small>Demandé par Dr. Martin</small>
                                </div>
                            </li>
                            <li class="notification-item">
                                <span class="notification-icon warning">&#9888;</span>
                                <div>
                                    **Patient: Sophie Bernard** - Analyse Urinaire (Urgent)<br>
                                    <small>Demandé par Dr. Dubois</small>
                                </div>
                            </li>
                            <li class="notification-item">
                                <span class="notification-icon success">&#10003;</span>
                                <div>
                                    **Patient: Marc Durand** - Résultat Prêt (Terminé)<br>
                                    <small>Examen Radiologique</small>
                                </div>
                            </li> -->
                            <li class="notification-item"
                                v-for="prescription in prescriptionsDetails[0]?.prescriptions_examens">
                                <!-- {{ prescription }} -->
                                <div>
                                    Patient: {{ prescription.patient_info.nom }} {{ prescription.patient_info.prenoms }}
                                    <br> Examen: {{ prescription.nom_examen }} - <span :class="prescription.statut_examen === 'En attente' ? 'status pending' : 'status completed'"
                                    >{{ prescription.statut_examen
                                    }}</span> <br>
                                    <small>Heure: {{ formatDate(prescription.date_demande) }}</small>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <a href="/laborantin/examens" class="btn">Voir tous les examens</a>
                </div>

                <div class="card">
                    <div class="card-header">Accès Rapide</div>
                    <div class="card-content">
                        <p>Accédez rapidement aux sections principales de votre application.</p>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <a href="/laborantin/examens" class="btn btn-primary">Gérer les Examens</a>
                            <a href="#" class="btn">Ajouter un Nouveau Résultat</a>
                            <a href="#" class="btn">Historique des Patients</a>
                            <a href="#" class="btn">Gérer les Réactifs</a>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">Alerte & Notifications</div>
                    <div class="card-content">
                        <!-- <ul class="notification-list">
                            <li class="notification-item">
                                <span class="notification-icon warning">&#9888;</span>
                                <div>
                                    **Stock Faible:** Réactif X (10 unités restantes)<br>
                                    <small>Veuillez commander rapidement.</small>
                                </div>
                            </li>
                            <li class="notification-item">
                                <span class="notification-icon info">&#9432;</span>
                                <div>
                                    **Maintenance Équipement** prévue demain à 08h00.
                                </div>
                            </li>
                            <li class="notification-item">
                                <span class="notification-icon success">&#10003;</span>
                                <div>
                                    **Nouveau Protocole** d'analyse disponible !
                                </div>
                            </li>
                        </ul> -->
                        <div class="text-center text-muted">
                            <span>aucune notification pour le moment</span>
                        </div>
                    </div>
                    <a href="#" class="btn">Voir toutes les notifications</a>
                </div>

                <div class="card" style=" grid-row: 2; grid-column: 2/4;">
                    <div class="card-header">Activités Récentes</div>
                    <div class="card-content">
                        <table class="activities-table">
                            <thead>
                                <tr>
                                    <th>Activité</th>
                                    <!-- <th>ID du patient</th> -->
                                    <th>Date</th>
                                    <th>Heure</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in recentPrescriptions.slice(0, 10)" :key="item.id_prescription_examen">
                                    <td>Prescription d'examen: {{ item.nom_examen }} pour {{ item.nom_patient }} {{ item.prenoms_patient }}</td>
                                    <!-- <td>PE-{{ item.id_prescription_examen }}</td> -->
                                    <td>{{ formatDate(item.date_demande) }}</td>
                                    <td>{{ formatTime(item.date_demande) }}</td>
                                    <td><span :class="item.statut_examen === 'Réalisé' ? 'status completed' : 'status pending'">{{ item.statut_examen }}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>


<style scoped>
.main-content {
    padding: 20px;
    display: grid;
    overflow-y: auto;
    grid-template-columns: 1fr 1fr 1fr;
    /* grid: auto-flow dense / 1fr 1fr 2fr; */
    /* grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); */
    /* 3 colonnes flexibles */
    gap: 20px;
}

.card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--gh-border-color);
}

.card-content {
    flex-grow: 1;
    /* Permet au contenu de prendre l'espace restant */
    overflow: auto;
    max-height: 240px;
}

.card p {
    font-size: 14px;
    line-height: 1.5;
    color: #586069;
    /* Gris légèrement plus clair */
}

.card .btn {
    align-self: flex-start;
    /* Aligne le bouton à gauche */
    margin-top: 10px;
    /* Espace au-dessus du bouton */
}

.stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
    min-height: 0;
    /* NEW */
    min-width: 0;
    /* NEW; needed for Firefox */
}

.stat-item {
    /* background-color: var(--gh-header-bg); */
    /* Un peu plus clair que le fond de carte */
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    padding: 10px;
    text-align: center;
    max-height: 100px;
    transition: all 0.2s ease-in-out;

}

.stat-item:hover {
    background-color: var(--gh-border-color);
    cursor: pointer;
}

.stat-item .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gh-primary-blue);
    margin-bottom: 5px;
    text-align: center;
}

.stat-item .label {
    font-size: 12px;
    color: #586069;
    text-transform: uppercase;
}

.notification-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.notification-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--gh-border-color);
    font-size: 14px;
}

.notification-item:last-child {
    border-bottom: none;
}

.notification-icon {
    font-size: 18px;
    line-height: 1;
}

.notification-icon.info {
    color: var(--gh-info-blue);
}

.notification-icon.warning {
    color: var(--gh-warning-orange);
}

.notification-icon.success {
    color: var(--gh-success-green);
}
</style>
