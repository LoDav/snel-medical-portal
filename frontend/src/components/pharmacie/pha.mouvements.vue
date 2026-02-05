<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';
import { getAllMouvementsStock, getMouvementsStockByMedicament, deleteMouvementStock } from '@/utils/mouvementStock';
import { getAllMedicaments } from '@/utils/medicament';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

const router = useRouter();
const userInfo = ref(null);

// Données
const currentMode = ref('movement');
const selectedMovementId = ref(null);
const searchQuery = ref('');
const allMovements = ref([]);
const allMedicaments = ref([]);

// Fonctions utilitaires
const getMedicine = (id) => {
    return allMedicaments.value.find(m => m.id_medicament === id);
};

const getMovement = (id) => {
    return allMovements.value.find(m => m.id_mouvement === id);
};

// Propriétés calculées
const filteredMovements = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return allMovements.value.filter(m => {
        const med = getMedicine(m.id_medicament);
        const searchableText = `${m.type_mouvement} ${med?.nom_commercial || ''} ${m.numero_lot || ''} ${m.source || ''} ${m.commentaire || ''}`.toLowerCase();
        return searchableText.includes(query);
    }).sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement)); // Plus récents en premier
});

const selectedMovement = computed(() => {
    return getMovement(selectedMovementId.value);
});

// Méthodes
const goTo = (url) => {
    router.push(url);
};

const switchMode = (mode) => {
    currentMode.value = mode;
    selectedMovementId.value = null;
    searchQuery.value = '';

    if (mode === 'stock') {
        router.push('/pharmacie/stocks');
    } else if (mode === 'dispensation') {
        router.push('/pharmacie/dispensations');
    } else if (mode === 'movement') {
        // Rester sur mouvements
        loadMovements();
    }
};

const selectMovement = (id) => {
    selectedMovementId.value = id;
};

const loadMovements = async () => {
    try {
        allMovements.value = await getAllMouvementsStock();
        console.log('Mouvements chargés:', allMovements.value);
    } catch (error) {
        console.error('Erreur lors du chargement des mouvements:', error);
    }
};

const loadMedicaments = async () => {
    try {
        allMedicaments.value = await getAllMedicaments();
        console.log('Médicaments chargés:', allMedicaments.value);
    } catch (error) {
        console.error('Erreur lors du chargement des médicaments:', error);
    }
};

const cancelMovement = async (movementId) => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce mouvement ? Cette action créera une correction.')) {
        try {
            await deleteMouvementStock(movementId);
            await loadMovements(); // Recharger la liste
            selectedMovementId.value = null;
            alert('Mouvement annulé avec succès.');
        } catch (error) {
            console.error('Erreur lors de l\'annulation du mouvement:', error);
            alert('Erreur lors de l\'annulation du mouvement.');
        }
    }
};

onMounted(async () => {
    userInfo.value = getUserInfo();
    await loadMedicaments();
    await loadMovements();
});

const getMovementIcon = (type, quantity) => {
    if (quantity > 0) {
        return 'fa fa-arrow-down'; // Entrée
    } else if (quantity < 0) {
        return 'fa fa-arrow-up'; // Sortie
    }
    return 'fa fa-arrow-right'; // Info
};

const getQuantityClass = (quantity) => {
    if (quantity > 0) {
        return 'movement-inflow';
    } else if (quantity < 0) {
        return 'movement-outflow';
    }
    return 'movement-info';
};

