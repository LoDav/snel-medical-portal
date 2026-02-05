<script setup>
import { onMounted, ref, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';
import { formatDate } from '../tools';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

// Enregistrer le plugin zoom
Chart.register(zoomPlugin);

const CHART_COLORS = {
    backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(201, 203, 207, 0.2)'
    ],
    borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ]
};
import { getWeeklyMovements, getMonthlyIncomingLots, getTodayExitsByMedicament, getTodayTotalExits, getRecentMovements, getDetailedMovements } from '@/utils/mouvementStock';
import { getTopDispensedMedicaments } from '@/utils/dispensation';
import { getPrescribedLinesCount } from '@/utils/lignePrescription';
import { getStockStatusSummary } from '@/utils/medicament';
import { countPrescriptionsWithActiveLines } from '@/utils/prescription';


import MonthlyReceptionsModal from './pha.components/MonthlyReceptionsModal.vue';
import TodayExitsModal from './pha.components/TodayExitsModal.vue';
import LowStockModal from './pha.components/LowStockModal.vue';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

const router = useRouter();
const userInfo = ref(null);

// Variables pour les graphiques
let stockMovementChartInstance = null;
let stockStatusChartInstance = null;
let topDispensedChartInstance = null;

// Données pour les mouvements hebdomadaires
const weeklyMovements = ref([]);

// Données pour les lots entrants du mois
const monthlyIncomingLots = ref(0);

// Données pour les sorties du jour
const todayTotalExits = ref(0);

// Données pour les top médicaments dispensés
const topDispensedMedicaments = ref([]);

// Données pour les ordonnances en attente
const pendingPrescriptionsCount = ref(0);

// Données pour les mouvements récents
const recentMovements = ref([]);

// Données pour le résumé des statuts de stock
const stockStatusSummary = ref({ normal: 0, faible: 0, rupture: 0 });

// Données pour les mouvements détaillés
const detailedMovements = ref([]);

// Supprimé : Filtres de date pour le graphique

// État du modal des réceptions mensuelles
const showMonthlyReceptionsModal = ref(false);

// État du modal des sorties du jour
const showTodayExitsModal = ref(false);

// État du modal des stocks faibles
const showLowStockModal = ref(false);

const goTo = (url) => {
    router.push(url);
};

const toggleMonthlyReceptionsModal = () => {
    showMonthlyReceptionsModal.value = !showMonthlyReceptionsModal.value;
};

const toggleTodayExitsModal = () => {
    showTodayExitsModal.value = !showTodayExitsModal.value;
};

const toggleLowStockModal = () => {
    showLowStockModal.value = !showLowStockModal.value;
};

