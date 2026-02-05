<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { getUserInfo } from '@/utils/auth';
import { getTodayConsultations } from '@/utils/consultation';

const props = defineProps({
    patients: {
        type: Array,
        required: true
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['triage', 'view']);

const currentUser = computed(() => getUserInfo());
const isStaff = computed(() => {
    const role = currentUser.value?.type_professionnel || currentUser.value?.role;
    return role === 'Secrétaire Médical' || role === 'Receptionniste';
});

// Enhanced patients list with triage status
const enrichedPatients = ref([]);

const itemsPerPage = 10;
const currentPage = ref(1);

// Function to check and update triage status
const updateTriageStatus = async () => {
    try {
        const consultationsToday = await getTodayConsultations();

        // Create a map of patient ID to their consultation status
        const patientConsultationMap = new Map();
        consultationsToday.forEach(c => {
            const patientId = String(c.id_patient);
            // Store the consultation info (take the most recent if multiple)
            if (!patientConsultationMap.has(patientId)) {
                patientConsultationMap.set(patientId, {
                    statut: c.statut_consultation,
                    consultation_id: c.id_consultation
                });
            }
        });

        // Enrich patients with triage status and consultation info
        enrichedPatients.value = props.patients.map(p => {
            const patientId = String(p.id_patient);
            const consultationInfo = patientConsultationMap.get(patientId);

            return {
                ...p,
                is_in_triage: consultationInfo ? 1 : 0,
                consultation_status: consultationInfo?.statut || null
            };
        });
    } catch (error) {
        console.error('Erreur lors de la vérification du statut de triage:', error);
        // Fallback: use patients as-is
        enrichedPatients.value = props.patients.map(p => ({
            ...p,
            is_in_triage: p.is_in_triage || 0,
            consultation_status: null
        }));
    }
};

// Update triage status on mount and when patients change
onMounted(() => {
    updateTriageStatus();
});

watch(() => props.patients, () => {
    currentPage.value = 1;
    updateTriageStatus();
}, { deep: true });

const totalPages = computed(() => Math.ceil(enrichedPatients.value.length / itemsPerPage));

const paginatedPatients = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return enrichedPatients.value.slice(start, end);
});

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
};

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) { currentPage.value = page; }
};

const visiblePages = computed(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages.value, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) { start = Math.max(1, end - maxVisible + 1); }
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
});

// Generate dynamic tooltip message based on consultation status
const getTriageTooltip = (patient) => {
    if (!patient.is_in_triage) {
        return 'Envoyer au triage';
    }

    const status = patient.consultation_status;
    const statusMessages = {
        'En attente de prise des constantes': 'Déjà en attente de prise des constantes',
        'En attente de consultation': 'Déjà en attente de consultation',
        'En cours': 'Consultation en cours',
        'Terminée': 'Consultation terminée aujourd\'hui',
        'Annulée': 'Consultation annulée aujourd\'hui'
    };

    return statusMessages[status] || 'Déjà en visite aujourd\'hui';
};
</script>

