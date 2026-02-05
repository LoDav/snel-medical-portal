<template>
    <div v-if="show" class="monthly-receptions-modal" @click="closeModal">
        <div class="modal-content animate__animated animate__fadeIn" @click.stop>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                Détails des Réceptions du Mois
                <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            </h3>

            <div class="table-container" style="flex: 1; overflow-y: auto; overflow-x: auto;">
                <table class="monthly-receptions-table activities-table">
                    <thead style="position: sticky; top: 0; background-color: var(--gh-card-bg); z-index: 1;">
                        <tr>
                            <th>Date de Réception</th>
                            <th>Type</th>
                            <th>Produit</th>
                            <th>Détail</th>
                            <th>Lot</th>
                            <th>Date Péremption</th>
                            <th>Quantité Reçue</th>
                            <th>Reçu par</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="reception in receptions" :key="reception.date_reception + reception.nom_produit + reception.lot">
                            <td>{{ formatDate(reception.date_reception) }}</td>
                            <td>{{ reception.type_produit }}</td>
                            <td>{{ reception.nom_produit }}</td>
                            <td>{{ reception.detail_produit }}</td>
                            <td>{{ reception.lot }}</td>
                            <td>{{ formatDate(reception.date_peremption) }}</td>
                            <td style="font-weight: 600;">{{ reception.quantite_recue }}</td>
                            <td>{{ reception.receptionne_par }}</td>
                        </tr>
                        <tr v-if="receptions.length === 0">
                            <td colspan="8" style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                Aucune réception trouvée pour ce mois.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="report-summary" style="margin-top: 20px; padding: 15px; background-color: var(--gh-header-bg); border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Résumé des Réceptions ({{ getCurrentMonthName() }})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Réceptions affichées:</strong> {{ receptions.length }}
                    </div>
                    <div>
                        <strong>Total Quantité Reçue:</strong> {{ totalQuantityReceived }}
                    </div>
                    <div>
                        <strong>Nombre de Lots:</strong> {{ uniqueLotsCount }}
                    </div>
                    <div>
                        <strong>Produits Différents:</strong> {{ uniqueProductsCount }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getMonthlyReceptions } from '@/utils/mouvementStock';

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const receptions = ref([]);
const loading = ref(true);

const closeModal = () => {
    emit('close');
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
};

const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
};

const totalQuantityReceived = computed(() => {
    return receptions.value.reduce((total, reception) => total + (reception.quantite_recue || 0), 0);
});

const uniqueLotsCount = computed(() => {
    const lots = new Set(receptions.value.map(r => r.lot));
    return lots.size;
});

const uniqueProductsCount = computed(() => {
    const products = new Set(receptions.value.map(r => r.nom_produit));
    return products.size;
});

const loadMonthlyReceptions = async () => {
    try {
        loading.value = true;
        const data = await getMonthlyReceptions();
        receptions.value = data || [];
        console.log('Réceptions mensuelles chargées:', receptions.value);
    } catch (error) {
        console.error('Erreur lors du chargement des réceptions mensuelles:', error);
        receptions.value = [];
    } finally {
        loading.value = false;
    }
};

// Watch for changes in props to update data
import { watch, nextTick } from 'vue';
watch(() => props.show, async (newShow) => {
    if (newShow) {
        await loadMonthlyReceptions();
        nextTick(() => {
            // Any additional initialization if needed
        });
    }
});

onMounted(async () => {
    if (props.show) {
        await loadMonthlyReceptions();
    }
});
</script>

<style scoped>
.monthly-receptions-modal {
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: var(--gh-card-bg);
    margin: auto;
    overflow: hidden;
    margin-top: 110px;
    padding: 20px;
    border: 1px solid var(--gh-border-color);
    width: 95%;
    max-width: 1400px;
    max-height: 80vh;
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

.monthly-receptions-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.monthly-receptions-table th,
.monthly-receptions-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.monthly-receptions-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
    position: sticky;
    top: 0;
}

.monthly-receptions-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

@media (max-width: 768px) {
    .modal-content {
        width: 98%;
        margin: 10px;
        padding: 15px;
    }

    .monthly-receptions-table th,
    .monthly-receptions-table td {
        padding: 8px;
        font-size: 12px;
    }
}
</style>