<template>
    <div v-if="show" class="stock-report-modal" @click="closeModal">
        <div class="modal-content" @click.stop>

            <h3 class="detail-subtitle" style="margin-top: 0;">
                État Global du Stock
                <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            </h3>

            <!-- Tabs for Medicaments and Dispositifs -->
            <div class="view-tabs" style="margin-bottom: 20px;">
                <button :class="['tab-button', { active: currentReportTab === 'medicaments' }]" @click="currentReportTab = 'medicaments'">
                    <i class="fa fa-medkit"></i> Médicaments
                </button>
                <button :class="['tab-button', { active: currentReportTab === 'dispositifs' }]" @click="currentReportTab = 'dispositifs'">
                    <i class="fa fa-stethoscope"></i> Dispositifs Médicaux
                </button>
            </div>

            <div class="modal-actions" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div class="filter-sort-controls" style="display: flex; gap: 15px; align-items: center;">
                    <div class="filter-control">
                        <label for="filter-select" style="margin-right: 10px; font-weight: 600;">Filtrer par:</label>
                        <div class="dropdown" id="filterDropdown">
                            <button class="dropdown-toggle" id="filterDropdownToggle" aria-expanded="false" aria-controls="filterDropdownMenu">
                                {{ currentFilterOptions.find(opt => opt.value === filterBy)?.label || (currentReportTab === 'medicaments' ? 'Tous les médicaments' : 'Tous les dispositifs') }}
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <div class="dropdown-menu" id="filterDropdownMenu">
                                <a href="#" class="dropdown-item" v-for="option in currentFilterOptions" :key="option.value" @click.prevent="selectFilter(option.value)">
                                    <i class="fa fa-filter"></i> {{ option.label }}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="sort-controls">
                        <label for="sort-select" style="margin-right: 10px; font-weight: 600;">Trier par:</label>
                        <div class="dropdown" id="sortDropdown">
                            <button class="dropdown-toggle" id="sortDropdownToggle" aria-expanded="false" aria-controls="sortDropdownMenu">
                                {{ currentSortOptions.find(opt => opt.value === sortBy)?.label || (currentReportTab === 'medicaments' ? 'Nom du Médicament' : 'Nom du Dispositif') }}
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <div class="dropdown-menu" id="sortDropdownMenu">
                                <a href="#" class="dropdown-item" v-for="option in currentSortOptions" :key="option.value" @click.prevent="selectSort(option.value)">
                                    <i class="fa fa-sort"></i> {{ option.label }}
                                </a>
                            </div>
                        </div>
                        <button class="btn btn-outline-secondary btn-sm" @click="changeSort(sortBy)" style="padding: 4px 8px; margin-left: 10px;">
                            <i :class="sortOrder === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
                        </button>
                    </div>
                </div>
                <button class="btn btn-primary" @click="printReport">
                    <i class="fa fa-print"></i> Imprimer le Rapport
                </button>
            </div>

            <div class="table-container" style="flex: 1; overflow-y: auto; overflow-x: auto;">
                <table class="stock-report-table activities-table">
                    <thead style="position: sticky; top: 0; background-color: var(--gh-card-bg); z-index: 1;">
                        <tr>
                            <th>{{ currentReportTab === 'medicaments' ? 'Nom du Médicament' : 'Nom du Dispositif' }}</th>
                            <th v-if="currentReportTab === 'medicaments'">Forme</th>
                            <th v-if="currentReportTab === 'medicaments'">Dosage</th>
                            <th v-if="currentReportTab === 'dispositifs'">Catégorie</th>
                            <th>Unité de Vente</th>
                            <th>Unités en Stock</th>
                            <th>Nombre de Lots</th>
                            <th>Date d'Ajout</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in currentFilteredAndSortedData" :key="item.id_medicament || item.id_dispositif">
                            <td>{{ currentReportTab === 'medicaments' ? item.nom_commercial : item.nom_dispositif }}</td>
                            <td v-if="currentReportTab === 'medicaments'">{{ item.forme_pharmaceutique }}</td>
                            <td v-if="currentReportTab === 'medicaments'">{{ item.dosage }}</td>
                            <td v-if="currentReportTab === 'dispositifs'">{{ item.categorie }}</td>
                            <td>{{ item.unite_vente }}</td>
                            <td style="font-weight: 600;">{{ item.totalStock }} unités</td>
                            <td>{{ item.lotCount }} lot(s)</td>
                            <td>{{ formatDate(item.dateCreation) }}</td>
                            <td>
                                <span :class="['status', getStatusClass(item.status)]">
                                    {{ getStatusLabel(item.status) }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="currentFilteredAndSortedData.length === 0">
                            <td :colspan="currentReportTab === 'medicaments' ? 8 : 7" style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                Aucun {{ currentReportTab === 'medicaments' ? 'médicament' : 'dispositif' }} trouvé avec ce filtre.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="report-summary" style="margin-top: 20px; padding: 15px; background-color: var(--gh-header-bg); border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Résumé du Stock ({{ currentFilterOptions.find(opt => opt.value === filterBy)?.label || 'Tous' }})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>{{ currentReportTab === 'medicaments' ? 'Médicaments' : 'Dispositifs' }} affichés:</strong> {{ currentFilteredAndSortedData.length }}
                    </div>
                    <div>
                        <strong>Total Unités:</strong> {{ currentFilteredTotalUnits }}
                    </div>
                    <div>
                        <strong>Total Lots:</strong> {{ currentFilteredTotalLots }}
                    </div>
                    <div v-if="filterBy === 'all'">
                        <strong>{{ currentReportTab === 'medicaments' ? 'Médicaments' : 'Dispositifs' }} en Rupture:</strong> {{ currentOutOfStockCount }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    medicines: {
        type: Array,
        default: () => []
    },
    dispositifs: {
        type: Array,
        default: () => []
    },
    stocks: {
        type: Array,
        default: () => []
    }
});

