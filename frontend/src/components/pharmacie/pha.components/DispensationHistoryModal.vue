<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAllDispensations } from '../../../utils/dispensation.js';
import { getMedicamentById } from '../../../utils/medicament.js';
import { getPatientById } from '../../../utils/patient.js';
import { getProfessionnelById } from '../../../utils/professionnel.js';
import { getLignePrescriptionById } from '@/utils/lignePrescription.js'

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});



const dispensations = ref([]);
const sortBy = ref('date_dispensation');
const sortOrder = ref('desc');
const filterBy = ref('all');
const dateFilter = ref('all');
const loading = ref(true);

const closeModal = () => {
    emit('close');
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'délivrée':
        case 'delivree':
            return 'completed';
        case 'en attente':
        case 'en_attente':
            return 'pending';
        case 'annulée':
        case 'annulee':
            return 'danger';
        default:
            return 'pending';
    }
};

const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
        case 'délivrée':
        case 'delivree':
            return 'Délivrée';
        case 'en attente':
        case 'en_attente':
            return 'En attente';
        case 'annulée':
        case 'annulee':
            return 'Annulée';
        default:
            return status || 'En attente';
    }
};

const sortOptions = [
    { value: 'date_dispensation', label: 'Date de dispensation' },
    { value: 'patient_name', label: 'Patient' },
    { value: 'medicament_name', label: 'Médicament' },
    { value: 'quantite_delivree', label: 'Quantité dispensée' },
    { value: 'quantite_prescrite', label: 'Quantité prescrite' },
    { value: 'statut', label: 'Statut' }
];

const filterOptions = [
    { value: 'all', label: 'Toutes les dispensations' },
    { value: 'delivree', label: 'Délivrées' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'annulee', label: 'Annulées' }
];

const dateFilterOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'yesterday', label: 'Hier' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
];

const prepareDispensationData = async () => {
    try {
        loading.value = true;

        // Charger les dispensations
        const dispensationsData = await getAllDispensations();

        if (!dispensationsData || dispensationsData.length === 0) {
            dispensations.value = [];
            loading.value = false;
            return;
        }

        // Enrichir chaque dispensation avec les données individuelles
        const enrichedDispensations = await Promise.all(
            dispensationsData.map(async (disp) => {
                try {
                    // Récupérer les données pour chaque dispensation
                    const [medicamentData, patientData, professionnelData, lignePrescription] = await Promise.all([
                        getMedicamentById(disp.id_medicament).catch(() => null),
                        getPatientById(disp.id_patient).catch(() => null),
                        getProfessionnelById(disp.id_professionnel_dispensateur).catch(() => null),
                        getLignePrescriptionById(disp.id_ligne_prescription).catch(()=> null)
                    ]);

                    console.log(lignePrescription);

                    return {
                        ...disp,
                        patient_name: patientData ? `${patientData.prenoms || ''} ${patientData.nom || ''}`.trim() : 'Patient inconnu',
                        medicament_name: medicamentData ? medicamentData.nom_commercial : 'Médicament inconnu',
                        dosage: medicamentData ? medicamentData.dosage : '-',
                        pharmacien_name: professionnelData ? `${professionnelData.prenoms || ''} ${professionnelData.nom || ''}`.trim() : 'Pharmacien inconnu',
                        statut: lignePrescription ? `${lignePrescription.statut}` : 'délivrée__', // Ajouter un statut par défaut si non présent
                        quantite_prescrite: lignePrescription ? lignePrescription.quantite_prescrite : 'N/A'
                    };
                } catch (error) {
                    console.warn(`Erreur lors de l'enrichissement de la dispensation ${disp.id_dispensation}:`, error);
                    return {
                        ...disp,
                        patient_name: 'Patient inconnu',
                        medicament_name: 'Médicament inconnu',
                        dosage: '-',
                        pharmacien_name: 'Pharmacien inconnu',
                        statut: disp.statut || 'délivrée'
                    };
                }
            })
        );

        dispensations.value = enrichedDispensations;
        console.log(dispensations.value);

    } catch (error) {
        console.error('Erreur lors du chargement des données de dispensation:', error);
        dispensations.value = [];
    } finally {
        loading.value = false;
    }
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
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    if (filterDropdownMenu) {
        filterDropdownMenu.classList.remove('show');
        document.getElementById('filterDropdownToggle').setAttribute('aria-expanded', 'false');
    }
};