const getActionIcon = (quantity) => {
    if (quantity > 0) {
        return 'fa fa-plus-circle';
    } else if (quantity < 0) {
        return 'fa fa-minus-circle';
    }
    return 'fa fa-info-circle';
};
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord" />
                <!-- <DashboardLink text="Médicaments" icon="medkit" to="/pharmacie/medicaments" /> -->
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" />
                <DashboardLink text="Mouvements" icon="exchange" to="/pharmacie/mouvements" :active="true" />
                <DashboardLink text="Dispensations" icon="pills" to="/pharmacie/dispensations" />
                <DashboardLink text="Inventaire" icon="list" to="/pharmacie/inventaire" />
            </ul>
            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>
                <div class="ml-3">
                    <HeaderUser />
                </div>
            </div>
        </div>
    </nav>

    <div class="main-wrapper animate__animated animate__fadeIn">
        <div class="container">
            <div class="header">
                <div v-if="userInfo">
                    <h1>Gestion de la Pharmacie</h1>
                </div>
            </div>

            <!-- <div class="tab-buttons">
                <button class="tab-button" @click="switchMode('stock')">
                    <i class="fa fa-cubes" style="margin-right: 8px;"></i> Gestion des Stocks
                </button>
                <button class="tab-button" @click="switchMode('dispensation')">
                    <i class="fa fa-pills" style="margin-right: 8px;"></i> Dispensations
                </button>
                <button class="tab-button active" @click="switchMode('movement')">
                    <i class="fa fa-exchange" style="margin-right: 8px;"></i> Mouvements
                </button>
            </div> -->

            <div class="main-content">
                <!-- Left Panel: Movement List -->
                <div class="sidebar" style="width: 400px;">
                    <div style="margin-bottom: 20px; display: flex; gap: 10px;" class="search-box">
                        <input v-model="searchQuery" type="search" placeholder="Rechercher par type, produit ou lot..."
                            class="form-group input[type='search']">
                    </div>

                    <div id="list-container" style="max-height: calc(100vh - 250px); overflow-y: auto;">
                        <div v-for="m in filteredMovements" :key="m.id_mouvement"
                            :class="['list-item', { 'active': selectedMovementId === m.id_mouvement }]"
                            @click="selectMovement(m.id_mouvement)">
                            <div>
                                <h3 class="item-title">
                                    <i :class="getMovementIcon(m.type_mouvement, m.quantite)"
                                        style="margin-right: 5px;"></i>
                                    {{ m.type_mouvement }}
                                </h3>
                                <small class="text-muted">{{ new Date(m.date_mouvement).toLocaleDateString() }} - {{
                                    getMedicine(m.id_medicament)?.nom_commercial || 'N/A' }}</small>
                            </div>

                            <div class="item-meta">
                                <span :class="getQuantityClass(m.quantite)">
                                    {{ m.quantite > 0 ? '+' : '' }}{{ m.quantite }} Unités
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Movement Details -->
                <div class="detail-panel">
                    <div v-if="!selectedMovement" style="text-align: center; margin-top: 50px;">
                        <p style="color: var(--gh-text-color-secondary);">Sélectionnez un mouvement dans la liste pour
                            voir ses détails.</p>
                    </div>

                    <div v-else>
                        <h2 class="detail-title" style="margin-bottom: 0;">Détails du Mouvement</h2>
                        <small class="mb-4 text-muted">#{{ selectedMovement.id_mouvement }}</small>
                        <br>
                        <br>
                        <div
                            style="background-color: var(--gh-header-bg); padding: 15px; border-radius: 8px; border: 1px solid var(--gh-border-color); margin-bottom: 1.5rem;">
                            <p style="font-size: 1.125rem; font-weight: 700; margin-bottom: 5px;">Type: <span
                                    :class="getQuantityClass(selectedMovement.quantite)">{{
                                        selectedMovement.type_mouvement }}</span></p>
                            <p style="font-size: 1.5rem; font-weight: 700;">Quantité: <span
                                    :class="getQuantityClass(selectedMovement.quantite)">
                                    <i :class="getActionIcon(selectedMovement.quantite)" style="margin-right: 5px;"></i>
                                    {{ selectedMovement.quantite > 0 ? '+' : '' }}{{ selectedMovement.quantite }} Unités
                                </span></p>
                            <p style="font-size: 0.875rem; color: var(--gh-text-color-secondary);">Date: {{ new
                                Date(selectedMovement.date_mouvement).toLocaleDateString() }}</p>
                        </div>

                        <h3 class="detail-subtitle"><i class="fas fa-prescription-bottle-alt"
                                style="margin-right: 4px;"></i> Produit Associé</h3>
                        <p><strong>Médicament:</strong> {{ getMedicine(selectedMovement.id_medicament)?.nom_commercial
                            || 'N/A' }} ({{ getMedicine(selectedMovement.id_medicament)?.nom_generique || 'N/A' }})</p>
                        <p style="margin-top: 5px;"><strong>Lot Concerné:</strong> {{ selectedMovement.numero_lot ||
                            'N/A' }}</p>

                        <h3 class="detail-subtitle"><i class="fas fa-clipboard-list" style="margin-right: 4px;"></i>
                            Références</h3>
                        <p><strong>Source / Cible:</strong> {{ selectedMovement.source || 'N/A' }}</p>
                        <p style="margin-top: 5px;"><strong>Note:</strong> {{ selectedMovement.commentaire || 'Aucune note' }}</p>

                        <button class="btn btn-outline-danger" style="margin-top: 2rem;"
                            @click="cancelMovement(selectedMovement.id_mouvement)">
                            <i class="fas fa-undo-alt"></i> Annuler le Mouvement (Correction)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Styles spécifiques aux mouvements utilisant les classes CSS existantes */

