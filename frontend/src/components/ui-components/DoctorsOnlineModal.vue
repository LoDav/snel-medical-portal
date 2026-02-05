<script setup>
/**
 * @file DoctorsOnlineModal.vue
 * @author David MUKOKO <@necronemesis>
 * Component qui affiche une modale contenant la liste des professionnels en ligne
 * il devra etre renomer en online-professionals-modal
 */

import { defineProps, defineEmits, ref, watch, computed } from 'vue';
import OnlineDoctorsDropdown from './OnlineDoctorsDropdown.vue';
import { getOnlineMedecins, getOnlineInfirmiers } from '../../utils/professionnel';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    professionalType: {
        type: String,
        default: 'Médecin', // Peut être 'Médecin', 'Infirmier', etc.
        validator: (value) => ['Médecin', 'Infirmier'].includes(value)
    }
});

const onlineProfessionals = ref([]);

const fetchOnlineProfessionals = async () => {
    try {
        let response;
        if (props.professionalType === 'Médecin') {
            response = await getOnlineMedecins();
        } else if (props.professionalType === 'Infirmier') {
            response = await getOnlineInfirmiers();
        } else {
            response = [];
        }
        console.log(response);
        onlineProfessionals.value = response;
    } catch (error) {
        console.error(`Erreur lors de la récupération des ${props.professionalType}s en ligne:`, error);
        onlineProfessionals.value = [];
    }
};

watch(() => props.show, (newVal) => {
    if (newVal) {
        fetchOnlineProfessionals();
    }
});

watch(() => props.professionalType, (newVal) => {
    if (props.show) {
        fetchOnlineProfessionals();
    }
});

const modalTitle = computed(() => {
    if (props.professionalType === 'Médecin') {
        return 'Médecins Connectés';
    } else if (props.professionalType === 'Infirmier') {
        return 'Infirmiers Connectés';
    }
    return 'Professionnels Connectés';
});

const emptyMessage = computed(() => {
    if (props.professionalType === 'Médecin') {
        return 'Aucun médecin en ligne pour le moment.';
    } else if (props.professionalType === 'Infirmier') {
        return 'Aucun infirmier en ligne pour le moment.';
    }
    return 'Aucun professionnel en ligne pour le moment.';
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};
</script>

<template>
    <div v-if="show" class="modal-overlay animate__animated animate__fadeIn">
        <div class="modal-content">
            <div class="modal-header">
                <h2>{{ modalTitle }}</h2>
                <button class="modal-close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body">
                <ul class="user-list">
                    <li v-for="professional in onlineProfessionals" :key="professional._id" class="user-item">
                        <img :src="professional.photo || 'https://placehold.co/40x40/0366d6/ffffff?text=PR'"
                            :alt="`Avatar de ${professional.nom} ${professional.prenom}`" class="user-avatar">
                        <div class="user-info">
                            <span class="user-name">{{ professional.nom }} {{ professional.prenom }}</span>
                            <span class="user-role">{{ professional.specialite || professional.type_professionnel }}</span>
                        </div>
                        <span class="user-status">
                            <i class="fa fa-circle status-icon"></i> En ligne
                        </span>
                    </li>
                    <li v-if="onlineProfessionals && onlineProfessionals.length === 0" class="user-item">
                        <div class="user-info">
                            <span class="user-name">{{ emptyMessage }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    /* Assurez-vous qu'il est au-dessus de tout */
}

.modal-content {
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    max-height: 80%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
}

.modal-header h2 {
    margin: 0;
    font-size: 1.2em;
    color: var(--gh-text-color);
}

.modal-close-btn {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--gh-text-color-secondary);
}

.modal-close-btn:hover {
    color: var(--gh-danger-red);
}

.modal-body {
    padding: 20px;
    flex-grow: 1;
}

/* Liste des utilisateurs */
.user-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.user-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.user-item:hover {
    background-color: var(--gh-hover-bg);
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 15px;
    flex-shrink: 0;
}

.user-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    font-size: 16px;
}

.user-role {
    font-size: 13px;
    color: #6a737d;
}

body.dark-mode .user-role {
    color: #8b949e;
}

.user-status {
    font-size: 10px;
    color: #28a745;
    /* Vert pour en ligne */
    margin-left: auto;
    /* Aligne le statut à droite */
    display: flex;
    align-items: center;
    gap: 5px;
}

.status-icon {
    font-size: 8px;
}
</style>
