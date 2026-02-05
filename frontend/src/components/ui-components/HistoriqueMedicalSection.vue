<script setup>
import { defineProps, ref } from 'vue';
import ConsultationDetailModal from './ConsultationDetailModal.vue';

const props = defineProps({
    consultations: {
        type: Array,
        default: () => []
    }
});

const showModal = ref(false);
const selectedConsultation = ref(null);

const openModal = (consultation) => {
    console.log('Opening modal for consultation:', consultation);
    selectedConsultation.value = consultation;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedConsultation.value = null;
};
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Historique Médical
        </div>
        <div class="data-view" v-if="consultations.length != 0">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>date</th>
                        <th>Motif</th>
                        <th>consultant</th>
                        <th>Status</th>
                        <th>actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="data in consultations" :key="data.id_consultation">
                        <td>{{ new Date(data.date_consultation).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) }}</td>
                        <td>{{ data.motif_consultation || 'N/A' }}</td>
                        <td>
                            {{ (data.professionnel_info.nom || data.professionnel_info.prenoms) ?
                                (data.professionnel_info.nom || '') + ' ' + (data.professionnel_info.prenoms
                            || '') : 'N/A' }}
                        </td>
                        <td>
                            <span :class="{
                                'status pending': data.statut_consultation === 'En attente de prise des constantes' ||
                                    data.statut_consultation === 'En attente de consultation',
                                'status completed': data.statut_consultation === 'Terminée',
                                'status cancelled': data.statut_consultation === 'Annulée'

                            }">
                                {{ data.statut_consultation }}
                            </span>

                        </td>
                        <td><button class="btn" @click="openModal(data)">+details</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else>
            Aucune consultation pour ce patient
        </div>

        <!-- Consultation Detail Modal -->
        <ConsultationDetailModal
            :show="showModal"
            :consultation="selectedConsultation"
            @close="closeModal"
        />
    </div>
</template>

<style scoped>
.dossier-section {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
}

.dossier-section-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* .data-view {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.data-table th,
.data-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.data-table th {
    background-color: var(--gh-bg-color);
    font-weight: 600;
    color: var(--gh-text-color-light);
}

.data-table tbody tr:hover {
    background-color: var(--gh-hover-bg);
} */
</style>