/* Sélecteur de mode */
.mode-selector {
    display: flex;
    margin-bottom: 1.5rem;
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 1px 3px var(--gh-shadow);
    max-width: 600px;
}

.app-btn-mode {
    flex: 1;
    padding: 10px 15px;
    border-radius: 6px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    color: var(--gh-text-color-secondary);
    border: none;
}

.app-btn-mode:hover {
    background-color: var(--gh-navbar-link-hover);
}

.app-btn-mode.active {
    background-color: var(--gh-primary-blue);
    color: var(--gh-bg-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Conteneur principal deux panneaux */
.main-container {
    display: flex;
    height: calc(100vh - 10rem);
    max-width: 1400px;
    margin: 0 auto;
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

/* Colonne de gauche */
.left-panel {
    flex-basis: 350px;
    min-width: 300px;
    background-color: var(--gh-sidebar-bg);
    border-right: 1px solid var(--gh-sidebar-border);
    overflow-y: auto;
    flex-shrink: 0;
    padding: 20px;
}

/* Colonne de droite */
.right-panel {
    flex-grow: 1;
    background-color: var(--gh-card-bg);
    overflow-y: auto;
    padding: 20px;
}

/* Style des éléments de liste */
.list-item {
    padding: 12px 15px;
    border-bottom: 1px solid var(--gh-sidebar-border);
    cursor: pointer;
    transition: background-color 0.15s;
    border-radius: 4px;
    margin-bottom: 5px;
}

.list-item:hover,
.list-item.active {
    background-color: var(--gh-navbar-link-hover);
    border-left: 4px solid var(--gh-primary-blue);
    padding-left: 11px;
}

.list-item.active {
    font-weight: 600;
}

.item-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 4px;
}

.item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--gh-text-color-secondary);
}

/* Styles spécifiques aux Mouvements */
.movement-inflow {
    color: var(--gh-success-green);
    font-weight: 600;
}

.movement-outflow {
    color: var(--gh-danger-red);
    font-weight: 600;
}

.movement-info {
    color: var(--gh-info-blue);
    font-weight: 600;
}

/* Style de la vue détail */
.detail-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--gh-text-color);
}

.detail-subtitle {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 5px;
    margin-top: 1.5rem;
}

/* Responsivité */
@media (max-width: 1024px) {
    .main-container {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 10rem);
    }

    .left-panel {
        flex-basis: auto;
        min-width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--gh-sidebar-border);
        max-height: 40vh;
        padding: 15px;
    }

    .right-panel {
        min-height: 50vh;
        padding: 15px;
    }

    .mode-selector {
        max-width: 100%;
    }
}
</style>
