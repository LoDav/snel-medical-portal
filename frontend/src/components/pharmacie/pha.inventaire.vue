<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';
import { getAllMedicaments } from '@/utils/medicament';
import { getAllStocksMedicaments } from '@/utils/stockMedicament';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

const router = useRouter();
const userInfo = ref(null);

const selectedProductId = ref(null);
const searchInput = ref('');
const filterStatus = ref('all');
const currentSort = ref({ key: 'name', direction: 'asc' });

// Données d'inventaire chargées depuis l'API
const inventory = ref([]);
const loading = ref(false);
const error = ref(null);

// Fonction pour charger les données d'inventaire depuis l'API
const loadInventoryData = async () => {
    try {
        loading.value = true;
        error.value = null;

        // Charger tous les médicaments et stocks
        const [medicaments, stocks] = await Promise.all([
            getAllMedicaments(),
            getAllStocksMedicaments()
        ]);

        // Grouper les stocks par médicament
        const stocksByMedicament = {};
        stocks.forEach(stock => {
            if (!stocksByMedicament[stock.id_medicament]) {
                stocksByMedicament[stock.id_medicament] = [];
            }
            stocksByMedicament[stock.id_medicament].push(stock);
        });

        // Transformer les données pour correspondre au format attendu
        const inventoryData = medicaments.map((medicament, index) => {
            const productStocks = stocksByMedicament[medicament.id_medicament] || [];
            const totalStock = productStocks.reduce((sum, stock) => sum + stock.quantite_actuelle, 0);
            const criticalThreshold = productStocks.length > 0 ? productStocks[0].seuil_alerte || 10 : 10;

            // Transformer les lots
            const lots = productStocks.map(stock => ({
                lotId: stock.numero_lot,
                quantity: stock.quantite_actuelle,
                expiry: stock.date_peremption,
                status: getLotStatus(stock),
                statusLabel: getLotStatusLabel(stock)
            }));

            return {
                id: index + 1,
                name: medicament.nom_commercial,
                type: medicament.forme_pharmaceutique,
                stock: totalStock,
                unit: "unités", // À adapter selon les besoins
                critical: criticalThreshold,
                lots: lots
            };
        });

        inventory.value = inventoryData;
    } catch (err) {
        error.value = "Erreur lors du chargement des données d'inventaire";
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Fonction pour déterminer le statut d'un lot (retourne la classe CSS)
const getLotStatus = (stock) => {
    const now = new Date();
    const expiryDate = new Date(stock.date_peremption);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    if (expiryDate < now) return 'danger'; // Expiré
    if (expiryDate < threeMonthsFromNow) return 'pending'; // Alerte
    return 'completed'; // Normal
};

// Fonction pour déterminer le label du statut d'un lot
const getLotStatusLabel = (stock) => {
    const now = new Date();
    const expiryDate = new Date(stock.date_peremption);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    if (expiryDate < now) return 'Expiré';
    if (expiryDate < threeMonthsFromNow) return 'Alerte';
    return 'Normal';
};

// Utilitaires
const getProductStatus = (product) => {
    const stockPercent = (product.stock / product.critical) * 100;
    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(now.getMonth() + 3);

    let hasCriticalExpiry = false;
    let hasLowStock = stockPercent < 100;

    for (const lot of product.lots) {
        const expiryDate = new Date(lot.expiry);
        if (expiryDate < threeMonths) {
            hasCriticalExpiry = true;
        }
    }

    if (stockPercent <= 50) return { label: 'Critique', class: 'danger' };
    if (stockPercent < 100 || hasCriticalExpiry) return { label: 'Alerte', class: hasCriticalExpiry ? 'pending' : 'pending' };
    return { label: 'Normal', class: 'completed' };
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Propriétés calculées
const filteredProducts = computed(() => {
    let filtered = [...inventory.value];

    // Filtrage par recherche
    if (searchInput.value) {
        const query = searchInput.value.toLowerCase();
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.type.toLowerCase().includes(query) ||
            product.lots.some(lot => lot.lotId.toLowerCase().includes(query))
        );
    }

    // Filtrage par statut
    if (filterStatus.value !== 'all') {
        filtered = filtered.filter(product => {
            const status = getProductStatus(product);
            if (filterStatus.value === 'low' && status.label === 'Alerte') return true;
            if (filterStatus.value === 'critical' && status.label === 'Critique') return true;
            if (filterStatus.value === 'expiry' && status.class === 'expiry') return true;
            return false;
        });
    }

    // Tri
    if (currentSort.value.key) {
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (currentSort.value.key === 'status') {
                const statusOrder = { 'Critique': 3, 'Alerte': 2, 'Normal': 1 };
                aVal = statusOrder[getProductStatus(a).label];
                bVal = statusOrder[getProductStatus(b).label];
            } else if (currentSort.value.key === 'stock') {
                aVal = a.stock;
                bVal = b.stock;
            } else {
                aVal = (a[currentSort.value.key] || '').toString().toLowerCase();
                bVal = (b[currentSort.value.key] || '').toString().toLowerCase();
            }

            if (aVal < bVal) return currentSort.value.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSort.value.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filtered;
});

const selectedProduct = computed(() => {
    return inventory.value.find(p => p.id === selectedProductId.value);
});

// Méthodes
const goTo = (url) => {
    router.push(url);
};

const selectProduct = (productId) => {
    selectedProductId.value = productId;
};

const sortProducts = (key) => {
    if (currentSort.value.key === key) {
        currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.value.key = key;
        currentSort.value.direction = 'asc';
    }
};

const addNewProduct = () => {
    // Placeholder pour ajouter un produit
    alert('Fonctionnalité d\'ajout de produit à implémenter');
};

onMounted(async () => {
    userInfo.value = getUserInfo();
    await loadInventoryData();
});
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord" />
                <DashboardLink text="Médicaments" icon="medkit" to="/pharmacie/medicaments" />
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" />
                <DashboardLink text="Mouvements" icon="exchange" to="/pharmacie/mouvements" />
                <DashboardLink text="Dispensations" icon="pills" to="/pharmacie/dispensations" />
                <DashboardLink text="Inventaire" icon="clipboard-list" to="/pharmacie/inventaire" :active="true" />
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

    <div class="inventory-layout">
        <!-- Colonne Gauche: Liste des Produits -->
        <div class="product-list-container">
            <h1 class="card-header" style="border-bottom: none; margin-bottom: 0;">Liste des Produits & Lots</h1>

            <!-- Panneau de Contrôle -->
            <div class="card" style="padding: 15px; margin-top: 10px;">
                <div class="control-panel">
                    <div class="form-group input-group">
                        <input v-model="searchInput" type="text" class="form-control" placeholder="Rechercher produit, type ou lot...">

                        <select v-model="filterStatus" class="form-control">
                            <option value="all">Tous les Statuts</option>
                            <option value="low">Stock Faible</option>
                            <option value="critical">Stock Critique</option>
                            <option value="expiry">Péremption Proche</option>
                        </select>

                        <button class="btn btn-sm btn-primary" @click="addNewProduct">
                            <i class="fa fa-plus"></i> Ajouter Produit
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tableau d'Inventaire -->
            <div class="card" style="padding: 0;">
                <div v-if="loading" class="loading-state">
                    <p>Chargement des données d'inventaire...</p>
                </div>
                <div v-else-if="error" class="error-state">
                    <p style="color: var(--gh-danger-red);">{{ error }}</p>
                </div>
                <div v-else class="table-scroll">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th @click="sortProducts('name')">Nom du Produit <i class="fas fa-sort"></i></th>
                                <th @click="sortProducts('type')">Type</th>
                                <th @click="sortProducts('stock')">Stock Total</th>
                                <th @click="sortProducts('status')">Statut Global</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="product in filteredProducts" :key="product.id"
                                :class="{ selected: product.id === selectedProductId }"
                                @click="selectProduct(product.id)">
                                <td><i class="fas fa-box-open" style="margin-right: 8px; color: var(--text-color-secondary);"></i> {{ product.name }}</td>
                                <td>{{ product.type }}</td>
                                <td>{{ product.stock }} {{ product.unit }}</td>
                                <td><span :class="['status', getProductStatus(product).class]">{{ getProductStatus(product).label }}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="!loading && !error && filteredProducts.length === 0" class="empty-state">
                    Aucun produit trouvé correspondant aux critères.
                </div>
            </div>
        </div>

        <!-- Colonne Droite: Détails des Lots/Produit Sélectionné -->
        <div class="lot-details-container">
            <div class="card lot-details-card">
                <div class="card-header"><i class="fa fa-info-circle" style="margin-right: 5px; color: var(--primary-color);"></i> Détails du Produit</div>

                <div v-if="!selectedProduct" class="selected-product-info">
                    <p style="text-align: center; color: var(--text-color-secondary); padding: 50px 0;">Sélectionnez un produit dans la liste pour voir ses détails et lots.</p>
                </div>

                <div v-else>
                    <div class="lot-details">
                        <div class="lot-details-item" style="font-size: 16px;">
                            <span class="lot-details-label">Nom</span>
                            <span class="lot-details-value" style="color: var(--primary-color);">{{ selectedProduct.name }}</span>
                        </div>
                        <div class="lot-details-item">
                            <span class="lot-details-label">Type</span>
                            <span class="lot-details-value">{{ selectedProduct.type }}</span>
                        </div>
                        <div class="lot-details-item">
                            <span class="lot-details-label">Stock Total</span>
                            <span class="lot-details-value">{{ selectedProduct.stock }} {{ selectedProduct.unit }}</span>
                        </div>
                        <div class="lot-details-item">
                            <span class="lot-details-label">Seuil Critique</span>
                            <span class="lot-details-value">{{ selectedProduct.critical }} {{ selectedProduct.unit }}</span>
                        </div>
                        <div class="lot-details-item">
                            <span class="lot-details-label">Statut Global</span>
                            <span class="lot-details-value"><span :class="['status', getProductStatus(selectedProduct).class]">{{ getProductStatus(selectedProduct).label }}</span></span>
                        </div>
                    </div>

                    <div class="lot-list" style="margin-top: 20px;">
                        <div class="card-header" style="border-bottom: none; padding-bottom: 0;"><i class="fas fa-boxes" style="margin-right: 5px;"></i> Lots Disponibles</div>
                        <ul class="lots-ul">
                            <li v-for="lot in selectedProduct.lots" :key="lot.lotId" class="lot-details-item" style="flex-direction: column; align-items: flex-start; margin-top: 10px;">
                                <div style="width: 100%; display: flex; justify-content: space-between;">
                                    <span class="lot-details-label" style="font-size: 14px;">Lot N°: {{ lot.lotId }}</span>
                                    <span :class="['status', lot.status]">{{ lot.statusLabel }}</span>
                                </div>
                                <div style="width: 100%; display: flex; justify-content: space-between; margin-top: 5px;">
                                    <span class="lot-details-label">Quantité: {{ lot.quantity }}</span>
                                    <span class="lot-details-value">Péremption: {{ formatDate(lot.expiry) }}</span>
                                </div>
                            </li>
                        </ul>
                        <div class="lot-actions">
                            <button class="btn btn-primary btn-sm" style="flex-grow: 1;"><i class="fa fa-plus"></i> Ajouter Lot</button>
                            <button class="btn btn-secondary btn-sm" style="flex-grow: 1;"><i class="fa fa-edit"></i> Modifier Produit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Styles utilisant les classes CSS existantes de main.css, ajusting.css et utilitaire.css */

/* Layout principal */
.inventory-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    padding: 20px 30px;
    min-height: calc(100vh - 54px);
    width: 1300px;
    margin: 0 auto;
}

.lot-details-card {
    position: sticky;
    top: 20px;
    height: fit-content;
    max-height: calc(100vh - 74px);
    overflow-y: auto;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
}

.card{
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    /* padding: 20px; */
    display: flex;
    flex-direction: column;
    gap: 30px;
    padding: 20px;
    margin-bottom: 20px;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--gh-border-color);
}

/* Panneau de contrôle */
.control-panel {
    display: flex;
    gap: 10px;
    /* margin-bottom: 20px; */
}
.control-panel .input-group {
    flex-grow: 1;
    display: flex;
    gap: 10px;
}
.control-panel select {
    width: 150px;
}

/* Tableau */
.table-scroll {
    max-height: 600px;
    overflow: auto;
}
.inventory-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.inventory-table thead th {
    text-align: left;
    padding: 12px 15px;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    border-bottom: 2px solid var(--gh-border-color);
    cursor: pointer;
}

.inventory-table tbody tr {
    cursor: pointer;
    transition: background-color 0.2s;
}
.inventory-table tbody tr:hover {
    background-color: var(--gh-header-bg);
}
.inventory-table tbody tr.selected {
    background-color: rgba(0, 128, 128, 0.1);
    border-left: 3px solid var(--gh-primary-blue);
    font-weight: 500;
}

.inventory-table tbody td {
    padding: 10px 15px;
    border-bottom: 1px solid var(--gh-border-color);
    color: var(--gh-text-color);
    white-space: nowrap;
}
.inventory-table tbody tr:last-child td {
    border-bottom: none;
}

/* Badges (maintenant utilisant les classes status de main.css) */

/* Détails du lot */
.lot-details {
    padding-top: 5px;
}
.lot-details-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dotted var(--gh-border-color);
}
.lot-details-item:last-child {
    border-bottom: none;
}
.lot-details-label {
    font-weight: 500;
    color: var(--gh-text-color-secondary);
    font-size: 13px;
}
.lot-details-value {
    font-weight: 600;
    color: var(--gh-text-color);
    font-size: 14px;
    text-align: right;
}
.lot-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    border-top: 1px solid var(--gh-border-color);
    padding-top: 15px;
}

/* État vide */
.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--gh-text-color-secondary);
    font-style: italic;
}

/* États de chargement et d'erreur */
.loading-state {
    text-align: center;
    padding: 40px;
    color: var(--gh-text-color-secondary);
}

.error-state {
    text-align: center;
    padding: 40px;
    color: var(--gh-danger-red);
}

.lots-ul {
    list-style: none;
    padding: 0;
}

/* Responsive */
@media (max-width: 900px) {
    .inventory-layout {
        grid-template-columns: 1fr;
        padding: 15px;
    }
    .lot-details-card {
        position: relative;
        max-height: none;
        top: 0;
    }
    .control-panel {
        flex-direction: column;
    }
    .control-panel .input-group {
        flex-direction: column;
    }
    .control-panel select {
        width: 100%;
    }
}
</style>