<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';
import { getAllOnlineProfessionals, countOnlineProfessionals } from '@/utils/professionnel';

const router = useRouter();

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'fa fa-home',
        path: '/admin/tableau-de-bord',
        active: true
    },
    {
        id: 2,
        name: 'Utilisateurs & Rôles',
        icon: 'fa fa-users-cog',
        path: '/admin/utilisateurs'
    },
    {
        id: 3,
        name: 'Services & Box',
        icon: 'fa fa-hospital-alt',
        path: '/admin/services'
    },
    {
        id: 4,
        name: 'Logs Système',
        icon: 'fa fa-history',
        path: '/admin/logs'
    },
    {
        id: 5,
        name: 'Paramètres',
        icon: 'fa fa-sliders-h',
        path: '/admin/parametres'
    }
];

// Stats
const stats = ref({
    activeAccounts: 124,
    patientsIdentifiedToday: 86,
    systemAlerts: 2,
    stockUsage: 92
});

// Recent activities
const recentActivities = ref([]);

// Fetch users from API
const fetchUsers = async () => {
    try {
        const users = await getAllOnlineProfessionals();
        const onlineCount = await countOnlineProfessionals();
        
        recentActivities.value = users.map((user, index) => ({
            id: user.id_professionnel || index,
            name: user.nom && user.prenoms ? `${user.nom} ${user.prenoms}` : user.nom || 'Inconnu',
            role: user.type_professionnel || 'Staff',
            specialty: user.specialite || 'N/A',
            initials: user.nom && user.prenoms 
                ? `${user.nom.charAt(0)}${user.prenoms.charAt(0)}` 
                : user.nom ? user.nom.charAt(0) : 'U',
            action: 'Connexion',
            status: user.is_online ? 'En ligne' : 'Hors ligne',
            statusType: user.is_online ? 'active' : 'inactive'
        }));
        
        // Update stats with real count
        stats.value.activeAccounts = onlineCount.count || users.length;
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        // Fallback to mock data
        recentActivities.value = [
            {
                id: 1,
                name: 'Dr. Antoine B.',
                role: 'Médecin',
                specialty: 'Généraliste',
                initials: 'DA',
                action: 'Consultation (Pat: #4402)',
                status: 'En ligne',
                statusType: 'active'
            },
            {
                id: 2,
                name: 'Sarah Lamine',
                role: 'Staff',
                specialty: 'Infirmière Triage',
                initials: 'SL',
                action: 'Prise constantes',
                status: 'En ligne',
                statusType: 'active'
            }
        ];
    }
};

// Security logs
const securityLogs = ref([
    {
        id: 1,
        type: 'danger',
        title: 'Échec de connexion',
        description: 'Tentative IP: 192.168.1.45',
        time: 'Il y a 2 min'
    },
    {
        id: 2,
        type: 'primary',
        title: 'Modification de rôle',
        description: 'Inf. Lucie M. promu "Chef de Poste"',
        time: 'Il y a 1h'
    },
    {
        id: 3,
        type: 'success',
        title: 'Backup Réussi',
        description: 'Sauvegarde cloud effectuée',
        time: '04:00 AM'
    }
]);

// Services status
const services = ref([
    { name: 'Triage / Constantes', status: 'Opérationnel', statusType: 'success' },
    { name: 'Laboratoire', status: 'Opérationnel', statusType: 'success' },
    { name: 'Pharmacie', status: 'Inventaire...', statusType: 'warning' }
]);

onMounted(async () => {
    // Fetch users from API
    await fetchUsers();
    
    // Placeholder for fetching stats
    stats.value = {
        activeAccounts: 124,
        patientsIdentifiedToday: 86,
        systemAlerts: 2,
        stockUsage: 92
    };
});

