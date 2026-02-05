<template>
    <div v-if="show" class="today-exits-modal" @click="closeModal">
        <div class="modal-content animate__animated animate__fadeIn" @click.stop>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                Détails des Sorties du Jour
                <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            </h3>

            <div class="table-container" style="flex: 1; overflow-y: auto; overflow-x: auto;">
                <table class="today-exits-table activities-table">
                    <thead style="position: sticky; top: 0; background-color: var(--gh-card-bg); z-index: 1;">
                        <tr>
                            <th>Médicament</th>
                            <th>Dosage</th>
                            <th>Forme</th>
                            <th>Nom Générique</th>
                            <th>Quantité Sortie</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="exit in exits" :key="exit.nom_commercial + exit.dosage">
                            <td>{{ exit.nom_commercial }}</td>
                            <td>{{ exit.dosage }}</td>
                            <td>{{ exit.forme_pharmaceutique }}</td>
                            <td>{{ exit.nom_generique }}</td>
                            <td style="font-weight: 600;">{{ exit.total_sorties_aujourdhui }}</td>
                        </tr>
                        <tr v-if="exits.length === 0">
                            <td colspan="5" style="text-align: center; padding: 20px; color: var(--gh-text-color-secondary);">
                                Aucune sortie trouvée pour aujourd'hui.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="report-summary" style="margin-top: 20px; padding: 15px; background-color: var(--gh-header-bg); border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Résumé des Sorties ({{ getCurrentDate() }})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Médicaments sortis:</strong> {{ exits.length }}
                    </div>
                    <div>
                        <strong>Total Quantité Sortie:</strong> {{ totalQuantityExited }}
                    </div>
                    <div>
                        <strong>Médicament le plus sorti:</strong> {{ topExitedMedicament }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getTodayExitsByMedicament } from '@/utils/mouvementStock';

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const exits = ref([]);
const loading = ref(true);

const closeModal = () => {
    emit('close');
};

const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const totalQuantityExited = computed(() => {
    return exits.value.reduce((total, exit) => total + (exit.total_sorties_aujourdhui || 0), 0);
});

const topExitedMedicament = computed(() => {
    if (exits.value.length === 0) return 'Aucun';
    const topExit = exits.value.reduce((max, exit) =>
        exit.total_sorties_aujourdhui > max.total_sorties_aujourdhui ? exit : max
    );
    return `${topExit.nom_commercial} (${topExit.total_sorties_aujourdhui} unités)`;
});

const loadTodayExits = async () => {
    try {
        loading.value = true;
        const data = await getTodayExitsByMedicament();
        exits.value = data || [];
        console.log('Sorties du jour chargées:', exits.value);
    } catch (error) {
        console.error('Erreur lors du chargement des sorties du jour:', error);
        exits.value = [];
    } finally {
        loading.value = false;
    }
};

// Watch for changes in props to update data
import { watch, nextTick } from 'vue';
watch(() => props.show, async (newShow) => {
    if (newShow) {
        await loadTodayExits();
        nextTick(() => {
            // Any additional initialization if needed
        });
    }
});

onMounted(async () => {
    if (props.show) {
        await loadTodayExits();
    }
});
</script>

<style scoped>
.today-exits-modal {
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

.today-exits-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.today-exits-table th,
.today-exits-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.today-exits-table th {
    background-color: var(--gh-header-bg);
    font-weight: 600;
    color: var(--gh-text-color);
    position: sticky;
    top: 0;
}

.today-exits-table tbody tr:hover {
    background-color: var(--gh-primary-blue-lighter-bg);
}

@media (max-width: 768px) {
    .modal-content {
        width: 98%;
        margin: 10px;
        padding: 15px;
    }

    .today-exits-table th,
    .today-exits-table td {
        padding: 8px;
        font-size: 12px;
    }
}
</style>