const stockReportData = ref([]);
const dispositifsReportData = ref([]);
const currentReportTab = ref('medicaments');
const sortBy = ref('nom_commercial');
const sortOrder = ref('asc');
const filterBy = ref('all');

const closeModal = () => {
    emit('close');
};

const getTotalStock = (medId) => {
    return props.stocks
        .filter(stock => stock.id_produit === medId)
        .reduce((total, stock) => total + stock.quantite_actuelle, 0);
};

const getLotCount = (medId) => {
    return props.stocks.filter(stock => stock.id_produit === medId).length;
};

const getMedicineStatus = (medId) => {
    const totalStock = getTotalStock(medId);
    const medStocks = props.stocks.filter(stock => stock.id_produit === medId);
    const hasExpiredLot = medStocks.some(stock => new Date(stock.date_peremption) < new Date());

    if (totalStock === 0) return 'out_of_stock';
    if (hasExpiredLot) return 'expired';
    if (totalStock < 50) return 'low_stock';
    return 'normal';
};

const getDispositifStatus = (dispId) => {
    const totalStock = getTotalStock(dispId);
    const dispStocks = props.stocks.filter(stock => stock.id_produit === dispId);
    const hasExpiredLot = dispStocks.some(stock => new Date(stock.date_peremption) < new Date());

    if (totalStock === 0) return 'out_of_stock';
    if (hasExpiredLot) return 'expired';
    return 'normal';
};