</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />
        <div class="main">
            <navbar />
            <div class="content animate-in">
                <div class="section-title">Administration - MediStat</div>

                <!-- KPI Cards -->
                <div class="grid-stats">
                    <div class="stat-card">
                        <span class="stat-label">Total d'utilisateur</span>
                        <span class="stat-value">{{ stats.activeAccounts }}</span>
                        <div class="stat-trend positive">+3 cette semaine</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Patients Identifiés (Jour)</span>
                        <span class="stat-value">{{ stats.patientsIdentifiedToday }}</span>
                        <div class="stat-trend neutral">72% via Carte QR</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Alertes Système</span>
                        <span class="stat-value warning">{{ stats.systemAlerts }}</span>
                        <div class="stat-trend neutral">Check-up requis</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Utilisation Stock</span>
                        <span class="stat-value">{{ stats.stockUsage }}%</span>
                        <div class="stat-trend negative">Réapprovisionner</div>
                    </div>
                </div>

                <div class="admin-grid">
                    <!-- Left Column -->
                    <div class="left-col">
                        <!-- Gestion des Utilisateurs -->
                        <div class="card">
                            <div class="card-header">
                                Gestion des Utilisateurs
                                <i class="fa fa-ellipsis-h" style="cursor:pointer; color: var(--gh-text-color-secondary);"></i>
                            </div>
                            <div class="user-list">
                                <div v-for="activity in recentActivities" :key="activity.id" class="user-item">
                                    <div class="user-info">
                                        <div class="avatar">{{ activity.initials }}</div>
                                        <div>
                                            <div class="user-name">{{ activity.name }}</div>
                                            <div class="user-type">{{ activity.role }} - {{ activity.specialty }}</div>
                                        </div>
                                    </div>
                                    <div class="user-actions">
                                        <span :class="['badge', activity.role === 'Médecin' ? 'badge-doctor' : activity.role === 'Admin' ? 'badge-admin' : 'badge-staff']">
                                            {{ activity.role }}
                                        </span>
                                        <span :class="['badge', activity.statusType === 'active' ? 'badge-active' : 'badge-inactive']">
                                            {{ activity.status }}
                                        </span>
                                        <button class="btn btn-sm">
                                            <i class="fa fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chart Section -->
                        <div class="card">
                            <div class="card-header">Volume de consultations hebdomadaire</div>
                            <div class="chart-container">
                                <canvas id="adminChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="right-col">
                        <!-- Security Logs -->
                        <div class="card">
                            <div class="card-header">Logs de Sécurité (Audit)</div>
                            <div class="logs-container">
                                <div v-for="log in securityLogs" :key="log.id" 
                                     class="log-item" 
                                     :class="`log-${log.type}`">
                                    <div class="log-title">{{ log.title }}</div>
                                    <div class="log-description">{{ log.description }}</div>
                                    <small class="log-time">{{ log.time }}</small>
                                </div>
                            </div>
                        </div>

                        <!-- Services Status -->
                        <div class="card">
                            <div class="card-header">Services Actifs</div>
                            <div class="services-container">
                                <div v-for="service in services" :key="service.name" class="service-item">
                                    <span class="service-name">{{ service.name }}</span>
                                    <span :class="['service-status', `status-${service.statusType}`]">
                                        {{ service.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// Chart.js initialization (will be mounted in onMounted)
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
    mounted() {
        this.initChart();
    },
    methods: {
        initChart() {
            const ctx = document.getElementById('adminChart');
            if (ctx) {
                new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                        datasets: [{
                            label: 'Consultations',
                            data: [65, 78, 42, 89, 95, 30, 20],
                            borderColor: '#0366d6',
                            backgroundColor: 'rgba(3, 102, 214, 0.1)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                grid: { color: '#f0f0f0' } 
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }
    }
}
</script>

<style scoped>
:vars {
    --border-radius: 6px;
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
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
}

/* --- STAT CARDS --- */
.grid-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 25px;
}

.stat-card {
    background: white;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    padding: 20px;
    box-shadow: rgba(27, 31, 35, 0.04) 0px 1px 0px;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    text-transform: uppercase;
    display: block;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
}

.stat-value.warning {
    color: var(--gh-warning-orange);
}

.stat-trend {
    font-size: 11px;
    margin-top: 5px;
}

.stat-trend.positive {
    color: var(--gh-success-green);
}

.stat-trend.neutral {
    color: var(--gh-text-color-secondary);
}

.stat-trend.negative {
    color: var(--gh-danger-red);
}

/* --- ADMIN GRID --- */
.admin-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
}

.card {
    background: white;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    margin-bottom: 20px;
}

.card-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fcfcfc;
}

/* --- TABLE --- */
.table {
    width: 100%;
    border-collapse: collapse;
}

.table th {
    text-align: left;
    padding: 12px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid var(--gh-border-color);
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.table td {
    padding: 12px 20px;
    border-bottom: 1px solid #f6f8fa;
    font-size: 13px;
}

.user-list {
    padding: 10px 0;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f6f8fa;
}

.user-item:last-child {
    border-bottom: none;
}

.user-item:hover {
    background-color: #f8f9fa;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-type {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f1f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    color: var(--gh-primary-blue);
}

.user-name {
    font-weight: 600;
}

.user-specialty {
    color: var(--gh-text-color-secondary);
    font-size: 12px;
}

.action-cell {
    color: var(--gh-text-color-secondary);
}

/* --- BADGES --- */
.badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
}

.badge-doctor {
    background: #dbedff;
    color: var(--gh-primary-blue);
}

.badge-staff {
    background: #e6ffed;
    color: var(--gh-success-green);
}

.badge-admin {
    background: #fee7e9;
    color: var(--gh-danger-red);
}

.badge-active {
    background: #e6ffed;
    color: var(--gh-success-green);
}

.badge-inactive {
    background: #f6f8fa;
    color: var(--gh-text-color-secondary);
}

/* --- CHART --- */
.chart-container {
    padding: 20px;
    height: 250px;
}

/* --- LOGS --- */
.logs-container {
    padding: 15px;
}

.log-item {
    margin-bottom: 15px;
    font-size: 12px;
    border-left: 2px solid;
    padding-left: 10px;
}

.log-danger {
    border-left-color: var(--gh-danger-red);
}

.log-primary {
    border-left-color: var(--gh-primary-blue);
}

.log-success {
    border-left-color: var(--gh-success-green);
}

.log-title {
    font-weight: 700;
}

.log-description {
    color: var(--gh-text-color-secondary);
}

.log-time {
    color: var(--gh-text-color-secondary);
    opacity: 0.7;
}

/* --- SERVICES --- */
.services-container {
    padding: 15px;
}

.service-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 13px;
}

.service-name {
    color: var(--gh-text-color);
}

.service-status {
    font-weight: 700;
}

.status-success {
    color: var(--gh-success-green);
}

.status-warning {
    color: var(--gh-warning-orange);
}

.status-danger {
    color: var(--gh-danger-red);
}

/* --- BUTTONS --- */
.btn {
    padding: 8px 16px;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--gh-border-color);
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: white;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-primary {
    background: var(--gh-primary-blue);
    color: white;
    border: none;
}

/* --- ANIMATION --- */
.animate-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