const selectDateFilter = (value) => {
    dateFilter.value = value;
    const dateFilterDropdownMenu = document.getElementById('dateFilterDropdownMenu');
    if (dateFilterDropdownMenu) {
        dateFilterDropdownMenu.classList.remove('show');
        document.getElementById('dateFilterDropdownToggle').setAttribute('aria-expanded', 'false');
    }
};

const selectSort = (value) => {
    changeSort(value);
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
    printWindow.print();
};

const generatePrintContent = () => {
    const filteredData = filteredAndSortedDispensations.value;
    const filterLabel = filterOptions.find(opt => opt.value === filterBy.value)?.label || 'Toutes les dispensations';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Historique des Dispensations - ${filterLabel} - ${new Date().toLocaleDateString('fr-FR')}</title>
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
            <h1>Historique des Dispensations - ${filterLabel}</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <div class="filter-info">
                <strong>Filtre appliqué:</strong> ${filterLabel}<br>
                <strong>Période:</strong> ${dateFilterOptions.find(opt => opt.value === dateFilter.value)?.label || 'Toutes les dates'}<br>
                <strong>Tri:</strong> ${sortOptions.find(opt => opt.value === sortBy.value)?.label || 'Date de dispensation'} (${sortOrder.value === 'asc' ? 'croissant' : 'décroissant'})
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date de Dispensation</th>
                        <th>Patient</th>
                        <th>Médicament</th>
                        <th>Dosage</th>
                        <th>Quantité Délivrée</th>
                        <th>Quantité Prescrite</th>
                        <th>Pharmacien</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(disp => `
                       <tr>
                           <td>${formatDate(disp.date_dispensation)}</td>
                           <td>${disp.patient_name}</td>
                           <td>${disp.medicament_name}</td>
                           <td>${disp.dosage}</td>
                           <td>${disp.quantite_delivree}</td>
                           <td>${disp.quantite_prescrite}</td>
                           <td>${disp.pharmacien_name}</td>
                           <td class="status-${getStatusClass(disp.statut).replace('danger', 'danger').replace('pending', 'warning').replace('completed', 'success')}">${getStatusLabel(disp.statut)}</td>
                       </tr>
                   `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <h3>Résumé des Dispensations (${filterLabel})</h3>
                <p><strong>Dispensations affichées:</strong> ${filteredData.length}</p>
                <p><strong>Total Quantité Dispensée:</strong> ${filteredData.reduce((total, disp) => total + (disp.quantite_delivree || 0), 0)}</p>
                <p><strong>Période:</strong> ${getPeriodLabel()}</p>
            </div>
        </body>
        </html>
    `;
};

const filteredAndSortedDispensations = computed(() => {
    let filtered = dispensations.value;

    // Apply status filter
    if (filterBy.value !== 'all') {
        filtered = filtered.filter(disp => {
            const status = disp.statut?.toLowerCase();
            switch (filterBy.value) {
                case 'delivree':
                    return status === 'délivrée' || status === 'delivree';
                case 'en_attente':
                    return status === 'en attente' || status === 'en_attente';
                case 'annulee':
                    return status === 'annulée' || status === 'annulee';
                default:
                    return false;
            }
        });
    }

    // Apply date filter
    if (dateFilter.value !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;

        switch (dateFilter.value) {
            case 'today':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 1);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = today;
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(today);
                endDate.setDate(today.getDate() + (6 - today.getDay()) + 1);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear() + 1, 0, 1);
                break;
        }

        filtered = filtered.filter(disp => {
            const dispDate = new Date(disp.date_dispensation);
            return dispDate >= startDate && dispDate < endDate;
        });
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
        let aValue = a[sortBy.value];
        let bValue = b[sortBy.value];

        // Handle special cases
        if (sortBy.value === 'date_dispensation') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
        } else if (sortBy.value === 'quantite_delivree') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        } else if (sortBy.value === 'quantite_prescrite') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
        return 0;
    });
});

const filteredTotalQuantity = computed(() => {
    return filteredAndSortedDispensations.value.reduce((total, disp) => total + (disp.quantite_delivree || 0), 0);
});

const getPeriodLabel = () => {
    if (dispensations.value.length === 0) return 'Aucune donnée';

    const dates = dispensations.value.map(d => new Date(d.date_dispensation)).filter(d => !isNaN(d));
    if (dates.length === 0) return 'Période inconnue';

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    if (minDate.toDateString() === maxDate.toDateString()) {
        return minDate.toLocaleDateString('fr-FR');
    }

    return `${minDate.toLocaleDateString('fr-FR')} - ${maxDate.toLocaleDateString('fr-FR')}`;
};

// Watch for changes in props to update data
import { watch, nextTick } from 'vue';
watch(() => props.show, async (newShow) => {
    if (newShow) {
        await prepareDispensationData();
        nextTick(() => {
            initializeDropdowns();
        });
    }
});

onMounted(async () => {
    if (props.show) {
        await prepareDispensationData();
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

    // Date filter dropdown
    const dateFilterDropdownToggle = document.getElementById('dateFilterDropdownToggle');
    const dateFilterDropdownMenu = document.getElementById('dateFilterDropdownMenu');
    const dateFilterDropdown = document.getElementById('dateFilterDropdown');

    if (dateFilterDropdownToggle && dateFilterDropdownMenu) {
        const toggleDateFilterDropdown = (show) => {
            const isShown = dateFilterDropdownMenu.classList.contains('show');
            const forceShow = typeof show === 'boolean' ? show : !isShown;

            if (forceShow) {
                dateFilterDropdownMenu.classList.add('show');
                dateFilterDropdownToggle.setAttribute('aria-expanded', 'true');
            } else {
                dateFilterDropdownMenu.classList.remove('show');
                dateFilterDropdownToggle.setAttribute('aria-expanded', 'false');
            }
        };

        dateFilterDropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDateFilterDropdown();
        });

        document.addEventListener('click', (event) => {
            if (!dateFilterDropdown.contains(event.target)) {
                toggleDateFilterDropdown(false);
            }
        });
    }
};
</script>

<template>
    <div v-if="show" class="dispensation-history-modal" @click="closeModal">
        <div class="modal-content animate__animated animate__fadeIn" @click.stop>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                Historique des produits délivrée
                <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            </h3>

            <div class="modal-actions"
                style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div class="filter-sort-controls" style="display: flex; gap: 15px; align-items: center;">
                    <div class="filter-control">
                        <label for="filter-select" style="margin-right: 10px; font-weight: 600;">Filtrer par:</label>
                        <div class="dropdown" id="filterDropdown">
                            <button class="dropdown-toggle" id="filterDropdownToggle" aria-expanded="false"
                                aria-controls="filterDropdownMenu">
                                {{filterOptions.find(opt => opt.value === filterBy)?.label || 'Toutes les dispensations' }}
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <div class="dropdown-menu" id="filterDropdownMenu">
                                <a href="#" class="dropdown-item" v-for="option in filterOptions" :key="option.value"
                                    @click.prevent="selectFilter(option.value)">
                                    <i class="fa fa-filter"></i> {{ option.label }}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="date-filter-control">
                        <label for="date-filter-select" style="margin-right: 10px; font-weight: 600;">Période:</label>
                        <div class="dropdown" id="dateFilterDropdown">
                            <button class="dropdown-toggle" id="dateFilterDropdownToggle" aria-expanded="false"
                                aria-controls="dateFilterDropdownMenu">
                                {{dateFilterOptions.find(opt => opt.value === dateFilter)?.label || 'Toutes les dates' }}
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <div class="dropdown-menu" id="dateFilterDropdownMenu">
                                <a href="#" class="dropdown-item" v-for="option in dateFilterOptions" :key="option.value"
                                    @click.prevent="selectDateFilter(option.value)">
                                    <i class="fa fa-calendar"></i> {{ option.label }}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="sort-controls">
                        <label for="sort-select" style="margin-right: 10px; font-weight: 600;">Trier par:</label>
                        <div class="dropdown" id="sortDropdown">
                            <button class="dropdown-toggle" id="sortDropdownToggle" aria-expanded="false"
                                aria-controls="sortDropdownMenu">
                                {{sortOptions.find(opt => opt.value === sortBy)?.label || 'Date de dispensation'}}
                                <i class="fa fa-caret-down"></i>
                            </button>
                            <div class="dropdown-menu" id="sortDropdownMenu">
                                <a href="#" class="dropdown-item" v-for="option in sortOptions" :key="option.value"
                                    @click.prevent="selectSort(option.value)">
                                    <i class="fa fa-sort"></i> {{ option.label }}
                                </a>
                            </div>
                        </div>
                        <button class="btn btn-outline-secondary btn-sm" @click="changeSort(sortBy)"
                            style="padding: 4px 8px; margin-left: 10px;">
                            <i :class="sortOrder === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
                        </button>
                    </div>
                </div>
                <button class="btn btn-primary" @click="printReport">
                    <i class="fa fa-print"></i> Imprimer le Rapport
                </button>
            </div>
            <div class="table-container" style="flex: 1; overflow-y: auto; overflow-x: auto;">
                <table class="dispensation-history-table activities-table">
                    <thead style="position: sticky; top: 0; background-color: var(--gh-card-bg); z-index: 1;">
                        <tr>
                            <th>Date de Dispensation</th>
                            <th>Patient</th>
                            <th>Médicament</th>
                            <th>Dosage</th>
                            <th>Quantité Délivrée</th>
                            <th>Quantité Prescrite</th>
                            <th>Pharmacien</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="disp in filteredAndSortedDispensations" :key="disp.id_dispensation">
                            <td>{{ formatDate(disp.date_dispensation) }}</td>
                            <td>{{ disp.patient_name }}</td>
                            <td>{{ disp.medicament_name }}</td>
                            <td>{{ disp.dosage }}</td>
                            <td>{{ disp.quantite_delivree }}</td>
                            <td>{{ disp.quantite_prescrite }}</td>
                            <td>{{ disp.pharmacien_name }}</td>
                            <td>
                                <span :class="['status', getStatusClass(disp.statut)]">
                                    {{ getStatusLabel(disp.statut) }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="filteredAndSortedDispensations.length === 0">
                            <td colspan="8"
                                style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                Aucune dispensation trouvée avec ce filtre.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="report-summary"
                style="margin-top: 20px; padding: 15px; background-color: var(--gh-header-bg); border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Résumé des Dispensations ({{filterOptions.find(opt => opt.value ===
                    filterBy)?.label || 'Toutes' }})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Dispensations affichées:</strong> {{ filteredAndSortedDispensations.length }}
                    </div>
                    <div>
                        <strong>Total Quantité Dispensée:</strong> {{ filteredTotalQuantity }}
                    </div>
                    <div>
                        <strong>Période:</strong> {{ getPeriodLabel() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dispensation-history-modal {
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
    max-height: 85vh;
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

.dispensation-history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.dispensation-history-table th,
.dispensation-history-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.dispensation-history-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
    position: sticky;
    top: 0;
}

.dispensation-history-table tbody tr:hover {
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
    min-width: 180px;
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
    background-color: var(--gh-navbar-link-hover);
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
    background-color: var(--gh-navbar-link-hover);
    color: var(--gh-primary-blue);
}

.dropdown-item:active {
    background-color: var(--gh-navbar-link-hover);
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

    .dispensation-history-table th,
    .dispensation-history-table td {
        padding: 8px;
        font-size: 12px;
    }
}
</style>