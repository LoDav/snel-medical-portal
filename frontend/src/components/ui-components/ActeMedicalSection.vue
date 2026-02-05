<script setup>
import { defineProps, ref, watch, defineEmits, onMounted } from 'vue';
import { updateActeMedical, deleteActeMedical, getActeMedicalById, getActesByConsultation } from '../../utils/acteMedical';
import { scrollToSection } from './../tools';

const props = defineProps({
    actes: {
        type: Array,
        default: () => []
    },
    consultationId: {
        type: String,
        required: false
    },
    PatientId: {
        type: String,
        required: false
    }
});

const emits = defineEmits(['reload-actes']);

const showEditSection = ref(false);
const editedActe = ref({});
const actesList = ref([]);

const fetchActes = async () => {
    if (props.consultationId != null) {
        try {
            actesList.value = await getActesByConsultation(props.consultationId);
        } catch (error) {
            console.error("Erreur lors du chargement des actes médicaux:", error);
            actesList.value = [];
        }
    }else{
        try {
            actesList.value = await getActeMedicalById(props.PatientId);
        } catch (error) {
            console.error("Erreur lors du chargement des actes médicaux:", error);
            actesList.value = [];
        }
    }

};

import { createActeMedical } from '../../utils/acteMedical'; // Import de la fonction createActeMedical
import { getUserInfo } from '@/utils/auth'; // Import de la fonction getUserInfo

const userData = getUserInfo();

const openEditForm = async (acteId) => {
    if (acteId) {
        try {
            const acte = await getActeMedicalById(acteId);
            editedActe.value = { ...acte };
            showEditSection.value = true;
        } catch (error) {
            console.error("Erreur lors du chargement de l'acte pour édition:", error);
            alert("Impossible de charger l'acte pour édition.");
        }
    } else {
        editedActe.value = {
            id_patient: props.PatientId, // Sera défini lors de la création
            id_consultation: props.consultationId,
            id_professionnel: userData.id_professionnel,
            nom_acte: '',
            description: '',
            code_acte: '',
            date_acte: new Date().toISOString().slice(0, 16), // Format yyyy-MM-ddThh:mm
            notes_acte: ''
        };
        showEditSection.value = true;
    }
    // Si l'acte existe déjà, assurez-vous que la date est au bon format pour l'input datetime-local
    if (editedActe.value.date_acte) {
        editedActe.value.date_acte = new Date(editedActe.value.date_acte).toISOString().slice(0, 16);
    }

    setTimeout(() => {
        scrollToSection('edit-acte-form');
    }, 100);
};

const saveActe = async () => {
    console.log("editedActe.value", editedActe.value);

    try {
        if (editedActe.value.id_acte) { // Si l'acte a un ID, c'est une mise à jour
            await updateActeMedical(editedActe.value.id_acte, editedActe.value);
            alert('Acte médical mis à jour avec succès !');
        } else { // Sinon, c'est une création
            await createActeMedical(editedActe.value);
            alert('Acte médical créé avec succès !');
        }
        showEditSection.value = false;
        editedActe.value = {}; // Réinitialiser le formulaire
        emits('reload-actes'); // Émettre l'événement pour recharger les actes
        fetchActes(); // Recharger la liste après modification/création
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'acte:", error);
        alert("Erreur lors de l'enregistrement de l'acte.");
    }
};

const confirmDeleteActe = async (acteId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet acte médical ?')) {
        try {
            await deleteActeMedical(acteId);
            alert('Acte médical supprimé avec succès !');
            emits('reload-actes'); // Émettre l'événement pour recharger les actes
            fetchActes(); // Recharger la liste après suppression
        } catch (error) {
            console.error("Erreur lors de la suppression de l'acte:", error);
            alert("Erreur lors de la suppression de l'acte.");
        }
    }
};

const cancelEdit = () => {
    showEditSection.value = false;
    editedActe.value = {};
};

onMounted(() => {
    fetchActes();
});

watch(() => props.actes, (newVal) => {
    actesList.value = newVal;
}, { deep: true });

watch(() => props.consultationId, (newVal) => {
    if (newVal) {
        fetchActes();
    }
});
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Historique des Actes Médicaux
            <button v-if="userData.type_professionnel === 'Infirmier'" @click="openEditForm(null)" class="btn btn-primary"><i class="fa fa-plus" aria-hidden="true"></i>
                Ajouter un acte</button>
        </div>
        <div v-if="actesList.length > 0">
            <div class="data-view">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Nom de l'acte</th>
                            <th>Description</th>
                            <th>Code</th>
                            <th>Notes</th>
                            <th v-if="userData.type_professionnel === 'Infirmier'">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="acte in actesList" :key="acte.id_acte">
                            <td>{{ new Date(acte.date_acte).toLocaleString() }}</td>
                            <td>{{ acte.nom_acte }}</td>
                            <td>{{ acte.description }}</td>
                            <td>{{ acte.code_acte || 'N/A' }}</td>
                            <td>{{ acte.notes_acte || 'N/A' }}</td>
                            <td v-if="userData.type_professionnel === 'Infirmier'">
                                <span class="d-flex-normal">
                                    <button class="btn text-primary mr-2" @click="openEditForm(acte.id_acte)"><i
                                            class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                    <button class="btn text-danger"
                                        @click="confirmDeleteActe(acte.id_acte)">&times;</button>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else>
            <p>Aucun acte médical enregistré pour cette consultation.</p>
        </div>

        <!-- Formulaire de création/modification -->
        <div v-if="showEditSection" class="animate__animated animate__fadeIn mt-5">
            <div class="dossier-section-header mb-5">
                <h2>{{ editedActe.id_acte ? 'Modifier l\'Acte Médical' : 'Créer un Nouvel Acte Médical' }}</h2>
            </div>
            <form @submit.prevent="saveActe" id="edit-acte-form">
                <div>
                    <div class="form-group">
                        <label for="nom_acte">Nom de l'acte</label>
                        <input type="text" id="nom_acte" v-model="editedActe.nom_acte" required>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" rows="4" v-model="editedActe.description"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="code_acte">Code de l'acte</label>
                        <input type="text" id="code_acte" v-model="editedActe.code_acte">
                    </div>
                    <div class="form-group">
                        <label for="date_acte">Date et Heure de l'acte</label>
                        <input type="datetime-local" id="date_acte" v-model="editedActe.date_acte" required>
                    </div>
                    <div class="form-group">
                        <label for="notes_acte">Notes</label>
                        <textarea id="notes_acte" rows="4" v-model="editedActe.notes_acte"></textarea>
                    </div>
                </div>
                <div class="text-right">
                    <button class="btn btn-primary mr-2" type="submit">Enregistrer l'acte</button>
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">Annuler</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped></style>