<template>
    <div class="table-container">
        <div v-if="isLoading" class="loading-state">
            <i class="fa fa-spinner fa-spin"></i> Chargement des patients...
        </div>
        <div v-else>
            <table>
                <thead>
                    <tr>
                        <th>Nom Complet</th>
                        <th>ID Patient</th>
                        <th>Type</th>
                        <th>Dernière Visite</th>
                        <th>Statut Dossier</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="patient in paginatedPatients" :key="patient.id_patient">
                        <td>
                            <div class="patient-name-cell">
                                <div class="avatar-mini">
                                    <i class="fa fa-user"></i>
                                </div>
                                <b>{{ patient.nom }} {{ patient.prenoms }} {{ patient.post_nom }}</b>
                            </div>
                        </td>
                        <td>#{{ patient.id_patient }}</td>
                        <td>
                            <span class="badge"
                                :class="patient.type_patient === 'Agent' ? 'badge-agent' : 'badge-ayant-droit'">
                                {{ patient.type_patient }}
                            </span>
                        </td>
                        <td>{{ formatDate(patient.derniere_visite) }}</td>
                        <td>
                            <span class="badge badge-success">Complet</span>
                        </td>
                        <td>
                            <div class="actions">
                                <button v-if="isStaff" class="btn-icon btn-triage" :disabled="patient.is_in_triage"
                                    @click="emit('triage', patient)" :title="getTriageTooltip(patient)">
                                    <i class="fa"
                                        :class="patient.is_in_triage ? 'fa-check-circle' : 'fa-stethoscope'"></i>
                                </button>
                                <button class="btn-icon" @click="emit('view', patient)" title="Voir détails">
                                    <i class="fa fa-eye"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="patients.length === 0">
                        <td colspan="6" class="empty-state">
                            Aucun patient trouvé.
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination Controls -->
            <div v-if="patients.length > itemsPerPage" class="pagination">
                <div class="pagination-info">
                    Affichage de {{ (currentPage - 1) * itemsPerPage + 1 }} à {{ Math.min(currentPage *
                        itemsPerPage,
                        patients.length) }} sur {{ patients.length }} patients
                </div>
                <div class="pagination-buttons">
                    <button class="btn-page" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                        <i class="fa fa-chevron-left"></i>
                    </button>

                    <button v-if="visiblePages[0] > 1" class="btn-page" @click="goToPage(1)">1</button>
                    <span v-if="visiblePages[0] > 2" class="dots">...</span>

                    <button v-for="page in visiblePages" :key="page" class="btn-page"
                        :class="{ active: currentPage === page }" @click="goToPage(page)">
                        {{ page }}
                    </button>

                    <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="dots">...</span>
                    <button v-if="visiblePages[visiblePages.length - 1] < totalPages" class="btn-page"
                        @click="goToPage(totalPages)">{{ totalPages }}</button>

                    <button class="btn-page" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
                        <i class="fa fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.table-container {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    overflow: hidden;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

th {
    text-align: left;
    padding: 12px 20px;
    background: var(--gh-header-bg);
    color: var(--gh-text-color-secondary);
    font-weight: 600;
    border-bottom: 1px solid var(--gh-border-color);
}

td {
    padding: 12px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    vertical-align: middle;
    color: var(--gh-text-color);
}

tr:hover td {
    background-color: var(--gh-navbar-link-hover);
}

.patient-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-mini {
    width: 24px;
    height: 24px;
    background: var(--gh-header-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
}

.badge-agent {
    background: var(--gh-badge-agent-bg);
    color: var(--gh-badge-agent-text);
}

.badge-ayant-droit {
    background: var(--gh-badge-ayant-droit-bg);
    color: var(--gh-badge-ayant-droit-text);
}

.badge-success {
    background: var(--gh-badge-success-bg);
    color: var(--gh-badge-success-text);
}

.actions {
    display: flex;
    gap: 8px;
}

.btn-icon {
    background: none;
    border: none;
    color: var(--gh-text-color-secondary);
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    border-radius: 4px;
    transition: 0.2s;
}

.btn-icon:hover {
    background: var(--gh-navbar-link-hover);
    color: var(--gh-primary-blue);
}

.btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: var(--gh-text-color-secondary) !important;
}

.btn-icon:disabled:hover {
    background: none;
}

.btn-triage {
    color: var(--gh-success-green);
}

.btn-triage:hover {
    background: rgba(40, 167, 69, 0.1) !important;
    color: var(--gh-success-green) !important;
}

.loading-state,
.empty-state {
    padding: 40px;
    text-align: center;
    color: var(--gh-text-color-secondary);
}

.loading-state i {
    margin-right: 10px;
}

/* Pagination Styles */
.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--gh-header-bg);
    border-top: 1px solid var(--gh-border-color);
}

.pagination-info {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.pagination-buttons {
    display: flex;
    gap: 5px;
    align-items: center;
}

.btn-page {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--gh-text-color);
    background: var(--gh-bg-color);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.btn-page:hover:not(:disabled) {
    background: var(--gh-navbar-link-hover);
    border-color: var(--gh-text-color-secondary);
}

.btn-page.active {
    background: var(--gh-primary-blue);
    color: white;
    border-color: var(--gh-primary-blue);
}

.btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dots {
    color: var(--gh-text-color-secondary);
    padding: 0 4px;
}
</style>