const getStatusClass = (status) => {
    switch (status) {
        case 'out_of_stock': return 'danger';
        case 'expired': return 'danger';
        case 'low_stock': return 'pending';
        default: return 'completed';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'out_of_stock': return 'Rupture';
        case 'expired': return 'Expiré';
        case 'low_stock': return 'Stock Faible';
        default: return 'Normal';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
};

const sortOptionsMedicaments = [
    { value: 'nom_commercial', label: 'Nom du Médicament' },
    { value: 'totalStock', label: 'Unités en Stock' },
    { value: 'lotCount', label: 'Nombre de Lots' },
    { value: 'status', label: 'Statut' },
    { value: 'dateCreation', label: 'Date d\'Ajout' }
];

const sortOptionsDispositifs = [
    { value: 'nom_dispositif', label: 'Nom du Dispositif' },
    { value: 'totalStock', label: 'Unités en Stock' },
    { value: 'lotCount', label: 'Nombre de Lots' },
    { value: 'status', label: 'Statut' },
    { value: 'dateCreation', label: 'Date d\'Ajout' }
];

const filterOptionsMedicaments = [
    { value: 'all', label: 'Tous les médicaments' },
    { value: 'out_of_stock', label: 'En rupture de stock' },
    { value: 'low_stock', label: 'Stock faible' },
    { value: 'expired', label: 'Expirés' },
    { value: 'normal', label: 'Stock normal' }
];

const filterOptionsDispositifs = [
    { value: 'all', label: 'Tous les dispositifs' },
    { value: 'out_of_stock', label: 'En rupture de stock' },
    { value: 'expired', label: 'Expirés' },
    { value: 'normal', label: 'Stock normal' }
];

const prepareStockReportData = () => {
    console.log('Preparing stock report data...');
    console.log('Medicines:', props.medicines);
    console.log('Dispositifs:', props.dispositifs);
    console.log('Stocks:', props.stocks);

    // Prepare medicines data
    if (!props.medicines || props.medicines.length === 0) {
        console.log('No medicines data available');
        stockReportData.value = [];
    } else {
        stockReportData.value = props.medicines.map(med => ({
            ...med,
            totalStock: getTotalStock(med.id_medicament),
            lotCount: getLotCount(med.id_medicament),
            status: getMedicineStatus(med.id_medicament),
            dateCreation: med.created_at || med.date_creation
        }));
    }

    // Prepare dispositifs data
    if (!props.dispositifs || props.dispositifs.length === 0) {
        console.log('No dispositifs data available');
        dispositifsReportData.value = [];
    } else {
        dispositifsReportData.value = props.dispositifs.map(disp => ({
            ...disp,
            totalStock: getTotalStock(disp.id_dispositif),
            lotCount: getLotCount(disp.id_dispositif),
            status: getDispositifStatus(disp.id_dispositif),
            dateCreation: disp.created_at || disp.date_creation
        }));
    }

    console.log('Stock report data prepared:', stockReportData.value);
    console.log('Dispositifs report data prepared:', dispositifsReportData.value);
};

const changeSort = (newSortBy) => {
    if (sortBy.value === newSortBy) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy.value = newSortBy;
        sortOrder.value = 'asc';
    }
};

const selectFilter = (value) => {
    filterBy.value = value;
    // Close filter dropdown
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    if (filterDropdownMenu) {
        filterDropdownMenu.classList.remove('show');
        document.getElementById('filterDropdownToggle').setAttribute('aria-expanded', 'false');
    }
};

const selectSort = (value) => {
    changeSort(value);
    // Close sort dropdown
    const sortDropdownMenu = document.getElementById('sortDropdownMenu');
    if (sortDropdownMenu) {
        sortDropdownMenu.classList.remove('show');
        document.getElementById('sortDropdownToggle').setAttribute('aria-expanded', 'false');
    }
};

const printReport = () => {
    const printWindow = window.open('', '_blank');
    const reportContent = generatePrintContent();

    printWindow.document.write(reportContent);
    printWindow.document.close();
    // Add a delay to allow the image to load
    setTimeout(() => {
        printWindow.print();
    }, 500);
};