// Fonction pour récupérer les données réelles des mouvements de stock hebdomadaires
const fetchWeeklyMovements = async () => {
    try {
        const data = await getWeeklyMovements();
        weeklyMovements.value = data;
        console.log('Données des mouvements hebdomadaires récupérées:', data);
        return processMovementData(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des mouvements hebdomadaires:', error);
        // Fallback vers les données mockées en cas d'erreur
        return mockMovementData();
    }
};

// Fonction pour récupérer le nombre de lots entrants du mois
const fetchMonthlyIncomingLots = async () => {
    try {
        const data = await getMonthlyIncomingLots();
        monthlyIncomingLots.value = data.nombre_lots_entres_mois || 0;
        console.log('Nombre de lots entrants du mois:', monthlyIncomingLots.value);
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre de lots entrants:', error);
        monthlyIncomingLots.value = 0;
    }
};

// Fonction pour récupérer le total des sorties du jour
const fetchTodayTotalExits = async () => {
    try {
        const data = await getTodayTotalExits();
        todayTotalExits.value = data.total_unites_sorties_aujourdhui || 0;
        console.log('Total des sorties du jour:', todayTotalExits.value);
    } catch (error) {
        console.error('Erreur lors de la récupération du total des sorties du jour:', error);
        todayTotalExits.value = 0;
    }
};

// Fonction pour récupérer les top médicaments dispensés du mois
const fetchTopDispensedMedicaments = async () => {
    try {
        const data = await getTopDispensedMedicaments();
        topDispensedMedicaments.value = data || [];
        console.log('Données des top médicaments dispensaries:', data);
        console.log('Top médicaments dispensés:', topDispensedMedicaments.value);
        return processTopDispensedData(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des top médicaments dispensés:', error);
        topDispensedMedicaments.value = [];
        return mockTopDispensedData();
    }
};

// Fonction pour récupérer le nombre d'ordonnances en attente
const fetchPendingPrescriptionsCount = async () => {
    try {
        // const data = await getPrescribedLinesCount();
        const data = await countPrescriptionsWithActiveLines();
        pendingPrescriptionsCount.value = data.Nombre_Prescriptions_Avec_Lignes_Actives || 0;
        console.log('Nombre d\'ordonnances en attente:', pendingPrescriptionsCount.value);
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'ordonnances en attente:', error);
        pendingPrescriptionsCount.value = 0;
    }
};

// Fonction pour récupérer les mouvements récents
const fetchRecentMovements = async () => {
    try {
        const data = await getRecentMovements(5);
        recentMovements.value = data || [];
        console.log('Mouvements récents:', recentMovements.value);
    } catch (error) {
        console.error('Erreur lors de la récupération des mouvements récents:', error);
        recentMovements.value = [];
    }
};

// Fonction pour récupérer le résumé des statuts de stock
const fetchStockStatusSummary = async () => {
    try {
        const data = await getStockStatusSummary();
        stockStatusSummary.value = {
            normal: parseInt(data.produits_stock_normal) || 0,
            faible: parseInt(data.produits_stock_faible) || 0,
            rupture: parseInt(data.produits_en_rupture) || 0
        };
        console.log('Résumé des statuts de stock:', stockStatusSummary.value);
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé des statuts de stock:', error);
        stockStatusSummary.value = { normal: 0, faible: 0, rupture: 0 };
    }
};

// Fonction pour récupérer les mouvements détaillés
const fetchDetailedMovements = async () => {
    try {
        const data = await getDetailedMovements();
        console.log('datassss', JSON.stringify(data), data);

        detailedMovements.value = data || [];
        console.log('Mouvements détaillés:', detailedMovements.value);

        return processDetailedMovementData(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des mouvements détaillés:', error);
        detailedMovements.value = [];
        return mockDetailedMovementData();
    }
};

// Supprimé : Fonctions de filtres et zoom

// Fonction pour traiter les données des mouvements hebdomadaires
const processMovementData = (data) => {
    // Grouper par semaine et jour
    const groupedData = {};
    data.forEach(item => {
        const weekKey = item.annee_semaine;
        if (!groupedData[weekKey]) {
            groupedData[weekKey] = {};
        }
        // Normaliser le nom du jour (première lettre en majuscule)
        const normalizedDay = item.nom_jour.charAt(0).toUpperCase() + item.nom_jour.slice(1).toLowerCase();
        groupedData[weekKey][normalizedDay] = {
            entrees: parseInt(item.total_entrees) || 0,
            sorties: parseInt(item.total_sorties) || 0
        };
    });

    // Prendre la semaine la plus récente
    const weeks = Object.keys(groupedData).sort((a, b) => b - a);
    const latestWeek = weeks.length > 0 ? groupedData[weeks[0]] : {};

    // Créer les labels et données pour le graphique
    const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const labels = [];
    const entries = [];
    const exits = [];

    dayOrder.forEach(day => {
        labels.push(day.substring(0, 3)); // Abréviation: Lun, Mar, etc.
        if (latestWeek[day]) {
            entries.push(latestWeek[day].entrees);
            exits.push(latestWeek[day].sorties);
        } else {
            entries.push(0);
            exits.push(0);
        }
    });

    return { labels, entries, exits };
};

// Fonction pour générer des données de graphique mockées pour les mouvements de stock (fallback)
const mockMovementData = () => {
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const entries = [];
    const exits = [];

    labels.forEach(() => {
        entries.push(Math.floor(Math.random() * 80) + 20);
        exits.push(Math.floor(Math.random() * 60) + 15);
    });

    return { labels, entries, exits };
};

// Fonction pour générer des données de statut de stock mockées
const mockStockStatusData = () => {
    return {
        labels: ['Normal', 'Faible/Critique', 'Hors Stock'],
        data: [
            Math.floor(Math.random() * 150) + 50, // Normal
            Math.floor(Math.random() * 20) + 5,   // Faible
            Math.floor(Math.random() * 10) + 1    // Hors Stock
        ]
    };
};

// Fonction pour traiter les données des top médicaments dispensés
const processTopDispensedData = (data) => {
    if (!data || data.length === 0) {
        return mockTopDispensedData();
    }

    return {
        labels: data.map(item => item.nom_commercial),
        counts: data.map(item => parseInt(item.total_delivre) || 0)
    };
};

// Fonction pour générer des données de top produits dispensés mockées (fallback)
const mockTopDispensedData = () => {
    const products = [
        "Doliprane 500mg", "Ibuprofène 400mg", "Vitamine D",
        "Sérum Phy.", "Antiseptique"
    ];
    const dispensedCounts = products.map(() => Math.floor(Math.random() * 100) + 30);

    // Trie pour avoir le Top 5
    const sortedData = products.map((product, index) => ({
        product,
        count: dispensedCounts[index]
    })).sort((a, b) => b.count - a.count);

    return {
        labels: sortedData.map(d => d.product),
        counts: sortedData.map(d => d.count)
    };
};

// Fonction pour reset le zoom
const resetZoom = () => {
    if (stockMovementChartInstance) {
        stockMovementChartInstance.resetZoom();
    }
};

// Fonction pour traiter les données des mouvements détaillés
const processDetailedMovementData = (data) => {
    if (!data || data.length === 0) {
        return mockDetailedMovementData();
    }

    // Trier les données par date décroissante et prendre les 20 dernières
    const sortedData = data.sort((a, b) => new Date(b.Date_Mouvement) - new Date(a.Date_Mouvement));
    const recentData = sortedData.slice(0, 20);

    const labels = recentData.map(item => {
        const date = new Date(item.Date_Mouvement);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hour = item.heurs.substring(0, 2); // Prendre seulement l'heure
        return `${day}/${month} ${hour}h`;
    });

    const mouvements = recentData.map(item => ({
        value: parseInt(item.Quantite_Mouvement) || 0,
        produit: item.Nom_Produit || 'N/A',
        type: item.type_mouvement || 'N/A'
    }));

    return { labels, mouvements };
};

// Fonction pour générer des données de mouvements détaillés mockées (fallback)
const mockDetailedMovementData = () => {
    const labels = [];
    const mouvements = [];

    // Générer des données pour les 20 derniers mouvements
    const produits = ['Diamicron', 'Paracetamol', 'Clamoxyl', 'Ibuprofène', 'Vitamine D', 'Aspirine'];
    const typesMouvement = ['DISPENSATION', 'CORRECTION_SORTIE', 'RÉCEPTION', 'CORRECTION_ENTRÉE'];

    for (let i = 19; i >= 0; i--) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 30); // Espacer de 30 minutes
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        labels.push(`${day}/${month} ${hour}h`);

        // Générer des valeurs positives et négatives aléatoirement
        const mouvement = Math.random() > 0.5 ?
            Math.floor(Math.random() * 50) + 10 : // positif
            -(Math.floor(Math.random() * 40) + 5); // négatif

        const produit = produits[Math.floor(Math.random() * produits.length)];
        const type = typesMouvement[Math.floor(Math.random() * typesMouvement.length)];

        mouvements.push({
            value: mouvement,
            produit: produit,
            type: type
        });
    }

    return { labels, mouvements };
};

