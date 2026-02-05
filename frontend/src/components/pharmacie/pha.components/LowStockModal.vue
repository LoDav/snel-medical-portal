<template>
    <div v-if="show" class="low-stock-modal" @click="closeModal">
        <div class="modal-content animate__animated animate__fadeIn" @click.stop>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                Médicaments en Stock Faible
                <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            </h3>

            <div v-if="loading" class="loading-message" style="text-align: center; padding: 20px;">
                <i class="fa fa-spinner fa-spin" style="font-size: 2rem; color: var(--gh-primary-blue); margin-bottom: 10px;"></i>
                <p style="margin: 0; color: var(--gh-text-color-secondary);">Chargement des données...</p>
            </div>

            <div v-else-if="lowStockMedicaments.length === 0" class="no-data-message" style="text-align: center; padding: 20px;">
                <i class="fa fa-check-circle" style="font-size: 2rem; color: var(--gh-success-green); margin-bottom: 10px;"></i>
                <h4 style="margin: 0 0 10px 0; color: var(--gh-success-green);">Aucun stock faible</h4>
                <p style="margin: 0; color: var(--gh-text-color-secondary);">Tous les médicaments sont en stock suffisant.</p>
            </div>

            <div v-else class="table-container" style="flex: 1; overflow-y: auto; overflow-x: auto;">
                <table class="low-stock-table activities-table">
                    <thead style="position: sticky; top: 0; background-color: var(--gh-card-bg); z-index: 1;">
                        <tr>
                            <th>Nom Commercial</th>
                            <th>Dosage</th>
                            <th>Nom Générique</th>
                            <th>Forme</th>
                            <th>Catégorie</th>
                            <th>Quantité Actuelle</th>
                            <th>Seuil d'Alerte</th>
                            <th>État</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="med in lowStockMedicaments" :key="med.nom_commercial + med.dosage">
                            <td>{{ med.nom_commercial }}</td>
                            <td>{{ med.dosage }}</td>
                            <td>{{ med.nom_generique }}</td>
                            <td>{{ med.forme_pharmaceutique }}</td>
                            <td>{{ med.nom_categorie || 'Non catégorisé' }}</td>
                            <td style="font-weight: 600; color: var(--gh-danger-red);">{{ med.quantite_totale }}</td>
                            <td style="font-weight: 600;">{{ med.seuil_total }}</td>
                            <td>
                                <span class="status danger">
                                    <i class="fa fa-exclamation-triangle"></i> Stock faible
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="!loading && lowStockMedicaments.length > 0" class="report-summary" style="margin-top: 20px; padding: 15px; background-color: var(--gh-header-bg); border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Résumé des Stocks Faibles</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Médicaments concernés:</strong> {{ lowStockMedicaments.length }}
                    </div>
                    <div>
                        <strong>Total Quantité:</strong> {{ totalQuantity }}
                    </div>
                    <div>
                        <strong>Médicament le plus critique:</strong> {{ mostCriticalMedicament }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getLowStockMedicaments } from '@/utils/stockMedicament';

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const lowStockMedicaments = ref([]);
const loading = ref(true);

const closeModal = () => {
    emit('close');
};

const totalQuantity = computed(() => {
    return lowStockMedicaments.value.reduce((total, med) => total + (med.quantite_totale || 0), 0);
});

const mostCriticalMedicament = computed(() => {
    if (lowStockMedicaments.value.length === 0) return 'Aucun';
    const mostCritical = lowStockMedicaments.value.reduce((min, med) =>
        med.quantite_totale < min.quantite_totale ? med : min
    );
    return `${mostCritical.nom_commercial} (${mostCritical.quantite_totale} unités)`;
});

const loadLowStockMedicaments = async () => {
    try {
        loading.value = true;
        const data = await getLowStockMedicaments();
        lowStockMedicaments.value = data || [];
        console.log('Médicaments en stock faible chargés:', lowStockMedicaments.value);
    } catch (error) {
        console.error('Erreur lors du chargement des médicaments en stock faible:', error);
        lowStockMedicaments.value = [];
    } finally {
        loading.value = false;
    }
};

// Watch for changes in props to update data
import { watch, nextTick } from 'vue';
watch(() => props.show, async (newShow) => {
    if (newShow) {
        await loadLowStockMedicaments();
        nextTick(() => {
            // Any additional initialization if needed
        });
    }
});

onMounted(async () => {
    if (props.show) {
        await loadLowStockMedicaments();
    }
});
</script>

<style scoped>
.low-stock-modal {
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
    max-width: 1400px;
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

.low-stock-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.low-stock-table th,
.low-stock-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.low-stock-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
    position: sticky;
    top: 0;
}

.low-stock-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

.status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.status.danger {
    background-color: rgba(215, 58, 73, 0.1);
    color: var(--gh-danger-red);
}

@media (max-width: 768px) {
    .modal-content {
        width: 98%;
        margin: 10px;
        padding: 15px;
    }

    .low-stock-table th,
    .low-stock-table td {
        padding: 8px;
        font-size: 12px;
    }
}
</style>