const generatePrintContent = () => {
    const filteredData = currentFilteredAndSortedData.value;
    const filterLabel = currentFilterOptions.value.find(opt => opt.value === filterBy.value)?.label || (currentReportTab.value === 'medicaments' ? 'Tous les médicaments' : 'Tous les dispositifs');
    const itemType = currentReportTab.value === 'medicaments' ? 'Médicament' : 'Dispositif';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>État du Stock - ${filterLabel} - ${new Date().toLocaleDateString('fr-FR')}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #0366d6; text-align: center; }
                h2 { color: #24292e; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f6f8fa; font-weight: bold; }
                .summary { margin-top: 30px; padding: 15px; background-color: #f6f8fa; border-radius: 6px; }
                .status-danger { color: #d73a49; }
                .status-warning { color: #f6a137; }
                .status-success { color: #28a745; }
                .filter-info { background-color: #fff3cd; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div style="text-align: left; margin-bottom: 20px;">
                <img src="${window.location.origin}/logo1.png" alt="Logo SNEL" style="max-width: 300px; height: auto;">
            </div>
            <h1 style="text-align: center; margin-top: 10px;">État du Stock - ${filterLabel}</h1>
            <p style="text-align: center;"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <div class="filter-info">
                <strong>Filtre appliqué:</strong> ${filterLabel}<br>
                <strong>Tri:</strong> ${currentSortOptions.value.find(opt => opt.value === sortBy.value)?.label || `Nom du ${itemType}`} (${sortOrder.value === 'asc' ? 'croissant' : 'décroissant'})
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nom du ${itemType}</th>
                        ${currentReportTab.value === 'medicaments' ? '<th>Forme</th><th>Dosage</th>' : '<th>Catégorie</th>'}
                        <th>Unité de Vente</th>
                        <th>Unités en Stock</th>
                        <th>Nombre de Lots</th>
                        <th>Date d'Ajout</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(item => `
                        <tr>
                            <td>${currentReportTab.value === 'medicaments' ? item.nom_commercial : item.nom_dispositif}</td>
                            ${currentReportTab.value === 'medicaments' ?
                                `<td>${item.forme_pharmaceutique}</td><td>${item.dosage}</td>` :
                                `<td>${item.categorie}</td>`
                            }
                            <td>${item.unite_vente}</td>
                            <td>${item.totalStock} unités</td>
                            <td>${item.lotCount} lot(s)</td>
                            <td>${formatDate(item.dateCreation)}</td>
                            <td class="status-${getStatusClass(item.status).replace('danger', 'danger').replace('pending', 'warning').replace('completed', 'success')}">${getStatusLabel(item.status)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <h3>Résumé du Stock (${filterLabel})</h3>
                <p><strong>${currentReportTab.value === 'medicaments' ? 'Médicaments' : 'Dispositifs'} affichés:</strong> ${filteredData.length}</p>
                <p><strong>Total Unités:</strong> ${filteredData.reduce((total, item) => total + item.totalStock, 0)}</p>
                <p><strong>Total Lots:</strong> ${filteredData.reduce((total, item) => total + item.lotCount, 0)}</p>
                ${filterBy.value === 'all' ? `<p><strong>${currentReportTab.value === 'medicaments' ? 'Médicaments' : 'Dispositifs'} en Rupture:</strong> ${currentOutOfStockCount.value}</p>` : ''}
            </div>
        </body>
        </html>
    `;
};

const currentSortOptions = computed(() => {
    return currentReportTab.value === 'medicaments' ? sortOptionsMedicaments : sortOptionsDispositifs;
});

const currentFilterOptions = computed(() => {
    return currentReportTab.value === 'medicaments' ? filterOptionsMedicaments : filterOptionsDispositifs;
});

const currentFilteredAndSortedData = computed(() => {
    const data = currentReportTab.value === 'medicaments' ? stockReportData.value : dispositifsReportData.value;
    let filtered = data;

    // Apply filter
    if (filterBy.value !== 'all') {
        filtered = filtered.filter(item => item.status === filterBy.value);
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
        let aValue = a[sortBy.value];
        let bValue = b[sortBy.value];

        // Handle special cases
        if (sortBy.value === 'dateCreation') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
        } else if (sortBy.value === 'status') {
            const statusOrder = { 'out_of_stock': 0, 'expired': 1, 'low_stock': 2, 'normal': 3 };
            aValue = statusOrder[aValue] || 4;
            bValue = statusOrder[bValue] || 4;
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
        return 0;
    });
});

const currentFilteredTotalUnits = computed(() => {
    return currentFilteredAndSortedData.value.reduce((total, item) => total + item.totalStock, 0);
});

const currentFilteredTotalLots = computed(() => {
    return currentFilteredAndSortedData.value.reduce((total, item) => total + item.lotCount, 0);
});

const currentOutOfStockCount = computed(() => {
    const data = currentReportTab.value === 'medicaments' ? stockReportData.value : dispositifsReportData.value;
    return data.filter(item => item.status === 'out_of_stock').length;
});

// Watch for changes in props to update data
watch([() => props.medicines, () => props.dispositifs, () => props.stocks], () => {
    if (props.show) {
        prepareStockReportData();
    }
}, { immediate: true });

watch(() => props.show, (newShow) => {
    if (newShow) {
        prepareStockReportData();
        nextTick(() => {
            initializeDropdowns();
        });
    }
});

onMounted(() => {
    if (props.show) {
        prepareStockReportData();
        nextTick(() => {
            initializeDropdowns();
        });
    }
});

const initializeDropdowns = () => {
    // Filter dropdown
    const filterDropdownToggle = document.getElementById('filterDropdownToggle');
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    const filterDropdown = document.getElementById('filterDropdown');

    if (filterDropdownToggle && filterDropdownMenu) {
        const toggleFilterDropdown = (show) => {
            const isShown = filterDropdownMenu.classList.contains('show');
            const forceShow = typeof show === 'boolean' ? show : !isShown;

            if (forceShow) {
                filterDropdownMenu.classList.add('show');
                filterDropdownToggle.setAttribute('aria-expanded', 'true');
            } else {
                filterDropdownMenu.classList.remove('show');
                filterDropdownToggle.setAttribute('aria-expanded', 'false');
            }
        };

        filterDropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFilterDropdown();
        });

        document.addEventListener('click', (event) => {
            if (!filterDropdown.contains(event.target)) {
                toggleFilterDropdown(false);
            }
        });
    }

    // Sort dropdown
    const sortDropdownToggle = document.getElementById('sortDropdownToggle');
    const sortDropdownMenu = document.getElementById('sortDropdownMenu');
    const sortDropdown = document.getElementById('sortDropdown');

    if (sortDropdownToggle && sortDropdownMenu) {
        const toggleSortDropdown = (show) => {
            const isShown = sortDropdownMenu.classList.contains('show');
            const forceShow = typeof show === 'boolean' ? show : !isShown;

            if (forceShow) {
                sortDropdownMenu.classList.add('show');
                sortDropdownToggle.setAttribute('aria-expanded', 'true');
            } else {
                sortDropdownMenu.classList.remove('show');
                sortDropdownToggle.setAttribute('aria-expanded', 'false');
            }
        };

        sortDropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleSortDropdown();
        });

        document.addEventListener('click', (event) => {
            if (!sortDropdown.contains(event.target)) {
                toggleSortDropdown(false);
            }
        });
    }
};
</script>

<style scoped>
.stock-report-modal {
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: var(--gh-card-bg);
    margin: auto;
    padding: 20px;
    border: 1px solid var(--gh-border-color);
    width: 95%;
    max-width: 1200px;
    max-height: 75vh;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.close {
    color: var(--gh-text-color-secondary);
    float: right;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover {
    color: var(--gh-primary-blue);
}

.detail-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 5px;
    margin-top: 1.5rem;
}

.table-container {
    overflow-y: auto;
    overflow-x: auto;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    flex: 1;
    min-height: 0;
}

.stock-report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.stock-report-table th,
.stock-report-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.stock-report-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
    position: sticky;
    top: 0;
}

.stock-report-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

.modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.sort-controls {
    display: flex;
    align-items: center;
}

.filter-control {
    display: flex;
    align-items: center;
}

.dropdown {
    position: relative;
    display: inline-block;
    min-width: 150px;
}

.dropdown-toggle {
    background-color: var(--gh-header-bg);
    color: var(--gh-text-color);
    border: 1px solid var(--gh-border-color);
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: space-between;
}

.dropdown-toggle:hover {
    background-color: #e6edf4;
    border-color: #c9d1d9;
}

.dropdown-toggle:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    margin-top: 8px;
    min-width: 200px;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 8px 24px var(--gh-shadow);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0.15s;
}

.dropdown-menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
    color: var(--gh-text-color);
    text-decoration: none;
}

.dropdown-item:hover {
    background-color: #f6f8fa;
    color: var(--gh-primary-blue);
}

.dropdown-item:active {
    background-color: #e6edf4;
}

.dropdown-item i {
    width: 16px;
    text-align: center;
    color: var(--gh-text-color-secondary);
}

.dropdown-item:hover i {
    color: var(--gh-primary-blue);
}

.filter-sort-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
}

@media (max-width: 768px) {
    .filter-sort-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .modal-actions {
        flex-direction: column;
        align-items: stretch;
    }
}

@media (max-width: 768px) {
    .modal-content {
        width: 98%;
        margin: 10px;
        padding: 15px;
    }

    .stock-report-table th,
    .stock-report-table td {
        padding: 8px;
        font-size: 12px;
    }
}
</style>