// --- 1. GRAPHIQUE DES MOUVEMENTS DE STOCK (Barres avec ligne centrale) ---
const drawStockMovementChart = async () => {
    const processedData = await fetchDetailedMovements();
    const ctx = document.getElementById('stockMovementChart').getContext('2d');

    if (stockMovementChartInstance) stockMovementChartInstance.destroy();

    stockMovementChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: processedData.labels,
            datasets: [
                {
                    label: 'Mouvements de Stock',
                    data: processedData.mouvements.map(m => m.value),
                    borderSkipped: false,
                    borderRadius: 5,
                    backgroundColor: processedData.mouvements.map(m =>
                        m.value >= 0 ? CHART_COLORS.backgroundColor[3] : CHART_COLORS.backgroundColor[1]
                    ),
                    borderColor: processedData.mouvements.map(m =>
                        m.value >= 0 ? CHART_COLORS.borderColor[3] : CHART_COLORS.borderColor[1]
                    ),
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: function (context) {
                            if (context.tick.value === 0) {
                                return 'rgba(0, 0, 0, 0.3)'; // Ligne centrale plus épaisse
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        },
                        lineWidth: function (context) {
                            if (context.tick.value === 0) {
                                return 2; // Ligne centrale plus épaisse
                            }
                            return 1;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const mouvement = processedData.mouvements[index];
                            const value = context.parsed.y;
                            const type = value >= 0 ? 'Entrée' : 'Sortie';
                            return [
                                `${type}: ${Math.abs(value)} unités`,
                                `Produit: ${mouvement.produit}`,
                                `Type: ${mouvement.type}`
                            ];
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            }
        }
    });
};

