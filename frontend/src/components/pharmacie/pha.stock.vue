<script setup>
import { onMounted, ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';

import { getUserInfo } from '@/utils/auth';
import { getAllMedicaments } from '@/utils/medicament';
import { getAllDispositifsMedicaux } from '@/utils/dispositifsMedicaux';
import { getAllStocksMedicaments, getStockWithMedicamentById, getStockWithDispositifById, createStockMedicament, updateStockMedicament, deleteStockMedicament } from '@/utils/stockMedicament';
import { getMouvementsStockByMedicament } from '@/utils/mouvementStock';
import { getProfessionnelById } from '@/utils/professionnel';
import { getCatalogueGrouped } from '@/utils/medicamentCategories';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';
import AddMedicamentModal from './pha.components/AddMedicamentModal.vue';
import AddDispositifModal from './pha.components/AddDispositifModal.vue';
import StockReportModal from './pha.components/StockReportModal.vue';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register the zoom plugin
Chart.register(zoomPlugin);

const CHART_COLORS = {
    backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(255, 205, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(201, 203, 207, 0.5)'
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

// Counter for lot number generation
const lotCounter = ref(0);

const router = useRouter();
const userInfo = ref(null);
const allMedicaments = ref([]);
const allDispositifs = ref([]);
const allStocks = ref([]);
const stockOfMedicaments = ref([]);
const stockOfDispositifs = ref([]);

const currentMode = ref('stock');
const selectedMedicineId = ref(null);
const selectedDispositifId = ref(null);
const searchQuery = ref('');
const searchQueryDispositifs = ref('');
const LOW_STOCK_THRESHOLD = 50;
const LOW_STOCK_THRESHOLD_DISPOSITIFS = 10;
const showAddMedicamentModal = ref(false);
const showAddDispositifModal = ref(false);
const showStockReportModal = ref(false);
const editingMedicament = ref(null);
const editingDispositif = ref(null);
const viewMode = ref('brut');
const groupedMedicines = ref({});
const expandedCategories = ref({});

const medicines = ref([]);
const dispositifs = ref([]);
const medicineMovements = ref([]);
const dispositifMovements = ref([]);


// variable de tab-buttons globale
const currentTab = ref('Medicaments');

// Variables pour le graphique
let movementsChartInstance = null;

// Modal and form data
const showLotModal = ref(false);
const lotFormData = ref({
    id: null,
    medicamentId: null,
    numeroLot: '',
    quantite: 0,
    seuil_alerte: 0,
    datePeremption: '',
    notes: '',
    type_operation: 'correction'
});

// Options pour le type d'opération
const operationTypes = [
    // { value: 'ajout', label: 'Ajout de stock' },
    // { value: 'modification', label: 'Modification' },
    { value: 'correction', label: 'Correction' },
    { value: 'inventaire', label: 'Ajustement inventaire' }
];

/**
 * Génère un numéro de lot automatiquement basé sur le code produit et un UUID
 */
const generateLotNumber = (productCode) => {
    const uuidPart = crypto.randomUUID().substring(0, 12).toUpperCase();
    const productPrefix = productCode.substring(0, 5).toUpperCase();
    return `LOT-${productPrefix}-${uuidPart}`;
};

// Computed property for LOW_STOCK_THRESHOLD based on medicine's seuil_alerte
const getLowStockThreshold = (medId) => {
    const medStocks = allStocks.value.filter(stock => stock.id_medicament === medId);
    return medStocks.length > 0 ? medStocks[0].seuil_alerte : LOW_STOCK_THRESHOLD;
};

/**
 * Récupère la liste des médicaments et des stocks.
 * Elle appelle l'API pour récupérer la liste des médicaments et des stocks
 * et stocke les résultats dans les variables d'état `allMedicaments` et `allStocks`.
 * Si une erreur survient, elle est affichée dans la console.
 */
const getMedoc = async () => {
    try {
        allMedicaments.value = await getAllMedicaments();
        console.log(allMedicaments.value);

        // Set medicines to allMedicaments
        medicines.value = allMedicaments.value;
    } catch (error) {
        console.error('Error fetching medicines:', error);
    }

    try {
        allDispositifs.value = await getAllDispositifsMedicaux();
        console.log(allDispositifs.value);

        // Set dispositifs
        dispositifs.value = allDispositifs.value;
    } catch (error) {
        console.error('Error fetching dispositifs:', error);
    }

    try {
        allStocks.value = await getAllStocksMedicaments();
        console.log(allStocks.value);
    } catch (error) {
        console.error('Error fetching stocks:', error);
    }

    try {
        groupedMedicines.value = await getCatalogueGrouped();
        console.log('Grouped medicines:', groupedMedicines.value);
    } catch (error) {
        console.error('Error fetching grouped medicines:', error);
    }

};



// Computed properties
const getTotalStock = (id, type = 'medicament') => {
    return allStocks.value
        .filter(stock => stock.id_produit === id)
        .reduce((total, stock) => total + stock.quantite_actuelle, 0);
};

const getMedicineStatus = (medId) => {
    const medStocks = allStocks.value.filter(stock => stock.id_produit === medId);
    const totalStock = getTotalStock(medId);
    const threshold = getLowStockThreshold(medId);
    const isLowStock = totalStock > 0 && totalStock < threshold; // Ne considérer comme stock faible que si > 0 et < seuil
    const hasExpiredLot = medStocks.some(stock => new Date(stock.date_peremption) < new Date());

    if (totalStock === 0) {
        return {
            isAlert: true,
            statusText: `<span class="text-danger"><i class="fa fa-times"></i> Rupture de stock</span>`
        };
    }
    let statusText = `<span class="text-success">${totalStock} Unités au total</span>`;
    if (hasExpiredLot) {
        statusText = `<span class="text-danger"><i class="fa fa-times"></i> EXPIRATION</span>`;
    } else if (isLowStock) {
        statusText = `<span class="text-warning"><i class="fa fa-exclamation-triangle"></i> STOCK FAIBLE</span>`;
    }

    return {
        isAlert: isLowStock || hasExpiredLot,
        statusText: statusText
    };
};

const getDispositifStatus = (dispId) => {
    const dispStocks = allStocks.value.filter(stock => stock.id_produit === dispId);
    const totalStock = getTotalStock(dispId, 'dispositif');
    const hasExpiredLot = dispStocks.some(stock => new Date(stock.date_peremption) < new Date());
    const isLowStock = totalStock > 0 && totalStock < LOW_STOCK_THRESHOLD_DISPOSITIFS;

    if (totalStock === 0) {
        return {
            isAlert: true,
            statusText: `<span class="text-danger"><i class="fa fa-times"></i> Rupture de stock</span>`
        };
    }
    let statusText = `<span class="text-success">${totalStock} Unités au total</span>`;
    if (hasExpiredLot) {
        statusText = `<span class="text-danger"><i class="fa fa-times"></i> EXPIRATION</span>`;
    } else if (isLowStock) {
        statusText = `<span class="text-warning"><i class="fa fa-exclamation-triangle"></i> STOCK FAIBLE</span>`;
    }

    return {
        isAlert: hasExpiredLot || isLowStock,
        statusText: statusText
    };
};

const filteredMedicines = computed(() => {
    if (!medicines.value || medicines.value.length === 0) return [];
    const query = searchQuery.value ? searchQuery.value.toLowerCase() : '';
    return medicines.value.filter(med => {
        if (!med || !med.nom_commercial || !med.nom_generique) return false;
        return med.nom_commercial.toLowerCase().includes(query) ||
            med.nom_generique.toLowerCase().includes(query);
    }).sort((a, b) => {
        // First sort by stock availability (medicines with units first)
        const aTotalStock = getTotalStock(a.id_medicament);
        const bTotalStock = getTotalStock(b.id_medicament);
        const aHasStock = aTotalStock > 0;
        const bHasStock = bTotalStock > 0;

        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;

        // Then sort by alert status (alerts first)
        const aStatus = getMedicineStatus(a.id_medicament);
        const bStatus = getMedicineStatus(b.id_medicament);
        if (aStatus.isAlert && !bStatus.isAlert) return -1;
        if (!aStatus.isAlert && bStatus.isAlert) return 1;

        // Finally sort alphabetically by commercial name
        return a.nom_commercial.localeCompare(b.nom_commercial);
    });
});

const groupedMedicinesFiltered = computed(() => {
    if (viewMode.value !== 'grouped' || !groupedMedicines.value || !groupedMedicines.value.catalogue_json) return {};

    const query = searchQuery.value ? searchQuery.value.toLowerCase() : '';
    const filtered = {};

    Object.keys(groupedMedicines.value.catalogue_json).forEach(category => {
        const meds = groupedMedicines.value.catalogue_json[category];

        const filteredMeds = meds.filter(med => {
            if (!med || !med.nom_commercial) return false;
            return med.nom_commercial.toLowerCase().includes(query);
        });

        if (filteredMeds.length > 0) {
            filtered[category] = filteredMeds;
        }
    });

    return filtered;
});
const selectedMedicine = computed(() => {
    return medicines.value.find(m => m.id_medicament === selectedMedicineId.value);
});

const selectedDispositif = computed(() => {
    return dispositifs.value.find(d => d.id_dispositif === selectedDispositifId.value);
});

const filteredDispositifs = computed(() => {
    if (!dispositifs.value || dispositifs.value.length === 0) return [];
    const query = searchQueryDispositifs.value ? searchQueryDispositifs.value.toLowerCase() : '';
    return dispositifs.value.filter(disp => {
        if (!disp || !disp.nom_dispositif) return false;
        return disp.nom_dispositif.toLowerCase().includes(query);
    });
});

const selectedMedicineLots = computed(() => {
    if (!selectedMedicineId.value) return [];
    return allStocks.value
        .filter(stock => stock.id_produit === selectedMedicineId.value)
        .sort((a, b) => new Date(a.date_peremption) - new Date(b.date_peremption));
});

const selectedDispositifLots = computed(() => {
    if (!selectedDispositifId.value) return [];
    return allStocks.value
        .filter(stock => stock.id_produit === selectedDispositifId.value)
        .sort((a, b) => new Date(a.date_peremption) - new Date(b.date_peremption));
});

const totalStockColor = computed(() => {
    if (!selectedMedicine.value) return 'var(--gh-success-green)';
    const threshold = getLowStockThreshold(selectedMedicine.value.id_medicament);
    return getTotalStock(selectedMedicine.value.id_medicament) < threshold ? 'var(--gh-danger-red)' : 'var(--gh-success-green)';
});

// Fonctions pour les mouvements
const getMovementTypeClass = (type) => {
    switch (type) {
        case 'RÉCEPTION':
        case 'entree':
            return 'completed';
        case 'PERTE':
        case 'sortie':
        case 'DISPENSATION':
            return 'danger';
        case 'CORRECTION_ENTRÉE':
        case 'CORRECTION_SORTIE':
        case 'ajustement':
        case 'AJUSTEMENT':
            return 'pending';
        default:
            return 'completed';
    }
};

const getMovementTypeLabel = (type) => {
    switch (type) {
        case 'entree': return 'Entrée';
        case 'sortie':
        case 'DISPENSATION':
            return 'Sortie';
        case 'ajustement':
        case 'AJUSTEMENT':
            return 'Ajustement';
        case 'RÉCEPTION': return 'Réception';
        case 'PERTE': return 'Perte';
        case 'CORRECTION_ENTRÉE':
        case 'CORRECTION_SORTIE':
            return 'Correction';
        default: return type;
    }
};

// Fonction pour dessiner le graphique des mouvements
const drawMovementsChart = () => {
    if (medicineMovements.value.length === 0) {
        console.log('No movements data to display');
        return;
    }

    const ctx = document.getElementById('movementsChart');
    if (!ctx) {
        console.log('Canvas element not found');
        return;
    }

    console.log('Drawing chart with movements:', medicineMovements.value);

    // Détruire l'instance précédente si elle existe
    if (movementsChartInstance) {
        movementsChartInstance.destroy();
    }

    // Trier les mouvements par date
    const sortedMovements = [...medicineMovements.value].sort((a, b) =>
        new Date(a.date_mouvement) - new Date(b.date_mouvement)
    );

    // Prendre les 20 derniers mouvements
    const recentMovements = sortedMovements.slice(-20);

    console.log('Recent movements:', recentMovements);

    const labels = recentMovements.map(m => {
        const date = new Date(m.date_mouvement);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    });
    const data = recentMovements.map(m => m.quantite);

    console.log('Chart labels:', labels);
    console.log('Chart data:', data);

    // Couleurs basées sur le signe des valeurs
    const backgroundColors = data.map(value => value >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)');
    const borderColors = data.map(value => value >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)');

    movementsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Quantité',
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false,
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Évolution des mouvements de stock'
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantité'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    console.log('Chart created successfully');
};

// Methods
const selectMedicine = async (id) => {
    selectedMedicineId.value = id;
    // Fetch latest stock data for the selected medicine
    try {
        const stockData = await getStockWithMedicamentById(id);
        console.log('Fetched stock data for medicine:', stockData);
        stockOfMedicaments.value = stockData;

        // Fetch movements for the selected medicine
        const movementsData = await getMouvementsStockByMedicament(id);
        console.log('Fetched movements data for medicine:', movementsData);

        // Enrich movements with professional names
        const enrichedMovements = await Promise.all(movementsData.map(async (movement) => {
            if (movement.id_professionnel) {
                try {
                    const professionnel = await getProfessionnelById(movement.id_professionnel);
                    return {
                        ...movement,
                        nom_professionnel: `${professionnel.nom} ${professionnel.prenoms}`
                    };
                } catch (error) {
                    console.error(`Error fetching professional with id ${movement.id_professionnel}:`, error);
                    return { ...movement, nom_professionnel: 'Inconnu' };
                }
            }
            return { ...movement, nom_professionnel: 'Système' };
        }));

        medicineMovements.value = enrichedMovements;

        await nextTick();
        drawMovementsChart();

    } catch (error) {
        console.error('Error fetching data for selected medicine:', error);
        medicineMovements.value = [];
    }
};

const selectDispositif = async (id) => {
    selectedDispositifId.value = id;
    // Fetch latest stock data for the selected dispositif
    try {
        const stockData = await getStockWithDispositifById(id);
        console.log('Fetched stock data for dispositif:', stockData);
        stockOfDispositifs.value = stockData;

        // Fetch movements for the selected dispositif
        const movementsData = await getMouvementsStockByMedicament(id);
        console.log('Fetched movements data for dispositif:', movementsData);

        // Enrich movements with professional names
        const enrichedMovements = await Promise.all(movementsData.map(async (movement) => {
            if (movement.id_professionnel) {
                try {
                    const professionnel = await getProfessionnelById(movement.id_professionnel);
                    return {
                        ...movement,
                        nom_professionnel: `${professionnel.nom} ${professionnel.prenoms}`
                    };
                } catch (error) {
                    console.error(`Error fetching professional with id ${movement.id_professionnel}:`, error);
                    return { ...movement, nom_professionnel: 'Inconnu' };
                }
            }
            return { ...movement, nom_professionnel: 'Système' };
        }));

        dispositifMovements.value = enrichedMovements;

    } catch (error) {
        console.error('Error fetching data for selected dispositif:', error);
        dispositifMovements.value = [];
    }
};

const switchMode = (mode) => {
    currentMode.value = mode;
    selectedMedicineId.value = null;
    if (mode === 'stock') {
        // Render stock list
    } else {
        // Dispensation mode - not implemented yet
    }
};

const openModal = (id, lotId = null, type = 'medicament') => {
    lotFormData.value.medicamentId = id;
    lotFormData.value.id = lotId || null;
    lotFormData.value.type = type; // 'medicament' or 'dispositif'

    const lot = lotId ? allStocks.value.find(stock => stock.id_stock === lotId) : null;

    if (lot) {
        lotFormData.value.numeroLot = lot.numero_lot;
        lotFormData.value.quantite = lot.quantite_actuelle;
        lotFormData.value.seuil_alerte = lot.seuil_alerte;
        lotFormData.value.datePeremption = lot.date_peremption.split('T')[0]; // Format YYYY-MM-DD for date input
        lotFormData.value.notes = lot.notes_operation || '';
        lotFormData.value.type_operation = 'modification'; // Par défaut pour modification
    } else {
        // Générer automatiquement le numéro de lot pour un nouveau lot
        let productName = 'UNKNOWN';
        if (type === 'medicament') {
            const selectedMed = medicines.value.find(m => m.id_medicament === id);
            if (selectedMed) productName = selectedMed.nom_commercial;
        } else if (type === 'dispositif') {
            const selectedDisp = dispositifs.value.find(d => d.id_dispositif === id);
            if (selectedDisp) productName = selectedDisp.nom_dispositif;
        }
        lotFormData.value.numeroLot = generateLotNumber(productName);
        lotFormData.value.quantite = 0;
        lotFormData.value.seuil_alerte = 0;
        lotFormData.value.datePeremption = '';
    }
    showLotModal.value = true;
};

const closeModal = () => {
    showLotModal.value = false;
};

const handleLotSubmit = async (e) => {
    e.preventDefault();

    const { id, medicamentId, numeroLot, quantite, datePeremption, seuil_alerte, type } = lotFormData.value;

    try {
        // Validation: Vérifier que l'ID existe dans la bonne table selon le type
        if (type === 'medicament') {
            const exists = allMedicaments.value.some(med => med.id_medicament === medicamentId);
            if (!exists) {
                alert('Erreur: Le médicament sélectionné n\'existe pas.');
                return;
            }
        } else if (type === 'dispositif') {
            const exists = allDispositifs.value.some(disp => disp.id_dispositif === medicamentId);
            if (!exists) {
                alert('Erreur: Le dispositif médical sélectionné n\'existe pas.');
                return;
            }
        }

        if (id) {
            // Update stock
            await updateStockMedicament(id, {
                id_produit: medicamentId,
                type_produit: type === 'medicament' ? 'Medicament' : 'Dispositif',
                id_centre: userInfo.value.id_centre,
                quantite_actuelle: quantite,
                date_peremption: datePeremption,
                numero_lot: numeroLot,
                seuil_alerte: seuil_alerte,
                notes_operation: lotFormData.value.notes,
                id_professionnel: userInfo.value.id_professionnel,
                type_operation: lotFormData.value.type_operation
            });
            // Update local state
            const index = allStocks.value.findIndex(stock => stock.id_stock === id);
            if (index !== -1) {
                allStocks.value[index] = { ...allStocks.value[index], numero_lot: numeroLot, quantite_actuelle: quantite, date_peremption: datePeremption, seuil_alerte: seuil_alerte };
            }
        } else {
            // Add new stock
            try {
                const newStock = await createStockMedicament({
                    id_medicament: type === 'medicament' ? medicamentId : null,
                    id_dispositif: type === 'dispositif' ? medicamentId : null,
                    type_produit: type === 'medicament' ? 'Medicament' : 'Dispositif',
                    numero_lot: numeroLot,
                    quantite_actuelle: quantite,
                    date_peremption: datePeremption,
                    id_professionnel: userInfo.value.id_professionnel,
                    id_centre: userInfo.value.id_centre,
                    notes_operation: lotFormData.value.notes,
                    type_operation: 'ajout'

                });
                allStocks.value.push(newStock);
                getMedoc(); // Refresh the medicines and stocks
            } catch (error) {
                console.error('Error creating new stock:', error);
                alert('Erreur lors de la création du nouveau lot. Veuillez réessayer.');
                return;
            }
        }

        // Refresh movements and chart for the selected product
        if (selectedMedicineId.value && type === 'medicament') {
            const movementsData = await getMouvementsStockByMedicament(selectedMedicineId.value);
            const enrichedMovements = await Promise.all(movementsData.map(async (movement) => {
                if (movement.id_professionnel) {
                    try {
                        const professionnel = await getProfessionnelById(movement.id_professionnel);
                        return {
                            ...movement,
                            nom_professionnel: `${professionnel.nom} ${professionnel.prenoms}`
                        };
                    } catch (error) {
                        console.error(`Error fetching professional with id ${movement.id_professionnel}:`, error);
                        return { ...movement, nom_professionnel: 'Inconnu' };
                    }
                }
                return { ...movement, nom_professionnel: 'Système' };
            }));
            medicineMovements.value = enrichedMovements;
            await nextTick();
            drawMovementsChart();
        } else if (selectedDispositifId.value && type === 'dispositif') {
            const movementsData = await getMouvementsStockByMedicament(selectedDispositifId.value);
            const enrichedMovements = await Promise.all(movementsData.map(async (movement) => {
                if (movement.id_professionnel) {
                    try {
                        const professionnel = await getProfessionnelById(movement.id_professionnel);
                        return {
                            ...movement,
                            nom_professionnel: `${professionnel.nom} ${professionnel.prenoms}`
                        };
                    } catch (error) {
                        console.error(`Error fetching professional with id ${movement.id_professionnel}:`, error);
                        return { ...movement, nom_professionnel: 'Inconnu' };
                    }
                }
                return { ...movement, nom_professionnel: 'Système' };
            }));
            dispositifMovements.value = enrichedMovements;
        }

        closeModal();
    } catch (error) {
        console.error('Error saving stock:', error);
    }
};

/**
 * Opens the Add Medicament Modal
 */
const addNewProduct = () => {
    /**
     * Show the Add Medicament Modal
     */
    editingMedicament.value = null;
    showAddMedicamentModal.value = true;
    console.log('Opening Add Medicament Modal');
};

/**
 * Opens the Edit Medicament Modal
 */
const editMedicine = (medicamentId) => {
    const medicament = medicines.value.find(m => m.id_medicament === medicamentId);
    if (medicament) {
        editingMedicament.value = medicament;
        showAddMedicamentModal.value = true;
        console.log('Opening Edit Medicament Modal for:', medicament.nom_commercial);
    }
};

/**
 * Opens the Edit Dispositif Modal
 */
const editDispositif = (dispositifId) => {
    const dispositif = dispositifs.value.find(d => d.id_dispositif === dispositifId);
    if (dispositif) {
        editingDispositif.value = dispositif;
        showAddDispositifModal.value = true;
        console.log('Opening Edit Dispositif Modal for:', dispositif.nom_dispositif);
    }
};

const handleMedicamentAdded = (medicament) => {
    console.log('Medicament added/updated:', medicament);
    if (editingMedicament.value) {
        // Update existing medicament
        const index = medicines.value.findIndex(m => m.id_medicament === editingMedicament.value.id_medicament);
        if (index !== -1) {
            medicines.value[index] = medicament;
        }
        const allIndex = allMedicaments.value.findIndex(m => m.id_medicament === editingMedicament.value.id_medicament);
        if (allIndex !== -1) {
            allMedicaments.value[allIndex] = medicament;
        }
    } else {
        // Add new medicament
        if (medicament && medicament.nom_commercial) {
            medicines.value.push(medicament);
            allMedicaments.value.push(medicament);
        }
    }
    getMedoc(); // Rafraîchir la liste des médicaments
    // Fermer la modal
    showAddMedicamentModal.value = false;
    editingMedicament.value = null;
};

/**
 * Opens the Add Dispositif Modal
 */
const addNewDispositif = () => {
    editingDispositif.value = null;
    showAddDispositifModal.value = true;
    console.log('Opening Add Dispositif Modal');
};

/**
 * Handles when a dispositif is added or updated
 */
const handleDispositifAdded = (dispositif) => {
    console.log('Dispositif added/updated:', dispositif);
    if (editingDispositif.value) {
        // Update existing dispositif
        const index = dispositifs.value.findIndex(d => d.id_dispositif === editingDispositif.value.id_dispositif);
        if (index !== -1) {
            dispositifs.value[index] = dispositif;
        }
        const allIndex = allDispositifs.value.findIndex(d => d.id_dispositif === editingDispositif.value.id_dispositif);
        if (allIndex !== -1) {
            allDispositifs.value[allIndex] = dispositif;
        }
    } else {
        // Add new dispositif
        if (dispositif && dispositif.nom_dispositif) {
            dispositifs.value.push(dispositif);
            allDispositifs.value.push(dispositif);
        }
    }
    getMedoc(); // Rafraîchir la liste des dispositifs
    // Fermer la modal
    showAddDispositifModal.value = false;
    editingDispositif.value = null;
};

/**
 * Opens the Stock Report Modal
 *
 * @function printStockReport
 */
const printStockReport = () => {
    showStockReportModal.value = true;
    console.log('Opening Stock Report Modal');
    console.log(medicines.value);
    console.log(allStocks.value);


};

const deleteLot = async (lotId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible.")) {
        try {
            await deleteStockMedicament(lotId);
            allStocks.value = allStocks.value.filter(stock => stock.id_stock !== lotId);
        } catch (error) {
            console.error('Error deleting stock:', error);
        }
    }
};

const toggleCategory = (category) => {
    expandedCategories.value[category] = !expandedCategories.value[category];
};

onMounted(async () => {
    userInfo.value = getUserInfo();
    await getMedoc();
    // Sélectionner automatiquement le premier élément de la sidebar si disponible
    if (medicines.value && medicines.value.length > 0) {
        selectMedicine(medicines.value[0].id_medicament);
    }
    if (dispositifs.value && dispositifs.value.length > 0) {
        selectDispositif(dispositifs.value[0].id_dispositif);
    }
});
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord" />
                <!-- <DashboardLink text="Médicaments" icon="medkit" to="/pharmacie/medicaments" /> -->
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" :active="true" />
                <!-- <DashboardLink text="Mouvements" icon="exchange" to="/pharmacie/mouvements" /> -->
                <DashboardLink text="Prescriptions" icon="plus-square" to="/pharmacie/dispensations" />
                <!-- <DashboardLink text="Inventaire" icon="list" to="/pharmacie/inventaire" /> -->
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
                <h1>Gestion de la Pharmacie</h1>
                <button class="btn" @click="printStockReport">Etat global de stock</button>
            </div>

            <div class="tab-buttons">
                <button class="tab-button" 
                    @click="currentTab = 'Medicaments'" 
                    :class="{ active: currentTab === 'Medicaments' }">Medicaments</button>
                <button class="tab-button" 
                    @click="currentTab = 'Dispositfs medicaux'"
                    :class="{ active: currentTab === 'Dispositfs medicaux' }">Dispositfs medicaux</button>
            </div>

            <div class="main-content animate__animated animate__fadeIn" v-if="currentTab === 'Medicaments'">

                <!-- Left Panel: Medicine List -->
                <div class="sidebar" style="width: 400px;">
                    <div style="margin-bottom: 20px; display: flex; gap: 10px;" class="search-box">
                        <input v-model="searchQuery" type="search"
                            placeholder="Rechercher un produit ou une molecule..." class="form-control">
                        <button class="btn btn-primary" @click="addNewProduct">Ajouter un produit</button>
                    </div>
                    <h2>Liste des médicaments</h2>
                    <!-- Tabs for view modes -->
                    <div class="view-tabs" style="margin-bottom: 20px;">
                        <button :class="['tab-button', { active: viewMode === 'brut' }]" @click="viewMode = 'brut'">
                            Affichage Brut
                        </button>
                        <button :class="['tab-button', { active: viewMode === 'grouped' }]"
                            @click="viewMode = 'grouped'">
                            Par Forme Galénique
                        </button>
                    </div>

                    <div id="list-container" style="max-height: calc(100vh - 400px); overflow-y: auto;">
                        <!-- Brut view -->
                        <div v-if="viewMode === 'brut'">
                            <div v-for="med in filteredMedicines" :key="med.id_medicament"
                                :class="['list-item', { 'stock-item-alert': getMedicineStatus(med.id_medicament).isAlert, 'active': selectedMedicineId === med.id_medicament }]"
                                @click="selectMedicine(med.id_medicament)">
                                <div>
                                    <h3 class="item-title">{{ med.nom_commercial }} {{ med.forme_pharmaceutique }} - ({{
                                        med.dosage }})</h3>
                                    <small class="text-muted">Ref: {{ med.nom_generique }}</small>
                                </div>

                                <div class="item-meta">
                                    <span v-html="getMedicineStatus(med.id_medicament).statusText"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Grouped view -->
                        <div v-else-if="viewMode === 'grouped'">
                            <div v-for="(medicines, category) in groupedMedicinesFiltered" :key="category">
                                <h4 class="category-title"
                                    style="padding: 10px; background-color: var(--gh-header-bg); border-bottom: 1px solid var(--gh-border-color); margin-bottom: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                                    @click="toggleCategory(category)">
                                    {{ category }} ({{ medicines.length }})
                                    <i
                                        :class="['fa', expandedCategories[category] ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                </h4>
                                <div v-if="expandedCategories[category]" class="category-content">
                                    <div v-for="med in medicines" :key="med.id_medicament"
                                        :class="['list-item grouped-item', { 'stock-item-alert': getMedicineStatus(med.id_medicament).isAlert, 'active': selectedMedicineId === med.id_medicament }]"
                                        @click="selectMedicine(med.id_medicament)">
                                        <div>
                                            <h3 class="item-title">{{ med.nom_commercial }} {{ med.forme_pharmaceutique
                                                }} - ({{
                                                    med.dosage }})</h3>
                                            <small class="text-muted">Ref: {{ med.nom_generique }}</small>
                                        </div>

                                        <div class="item-meta">
                                            <span v-html="getMedicineStatus(med.id_medicament).statusText"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Lot Details -->
                <div class="detail-panel">

                    <!-- <pre>{{ allMedicaments }}</pre> -->
                    <!-- <pre>{{ stockOfMedicaments }}</pre> -->
                    <!-- <pre>{{ userInfo }}</pre> -->
                    <!-- <pre>{{ selectedMedicine }}</pre> -->
                    <!-- <pre>{{ selectedMedicineLots }}</pre> -->

                    <div v-if="!selectedMedicine" style="text-align: center; margin-top: 50px;">
                        <!-- <h2 style="border-bottom: 1px solid var(--gh-border-color); text-align: center; color: var(--gh-text-color-secondary); font-weight: 600;">
                            Bienvenue !
                        </h2> -->
                        <p style="color: var(--gh-text-color-secondary);">Sélectionnez un produit dans la liste pour
                            gérer ses différents lots de stock.</p>
                    </div>

                    <div v-else>
                        <h2 class="detail-title">
                            Gestion des Lots pour : {{ selectedMedicine.nom_commercial }}
                            <button class="btn btn-outline btn-sm"
                                @click="editMedicine(selectedMedicine.id_medicament)">Modifier</button>
                        </h2>
                        <div
                            style="margin-bottom: 1.5rem; padding: 10px; border: 1px solid var(--gh-border-color); border-radius: 6px; background-color: var(--gh-header-bg);">
                            <p style="font-weight: 700; font-size: 1.125rem;">Stock Total Actuel : <span
                                    :style="{ color: totalStockColor }">{{ getTotalStock(selectedMedicine.id_medicament)
                                    }} Unités</span></p>
                            <p style="font-size: 0.875rem; color: var(--gh-text-color-secondary);">Prix Unitaire de
                                Référence: {{ selectedMedicine.prix_unitaire_indicatif }} CDF</p>
                            <p style="font-size: 0.875rem; color: var(--gh-text-color-secondary);">unites de vente:
                                <span class="status completed">{{ selectedMedicine.unite_vente }}</span>
                            </p>
                        </div>

                        <h3 class="detail-subtitle"><i class="fa fa-home" style="margin-right: 4px;"></i> Lots en Stock
                            ({{ selectedMedicineLots.length }})</h3>

                        <table v-if="selectedMedicineLots.length > 0" class="lots-table activities-table">
                            <thead>
                                <tr>
                                    <th>Lot #</th>
                                    <th>Quantité</th>
                                    <th>Seuil d'alerte</th>
                                    <th>Péremption</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="stock in selectedMedicineLots" :key="stock.id_stock">
                                    <td>{{ stock.numero_lot }}</td>
                                    <td style="font-weight: 600;"
                                        :class="{ 'text-danger': stock.quantite_actuelle <= stock.seuil_alerte }"
                                        >{{ stock.quantite_actuelle }} 
                                        <small v-if="stock.quantite_actuelle <= stock.seuil_alerte">Lot faible</small>
                                    </td>
                                    <td>{{ stock.seuil_alerte }}</td>
                                    <td :class="{ 'lot-expired': new Date(stock.date_peremption) < new Date() }">
                                        <span v-if="new Date(stock.date_peremption) < new Date()">
                                            <i class="fa fa-exclamation-circle"></i> {{ new
                                                Date(stock.date_peremption).toLocaleDateString() }}
                                            (EXPIRÉ)
                                        </span>
                                        <span v-else>{{ new Date(stock.date_peremption).toLocaleDateString() }}</span>
                                    </td>
                                    <td>
                                        <button class="btn mr-2"
                                            @click="openModal(selectedMedicine.id_medicament, stock.id_stock, 'medicament')"><i
                                                class="fa fa-edit"></i></button>
                                        <!-- <button class="btn" @click="deleteLot(stock.id_stock)"
                                            style="color: var(--gh-danger-red);"><i class="fa fa-trash-o"></i></button> -->
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <p v-else style="margin-top: 10px;">Aucun lot trouvé. Ajoutez-en un nouveau ci-dessous.</p>

                        <button class="btn btn-primary btn-block p-2" style="margin-top: 1rem;"
                            @click="openModal(selectedMedicine.id_medicament, null, 'medicament')">
                            <i class="fa fa-plus-circle"></i> Ajouter un Nouveau Lot
                        </button>

                        <div>
                            <div>
                                <h3 class="detail-subtitle">Mouvements Stock</h3>

                                <!-- Graphique Chart.js -->
                                <div v-if="medicineMovements.length > 0" class="chart-container"
                                    style="margin-bottom: 20px; height: 300px;">
                                    <canvas id="movementsChart"></canvas>
                                </div>

                                <!-- <pre>{{ medicineMovements }}</pre> -->
                                <!-- Tableau des mouvements -->
                                <div v-if="medicineMovements.length > 0" class="movements-table-container">
                                    <table class="movements-table activities-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Quantité</th>
                                                <th>Numéro Lot</th>
                                                <th>Utilisateur</th>
                                                <!-- <th v-if="movement.some(m => m.notes !== '')" >Notes</th> -->
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="movement in medicineMovements.slice(0, 10)"
                                                :key="movement.id_mouvement">
                                                <td>{{ new Date(movement.date_mouvement).toLocaleDateString()  }} {{  new Date(movement.date_mouvement).toLocaleTimeString() }}</td>
                                                <td>
                                                    <span
                                                        :class="['status', getMovementTypeClass(movement.type_mouvement)]">
                                                        {{ getMovementTypeLabel(movement.type_mouvement) }}
                                                    </span>
                                                </td>
                                                <td
                                                    :class="{ 'text-success': movement.quantite > 0, 'text-danger': movement.quantite < 0 }">
                                                    {{ movement.quantite > 0 ? '+' : '' }}{{ movement.quantite }}
                                                </td>
                                                <td>{{ movement.numero_lot || '-' }}</td>
                                                <td>{{ movement.nom_professionnel || 'Système' }}</td>
                                                <!-- <td>{{ movement.notes || '-' }}</td> -->
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <p v-else style="margin-top: 10px; color: var(--gh-text-color-secondary);">
                                    Aucun mouvement enregistré pour ce produit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="main-content animate__animated animate__fadeIn" v-if ="currentTab === 'Dispositfs medicaux'">

                <!-- Left Panel: Dispositifs List -->
                <div class="sidebar" style="width: 400px;">
                    <div style="margin-bottom: 20px; display: flex; gap: 10px;" class="search-box">
                        <input v-model="searchQueryDispositifs" type="search"
                            placeholder="Rechercher un dispositif..." class="form-control">
                        <button class="btn btn-outline-primary btn-rounded" @click="addNewDispositif">Créer un dispositif</button>
                    </div>
                    <h2>Liste des dispositifs médicaux</h2>

                    <div id="list-container-dispositifs" style="max-height: calc(100vh - 350px); overflow-y: auto;">
                        <div v-for="disp in filteredDispositifs" :key="disp.id_dispositif"
                            :class="['list-item', { 'stock-item-alert': getDispositifStatus(disp.id_dispositif).isAlert, 'active': selectedDispositifId === disp.id_dispositif }]"
                            @click="selectDispositif(disp.id_dispositif)">
                            <div>
                                <h3 class="item-title">{{ disp.nom_dispositif }}</h3>
                                <small class="text-muted">Catégorie: {{ disp.categorie }}</small>
                            </div>

                            <div class="item-meta">
                                <span v-html="getDispositifStatus(disp.id_dispositif).statusText"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Dispositif Details -->
                <div class="detail-panel">

                    <div v-if="!selectedDispositif" style="text-align: center; margin-top: 50px;">
                        <p style="color: var(--gh-text-color-secondary);">Sélectionnez un dispositif dans la liste pour gérer ses lots de stock.</p>
                    </div>

                    <div v-else>
                        <h2 class="detail-title">
                            Gestion des Lots pour : {{ selectedDispositif.nom_dispositif }}
                            <button class="btn btn-outline btn-sm"
                                @click="editDispositif(selectedDispositif.id_dispositif)">Modifier</button>
                        </h2>
                        <div
                            style="margin-bottom: 1.5rem; padding: 10px; border: 1px solid var(--gh-border-color); border-radius: 6px; background-color: var(--gh-header-bg);">
                            <p style="font-weight: 700; font-size: 1.125rem;">Stock Total Actuel : <span
                                :style="{ color: totalStockColor }">{{ getTotalStock(selectedDispositif.id_dispositif) }} Unités</span></p>
                            <p style="font-size: 0.875rem; color: var(--gh-text-color-secondary);">Unité de vente: {{ selectedDispositif.unite_vente }}</p>
                        </div>

                        <h3 class="detail-subtitle"><i class="fa fa-home" style="margin-right: 4px;"></i> Lots en Stock
                            ({{ selectedDispositifLots.length }})</h3>

                        <table v-if="selectedDispositifLots.length > 0" class="lots-table activities-table">
                            <thead>
                                <tr>
                                    <th>Lot #</th>
                                    <th>Quantité</th>
                                    <th>seuil d'alerte</th>
                                    <th>Péremption</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="stock in selectedDispositifLots" :key="stock.id_stock">
                                    <td>{{ stock.numero_lot }}</td>
                                    <td style="font-weight: 600;">{{ stock.quantite_actuelle }}</td>
                                    <td style="font-weight: 600;"
                                        :class="{ 'text-danger': stock.quantite_actuelle <= stock.seuil_alerte }"
                                        >{{ stock.quantite_actuelle }} 
                                        <small v-if="stock.quantite_actuelle <= stock.seuil_alerte">Lot faible</small>
                                    </td>
                                    <td :class="{ 'lot-expired': new Date(stock.date_peremption) < new Date() }">
                                        <span v-if="new Date(stock.date_peremption) < new Date()">
                                            <i class="fa fa-exclamation-circle"></i> {{ new
                                                Date(stock.date_peremption).toLocaleDateString() }}
                                            (EXPIRÉ)
                                        </span>
                                        <span v-else>{{ new Date(stock.date_peremption).toLocaleDateString() }}</span>
                                    </td>
                                    <td>
                                        <button class="btn mr-2"
                                            @click="openModal(selectedDispositif.id_dispositif, stock.id_stock, 'dispositif')"><i
                                                class="fa fa-edit"></i></button>
                                        <button class="btn" @click="deleteLot(stock.id_stock)"
                                            style="color: var(--gh-danger-red);"><i class="fa fa-trash-o"></i></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <p v-else style="margin-top: 10px;">Aucun lot trouvé. Ajoutez-en un nouveau ci-dessous.</p>

                        <button class="btn btn-primary btn-block p-2" style="margin-top: 1rem;"
                            @click="openModal(selectedDispositif.id_dispositif, null, 'dispositif')">
                            <i class="fa fa-plus-circle"></i> Ajouter un Nouveau Lot
                        </button>

                        <div>
                            <h3 class="detail-subtitle">Mouvements Stock</h3>

                            <div v-if="dispositifMovements.length > 0" class="movements-table-container">
                                <table class="movements-table activities-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Quantité</th>
                                            <th>Numéro Lot</th>
                                            <th>Utilisateur</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="movement in dispositifMovements.slice(0, 10)"
                                            :key="movement.id_mouvement">
                                            <td>{{ new Date(movement.date_mouvement).toLocaleDateString()  }} {{  new Date(movement.date_mouvement).toLocaleTimeString() }}</td>
                                            <td>
                                                <span
                                                    :class="['status', getMovementTypeClass(movement.type_mouvement)]">
                                                    {{ getMovementTypeLabel(movement.type_mouvement) }}
                                                </span>
                                            </td>
                                            <td
                                                :class="{ 'text-success': movement.quantite > 0, 'text-danger': movement.quantite < 0 }">
                                                {{ movement.quantite > 0 ? '+' : '' }}{{ movement.quantite }}
                                            </td>
                                            <td>{{ movement.numero_lot || '-' }}</td>
                                            <td>{{ movement.nom_professionnel || 'Système' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p v-else style="margin-top: 10px; color: var(--gh-text-color-secondary);">
                                Aucun mouvement enregistré pour ce dispositif.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Medicament Modal -->
    <AddMedicamentModal :show="showAddMedicamentModal" :medicament="editingMedicament"
        @close="showAddMedicamentModal = false; editingMedicament = null" @medicament-added="handleMedicamentAdded" />
    
    <!-- Add Dispositif Modal -->
    <AddDispositifModal :show="showAddDispositifModal" :dispositif="editingDispositif"
        @close="showAddDispositifModal = false; editingDispositif = null" @dispositif-added="handleDispositifAdded" />
    
    <!-- Stock Report Modal -->
    <StockReportModal :show="showStockReportModal" :medicines="medicines" :dispositifs="dispositifs" :stocks="allStocks"
        @close="showStockReportModal = false" />

    <!-- Lot Modal -->
    <div v-if="showLotModal" class="lot-modal" @click="closeModal">
        <div class="modal-content" @click.stop>
            <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                {{ lotFormData.id ? 'Modifier le Lot' : 'Ajouter un Nouveau Lot' }} pour : {{
                    lotFormData.type === 'medicament' ? selectedMedicine?.nom_commercial : selectedDispositif?.nom_dispositif }}
            </h3>
            <form @submit="handleLotSubmit" style="display: flex; flex-direction: column; gap: 1rem;">
                <input type="hidden" v-model="lotFormData.id">
                <input type="hidden" v-model="lotFormData.medicamentId">
                <div class="form-group">
                    <label for="lot-number" class="form-label">Numéro de Lot:</label>
                    <input type="text" id="lot-number" v-model="lotFormData.numeroLot" required class="app-input"
                        disabled>
                </div>

                <div class="d-flex">
                    <div class="form-group">
                        <label for="lot-quantity" class="form-label">Quantité (Unités):</label>
                        <input type="number" id="lot-quantity" v-model.number="lotFormData.quantite" required min="1"
                            class="app-input">
                    </div>

                    <div class="form-group">
                        <label for="lot-expiration" class="form-label">Seuil d'Alerte:</label>
                        <input type="number" id="lot-expiration" v-model="lotFormData.seuil_alerte" required
                            class="app-input">
                    </div>
                </div>

                <div class="form-group">
                    <label for="lot-expiration" class="form-label">Date d'Expiration:</label>
                    <input type="date" id="lot-expiration" v-model="lotFormData.datePeremption" required
                        class="app-input">
                </div>



                <div class="form-group" v-if="lotFormData.id">
                    <label for="operation-type" class="form-label">Type d'Opération:</label>
                    <select id="operation-type" v-model="lotFormData.type_operation" class="app-input" required>
                        <option selected disabled>sélectionner le type d'opération</option>
                        <option v-for="type in operationTypes" :key="type.value" :value="type.value">
                            {{ type.label }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea v-model="lotFormData.notes" name="notes" placeholder="Notes sur l'opération effectuée"
                        id="notes"></textarea>
                </div>

                <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Enregistrer le Lot</button>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Utiliser les styles existants de main.css autant que possible */

/* Sélecteur de mode (Stock/Dispensation) */
.mode-selector {
    display: flex;
    margin-bottom: 1.5rem;
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 1px 3px var(--gh-shadow);
    max-width: 450px;
}

/* Style pour les alertes de stock/expiration */
.stock-item-alert {
    background-color: var(--gh-primary-blue-lighter-bg);
}

.stock-alert-text {
    color: var(--gh-danger-red);
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

.item-title {
    font-size: 0.875rem;
    font-weight: 600;
}

div>.active>div>small {
    color: white;
}

.item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--gh-text-color-secondary);
    margin-top: 4px;
}

.lot-expired {
    color: var(--gh-danger-red);
    font-weight: 600;
}

/* Modal styles */
.lot-modal {
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    /* overflow: auto; */
    background-color: rgba(0, 0, 0, 0.4);
}

.lots-table tbody tr {
    cursor: pointer;
    border-bottom: 1px solid var(--gh-border-color);
}

.lots-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

.modal-content {
    background-color: var(--gh-card-bg);
    margin: 15% auto;
    padding: 20px;
    border: 1px solid var(--gh-border-color);
    width: 90%;
    max-width: 400px;
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

.view-tabs {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    background-color: var(--gh-header-bg);
    padding: 0 20px;
}

.tab-button {
    background-color: transparent;
    border: none;
    padding: 15px 20px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: var(--gh-text-color);
    border-bottom: 3px solid transparent;
    transition: border-bottom-color 0.2s ease;
}

.tab-button.active {
    border-bottom-color: var(--gh-primary-blue);
}

.tab-button:hover {
    color: var(--gh-primary-blue);
}

.category-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--gh-text-color);
    margin: 10px 0 5px 0;
    transition: background-color 0.2s ease;
}

.category-title:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

.category-content {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
    }

    to {
        opacity: 1;
        max-height: 1000px;
    }
}

.grouped-item {
    padding-left: 20px;
    border-left: 2px solid var(--gh-primary-blue-lighter);
}

.tab-content {
    display: none;
    flex-grow: 1;
}

.tab-content.active {
    display: flex;
}

/* Styles pour le graphique et les mouvements */
.chart-container {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
}

.movements-table-container {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    overflow-x: auto;
}

.movements-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.movements-table th,
.movements-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.movements-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
}

.movements-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

/* Ajustements pour la responsivité */
@media (max-width: 900px) {
    .main-content {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--gh-sidebar-border);
    }

    .detail-panel {
        padding-top: 20px;
    }

    .mode-selector {
        margin-bottom: 10px;
    }

    .chart-container {
        height: 250px !important;
    }

    .movements-table-container {
        font-size: 12px;
    }
}

.tab-buttons {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    background-color: var(--gh-header-bg);
    padding: 0 20px;
}

.tab-button {
    background-color: transparent;
    border: none;
    padding: 15px 20px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: var(--gh-text-color);
    border-bottom: 3px solid transparent;
    transition: border-bottom-color 0.2s ease;
}

.tab-button.active {
    border-bottom-color: var(--gh-primary-blue);
}

.tab-button:hover {
    color: var(--gh-primary-blue);
}

.tab-content {
    display: none;
    flex-grow: 1;
}

.tab-content.active {
    display: flex;
}
</style>