// --- 2. GRAPHIQUE DES STATUTS DE STOCK (Doughnut) ---
const drawStockStatusChart = () => {
    const labels = ['Normal', 'Faible/Critique', 'Hors Stock'];
    const data = [
        stockStatusSummary.value.normal,
        stockStatusSummary.value.faible,
        stockStatusSummary.value.rupture
    ];
    const ctx = document.getElementById('stockStatusChart').getContext('2d');

    if (stockStatusChartInstance) stockStatusChartInstance.destroy();

    stockStatusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    CHART_COLORS.backgroundColor[3], // Normal - vert
                    CHART_COLORS.backgroundColor[1], // Faible - orange
                    CHART_COLORS.backgroundColor[0]  // Hors Stock - rouge
                ],
                borderColor: [
                    CHART_COLORS.borderColor[3], // Normal - vert
                    CHART_COLORS.borderColor[1], // Faible - orange
                    CHART_COLORS.borderColor[0]  // Hors Stock - rouge
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label + ' produits';
                        }
                    }
                }
            }
        }
    });
};

// --- 3. GRAPHIQUE DES TOP PRODUITS DISPENSÉS (Barres horizontales) ---
const drawTopDispensedChart = async () => {
    const { labels, counts } = await fetchTopDispensedMedicaments();
    const ctx = document.getElementById('topDispensedChart').getContext('2d');

    if (topDispensedChartInstance) topDispensedChartInstance.destroy();

    topDispensedChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unités Dispensées',
                data: counts,
                backgroundColor: CHART_COLORS.backgroundColor[4],
                borderColor: CHART_COLORS.borderColor[4],
                borderRadius: 5,
                borderSkipped: false,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Barres horizontales
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true },
                y: {}
            },
            plugins: {
                legend: { display: false },
            }
        }
    });
};

// --- Initialisation et Redimensionnement ---
const initializeCharts = () => {
    nextTick(() => {
        drawStockMovementChart();
        drawStockStatusChart();
        drawTopDispensedChart();
    });
};

onMounted(async () => {
    userInfo.value = getUserInfo();
    await fetchMonthlyIncomingLots(); // Récupérer les données des lots entrants
    await fetchTodayTotalExits(); // Récupérer le total des sorties du jour
    await fetchPendingPrescriptionsCount(); // Récupérer le nombre d'ordonnances en attente
    await fetchRecentMovements(); // Récupérer les mouvements récents
    await fetchStockStatusSummary(); // Récupérer le résumé des statuts de stock
    initializeCharts();

    // Gère le redimensionnement
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initializeCharts();
        }, 150);
    });
});

onUnmounted(() => {
    if (stockMovementChartInstance) stockMovementChartInstance.destroy();
    if (stockStatusChartInstance) stockStatusChartInstance.destroy();
    if (topDispensedChartInstance) topDispensedChartInstance.destroy();
});
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord"
                    :active="true" />
                <!-- <DashboardLink text="Médicaments" icon="medkit" to="/pharmacie/medicaments" /> -->
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" />
                <!-- <DashboardLink text="Mouvements" icon="exchange" to="/pharmacie/mouvements" /> -->
                <DashboardLink text="Prescriptions" icon="plus-square" to="/pharmacie/dispensations" />
                <!-- <DashboardLink text="Inventaire" icon="list" to="/pharmacie/inventaire" /> -->
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

    <div class="content animate__animated animate__fadeIn">
        <h1 class="section-title">Tableau de Bord - Pharmacie</h1>

        <!-- SECTION 1: KPI STATISTIQUES RAPIDES (4 colonnes sur desktop, 2 sur tablette) -->
        <div class="grid-container-stat">
            <!-- STATISTIQUE 1: Ordonnances en Attente -->
            <div class="card stat-card" @click="pendingPrescriptionsCount > 0 ? goTo('/pharmacie/dispensations') : null"
                :style="pendingPrescriptionsCount > 0 ? { cursor: 'pointer' } : {}">
                <div class="label" style="color: var(--gh-primary-blue);">
                    <i class="fa fa-clock-o"></i> Ordonnances en Attente
                </div>
                <div class="value">{{ pendingPrescriptionsCount }}</div>
                <div v-if="pendingPrescriptionsCount > 0" class="hover-hint"
                    style="font-size: 0.75rem; color: var(--gh-text-color-secondary); margin-top: 5px;">
                    <i class="fa fa-info-circle"></i> Cliquez pour voir les ordonnances
                </div>
            </div>

            <!-- STATISTIQUE 2: Ventes/Sorties du Jour -->
            <div class="card stat-card" @click="toggleTodayExitsModal" style="cursor: pointer;">
                <div class="label" style="color: var(--gh-warning-orange);">
                    <i class="fa fa-arrow-circle-o-up"></i> Sorties du Jour (Unités)
                </div>
                <div class="value">{{ todayTotalExits }}</div>
                <div class="hover-hint"
                    style="font-size: 0.75rem; color: var(--gh-text-color-secondary); margin-top: 5px;">
                    <i class="fa fa-info-circle"></i> Cliquez pour voir les détails
                </div>
            </div>

            <!-- STATISTIQUE 3: Articles à Stock Faible -->
            <div class="card stat-card" @click="toggleLowStockModal" style="cursor: pointer;">
                <div class="label" style="color: var(--gh-danger-red);">
                    <i class="fa fa-exclamation-triangle"></i> Stock Critique
                </div>
                <div class="value">{{ stockStatusSummary.faible }}</div>
                <div class="hover-hint"
                    style="font-size: 0.75rem; color: var(--gh-text-color-secondary); margin-top: 5px;">
                    <i class="fa fa-info-circle"></i> Cliquez pour voir les détails
                </div>
            </div>

            <!-- STATISTIQUE 4: Réceptions/Entrées du Mois -->
            <div class="card stat-card" @click="toggleMonthlyReceptionsModal" style="cursor: pointer;">
                <div class="label" style="color: var(--gh-success-green);">
                    <i class="fa fa-arrow-circle-o-down"></i> Entrées du Mois (Lots)
                </div>
                <div class="value">{{ monthlyIncomingLots }}</div>
                <div class="hover-hint"
                    style="font-size: 0.75rem; color: var(--gh-text-color-secondary); margin-top: 5px;">
                    <i class="fa fa-info-circle"></i> Cliquez pour voir les détails
                </div>
            </div>
        </div>

        <!-- SECTION 2: GRAPHIQUES ET TABLEAU DÉTAILLÉS (2 colonnes sur desktop et tablette) -->
        <div class="grid-container analytics-grid">

            <!-- 1. GRAPHIQUE DE MOUVEMENTS DE STOCK (Barres avec ligne centrale) - Prend 2 colonnes (Ligne 1) -->
            <div class="card large-card-2">
                <div class="card-header">
                    Mouvements de Stock
                    <button @click="resetZoom" class="btn btn-rounded btn-sm float-right" title="Réinitialiser le zoom">
                        <i class="fa fa-search-minus"></i> Reset Zoom
                    </button>
                </div>
                <div class="chart-container">
                    <canvas id="stockMovementChart"></canvas>
                </div>
            </div>

            <!-- 2. RÉPARTITION DES STATUTS DE STOCK (Doughnut) - Prend 1 colonne (Ligne 2, Col 1) -->
            <div class="card">
                <div class="card-header">Répartition des Statuts de Stock</div>
                <div class="chart-container">
                    <canvas id="stockStatusChart"></canvas>
                </div>
            </div>

            <!-- 3. PRODUITS LES PLUS DISPENSÉS (Barres Horizontales) - Prend 1 colonne (Ligne 2, Col 2) -->
            <div class="card">
                <div class="card-header">Produits les Plus Demandés</div>
                <div class="chart-container">
                    <canvas id="topDispensedChart"></canvas>
                </div>
            </div>

            <!-- 4. TABLEAU D'ACTIVITÉ RÉCENTE - Prend 2 colonnes (Ligne 3) -->
            <div class="card large-card-2">
                <div class="card-header">Derniers Mouvements de Stock</div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Type Produit</th>
                                <th>Type Mouvement</th>
                                <th>Qté</th>
                                <th>Date/Heure</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="movement in recentMovements.slice(0, 5)"
                                :key="movement.Produit + movement.Date_Heure_Mouvement">
                                <td>{{ movement.Produit || 'N/A' }}</td>
                                <td>{{ movement.Type_Produit || 'N/A' }}</td>
                                <td
                                    :style="{ color: movement.Type_Mouvement && movement.Type_Mouvement.toLowerCase().includes('réception') ? 'var(--gh-success-green)' : 'var(--gh-warning-orange)' }">
                                    <i
                                        :class="movement.Type_Mouvement && movement.Type_Mouvement.toLowerCase().includes('réception') ? 'fas fa-sign-in-alt' : 'fas fa-sign-out-alt'"></i>
                                    {{ movement.Type_Mouvement || 'N/A' }}
                                </td>
                                <td>{{ movement.Qté || 0 }}</td>
                                <td>{{ movement.Date_Heure_Mouvement ? new
                                    Date(movement.Date_Heure_Mouvement).toLocaleString('fr-FR', {
                                        hour: '2-digit',
                                    minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A' }}</td>
                            </tr>
                            <tr v-if="recentMovements.length === 0">
                                <td colspan="5" style="text-align: center; color: var(--gh-text-color-secondary);">
                                    Aucun mouvement récent
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal des réceptions mensuelles -->
    <MonthlyReceptionsModal :show="showMonthlyReceptionsModal" @close="toggleMonthlyReceptionsModal" />

    <!-- Modal des sorties du jour -->
    <TodayExitsModal :show="showTodayExitsModal" @close="toggleTodayExitsModal" />

    <!-- Modal des stocks faibles -->
    <LowStockModal :show="showLowStockModal" @close="toggleLowStockModal" />

    <!-- <DoctorsOnlineModal :show="showPharmaciensOnlineModal" @close="togglePharmaciensOnlineModal"
        :professionalType="'Pharmacien'" /> -->
</template>

<style scoped>
/* ------------------------------------------------ */
/* --- DÉFINITIONS DES VARIABLES CSS (Thème Clair) --- */
/* ------------------------------------------------ */
:root {
    /* Couleurs de base et typo (GitHub Light Style) */
    --gh-bg-color: #ffffff;
    --gh-text-color: #24292e;
    --gh-text-color-secondary: #586069;
    --gh-border-color: #e1e4e8;
    --gh-header-bg: #f6f8fa;
    /* Utilisé pour la Navbar et les fonds légers */
    --gh-card-bg: #ffffff;

    /* Couleurs d'accentuation pour les KPIs et le texte */
    --gh-primary-blue: #0366d6;
    --gh-success-green: #28a745;
    --gh-danger-red: #d73a49;
    --gh-warning-orange: #f6a137;

    /* Rayon de bordure et ombres */
    --border-radius: 6px;
    --gh-shadow: rgba(27, 31, 35, 0.08) 0px 1px 0px, rgba(27, 31, 35, 0.04) 0px 0px 1px;
}

/* ------------------------------------------------ */
/* --- STYLES GÉNÉRAUX & STRUCTURE --- */
/* ------------------------------------------------ */
.content {
    padding: 30px;
    width: 1300px;
    margin: auto;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 25px;
    color: var(--gh-text-color);
    padding-top: 10px;
}

/* GRILLE & CARTES */
/* GRILLE PRINCIPALE POUR LES ANALYTICS (Graphiques et Tableau) */
.grid-container {
    display: grid;
    gap: 20px;
    /* 2 colonnes par défaut sur desktop */
    grid-template-columns: repeat(2, 1fr);

    margin-bottom: 20px;
    margin-top: 20px;
}

/* GRILLE SPÉCIFIQUE POUR LES STATISTIQUES (KPI) */
.grid-container-stat {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(4, 1fr);
    /* 4 colonnes par défaut sur desktop */
    margin-bottom: 30px;
}

.card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    box-shadow: var(--gh-shadow);
    padding: 20px;
    transition: transform 0.2s;
    /* height: 100%; */
    /* display: flex;
    flex-direction: column; */
    /* width: 100%; */
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.reset-zoom-btn {
    padding: 6px 12px;
    background-color: var(--gh-primary-blue);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: background-color 0.2s;
}

.reset-zoom-btn:hover {
    background-color: #0056b3;
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

/* Les grandes cartes prennent les 2 colonnes (la largeur totale) */
.chart-container {
    position: relative;
    flex-grow: 1;
    min-height: 250px;
}

/* Style Tableau */
.table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.table thead th {
    text-align: left;
    padding: 10px 15px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    border-bottom: 2px solid var(--gh-border-color);
}

.table tbody td {
    padding: 12px 15px;
    border-bottom: 1px solid var(--gh-border-color);
    color: var(--gh-text-color);
}

.table tbody tr:last-child td {
    border-bottom: none;
}

/* MEDIA QUERIES */
@media (max-width: 1024px) {

    /* KPIs (grid-container-stat) passent de 4 à 2 colonnes */
    .grid-container-stat {
        grid-template-columns: repeat(2, 1fr);
    }

    /* La grille analytics (grid-container) est à 2 colonnes */
    .grid-container,
    .analytics-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    /* Le grand graphique prend tout l'espace sur 2 colonnes (inchangé) */
    .large-card-2 {
        grid-column: 1 / span 2;
    }
}

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .reset-zoom-btn {
        align-self: flex-end;
    }
}

@media (max-width: 600px) {
    .content {
        padding: 15px;
    }

    /* Toutes les grilles passent à 1 colonne sur mobile */
    .grid-container-stat,
    .grid-container,
    .analytics-grid {
        grid-template-columns: 1fr;
    }

    .large-card-2 {
        grid-column: 1 / span 1;
    }

    .reset-zoom-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>