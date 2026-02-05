<script setup>
import { defineProps, ref, watch, defineEmits, onMounted } from 'vue';
import { getPrelevementsByPatientId, createPrelevementExamen, updatePrelevementExamen, deletePrelevementExamen, getPrelevementExamenById } from '../../utils/prelevementsExamens';
import { scrollToSection } from './../tools';
import { getUserInfo } from '@/utils/auth';

const props = defineProps({
    patientId: {
        type: String,
        required: true
    },
    exams: {
        type: Array,
        default: () => []
    }
});


const showEditSection = ref(false);
const editedPrelevement = ref({});
const prelevementsList = ref([]);
const userData = getUserInfo();

const fetchPrelevements = async () => {
    try {
        prelevementsList.value = await getPrelevementsByPatientId(props.patientId);
        console.log(prelevementsList.value, props.patientId);
    } catch (error) {
        console.error("Erreur lors du chargement des prélèvements:", error);
        prelevementsList.value = [];
    }
};

const openEditForm = async (prelevementId) => {
    if (prelevementId) {
        try {
            const prelevement = await getPrelevementExamenById(prelevementId);
            editedPrelevement.value = { ...prelevement };
            console.log(editedPrelevement.value.date_heure_prelevement);
            if (editedPrelevement.value.date_heure_prelevement) {
                editedPrelevement.value.date_heure_prelevement = new Date(editedPrelevement.value.date_heure_prelevement).toISOString().slice(0, 16);
            }
            if (editedPrelevement.value.date_heure_reception_labo) {
                editedPrelevement.value.date_heure_reception_labo = new Date(editedPrelevement.value.date_heure_reception_labo).toISOString().slice(0, 16);
            }
            showEditSection.value = true;
        } catch (error) {
            console.error("Erreur lors du chargement du prélèvement pour édition:", error);
            alert("Impossible de charger le prélèvement pour édition.");
        }
    } else {
        // Création d'un nouveau prélèvement
        editedPrelevement.value = {
            id_patient: props.patientId,
            id_prescription_examen: '',
            id_technicien: userData.id_professionnel,
            id_centre: userData.id_centre,
            type_prelevement: '',
            site_prelevement: '',
            volume_quantite: '',
            numero_tube: '',
            date_heure_prelevement: new Date().toISOString().slice(0, 16),
            date_heure_reception_labo: '',
            conditions_conservation: '',
            transport: '',
            observations: '',
            difficultes: '',
            antiseptique_utilise: '',
            statut_prelevement: 'Réalisé'
        };
        showEditSection.value = true;
    }

    setTimeout(() => {
        scrollToSection('edit-prelevement-form');
    }, 100);
};

const savePrelevement = async () => {
    try {
        if (editedPrelevement.value.id_prelevement) {
            if (editedPrelevement.value.date_heure_prelevement) {
                editedPrelevement.value.date_heure_prelevement = new Date(editedPrelevement.value.date_heure_prelevement).toISOString().slice(0, 16)
                console.log(editedPrelevement.value.date_heure_prelevement);
            }
            if (editedPrelevement.value.date_heure_reception_labo) {
                editedPrelevement.value.date_heure_reception_labo = new Date(editedPrelevement.value.date_heure_reception_labo).toISOString().slice(0, 16)
            }
            await updatePrelevementExamen(editedPrelevement.value.id_prelevement, editedPrelevement.value);
            alert('Prélèvement mis à jour avec succès !');
        } else {
            await createPrelevementExamen(editedPrelevement.value);
            alert('Prélèvement créé avec succès !');
        }
        showEditSection.value = false;
        editedPrelevement.value = {}; // Réinitialiser le formulaire
        fetchPrelevements(); // Recharger la liste après modification/création
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du prélèvement:", error);
        alert("Erreur lors de l'enregistrement du prélèvement.");
    }
};

const confirmDeletePrelevement = async (prelevementId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce prélèvement ?')) {
        try {
            await deletePrelevementExamen(prelevementId);
            await fetchPrelevements()
            alert('Prélèvement supprimé avec succès !');
        } catch (error) {
            console.error("Erreur lors de la suppression du prélèvement:", error);
            alert("Erreur lors de la suppression du prélèvement.");
        }
    }
};

const cancelEdit = () => {
    showEditSection.value = false;
    editedPrelevement.value = {};
};

const getExamName = (id_prescription_examen) => {
    const exam = props.exams.find(e => e.id_prescription_examen === id_prescription_examen);
    return exam ? `${exam.nom_examen} (${exam.type_examen})` : 'N/A';
};

watch(async () => props.patientId, async (newVal) => {
    if (newVal) {
        await fetchPrelevements();
    }
});

onMounted(async () => {
    await fetchPrelevements()
});
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Historique des Prélèvements
            <button @click="openEditForm(null)" class="btn btn-primary"><i class="fa fa-plus"
                    aria-hidden="true"></i> Ajouter un prélèvement</button>
        </div>
        <div v-if="prelevementsList.length > 0">
            <div class="data-view">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date et Heure</th>
                            <th>Examen</th>
                            <th>Type</th>
                            <th>Site</th>
                            <th>Volume/Quantité</th>
                            <th>Numéro Tube</th>
                            <th>Conditions Conservation</th>
                            <th>Antiseptique</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="prelevement in prelevementsList" :key="prelevement.id_prelevement">
                            <td>{{ new Date(prelevement.date_heure_prelevement).toLocaleString() }}</td>
                            <td>{{ getExamName(prelevement.id_prescription_examen) }}</td>
                            <td>{{ prelevement.type_prelevement || 'N/A' }}</td>
                            <td>{{ prelevement.site_prelevement || 'N/A' }}</td>
                            <td>{{ prelevement.volume_quantite || 'N/A' }}</td>
                            <td>{{ prelevement.numero_tube || 'N/A' }}</td>
                            <td>{{ prelevement.conditions_conservation || 'N/A' }}</td>
                            <td>{{ prelevement.antiseptique_utilise || 'N/A' }}</td>
                            <td>{{ prelevement.statut_prelevement  || 'N/A'}}</td>
                            <td>
                                <span class="d-flex-normal">
                                    <button class="btn text-primary mr-2" @click="openEditForm(prelevement.id_prelevement)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                    <button class="btn text-danger" @click="confirmDeletePrelevement(prelevement.id_prelevement)">&times;</button>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else>
            <p>Aucun historique de prélèvements pour ce patient.</p>
        </div>

        <!-- Formulaire de modification/création -->
        <div v-if="showEditSection" class="animate__animated animate__fadeIn mt-5">
            <div class="dossier-section-header mb-5">
                <h2>{{ editedPrelevement.id_prelevement ? 'Modifier le Prélèvement' : 'Ajouter un Nouveau Prélèvement' }}</h2>
            </div>
            <form @submit.prevent="savePrelevement" id="edit-prelevement-form">
                <div>
                    <div class="form-group">
                        <label for="id_prescription_examen">Examen Prescrit:</label>
                        <select v-model="editedPrelevement.id_prescription_examen" required>
                            <option value="" disabled>Sélectionnez un examen</option>
                            <option v-for="exam in exams" :key="exam.id_prescription_examen" :value="exam.id_prescription_examen">
                                {{ exam.nom_examen }} ({{ exam.type_examen }})
                            </option>
                        </select>
                    </div>

                    <div class="d-flex">
                        <div class="form-group w-100 mr-3">
                            <label for="type_prelevement">Type de Prélèvement:</label>
                            <select v-model="editedPrelevement.type_prelevement" required>
                                <option value="" disabled>Sélectionnez un type</option>
                                <option value="Sang">Sang</option>
                                <option value="Urine">Urine</option>
                                <option value="Selles">Selles</option>
                                <option value="Salive">Salive</option>
                                <option value="LCR">LCR</option>
                                <option value="Ponction">Ponction</option>
                                <option value="Biopsie">Biopsie</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>

                        <div class="form-group w-100 mr-3">
                            <label for="site_prelevement">Site de Prélèvement:</label>
                            <input type="text" v-model="editedPrelevement.site_prelevement"
                                placeholder="Site anatomique">
                        </div>

                        <div class="form-group w-100">
                            <label for="volume_quantite">Volume/Quantité:</label>
                            <input type="text" v-model="editedPrelevement.volume_quantite"
                                placeholder="Volume ou quantité">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="numero_tube">Numéro de Tube:</label>
                        <input type="text" v-model="editedPrelevement.numero_tube"
                            placeholder="Numéro du tube/container">
                    </div>

                    <div class="form-group">
                        <label for="date_heure_prelevement">Date et Heure de Prélèvement:</label>
                        <input type="datetime-local" disabled v-model="editedPrelevement.date_heure_prelevement" required>
                    </div>

                    <div class="form-group">
                        <label for="date_heure_reception_labo">Date et Heure de Réception au Labo:</label>
                        <input type="datetime-local" v-model="editedPrelevement.date_heure_reception_labo">
                    </div>

                    <div class="form-group">
                        <label for="conditions_conservation">Conditions de Conservation:</label>
                        <textarea v-model="editedPrelevement.conditions_conservation"
                            placeholder="Ex: À 4°C, Congelé, Ambient"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="transport">Transport:</label>
                        <input type="text" v-model="editedPrelevement.transport"
                            placeholder="Mode de transport" >
                    </div>

                    <div class="form-group">
                        <label for="antiseptique_utilise">Antiseptique Utilisé:</label>
                        <input type="text" v-model="editedPrelevement.antiseptique_utilise"
                            placeholder="Antiseptique utilisé" required>
                    </div>

                    <div class="d-flex align-items-center">
                        <div class="form-group w-100 mr-3">
                            <label for="difficultes">Difficultés:</label>
                            <textarea v-model="editedPrelevement.difficultes"></textarea>
                        </div>

                        <div class="form-group w-100">
                            <label for="observations">Observations:</label>
                            <textarea v-model="editedPrelevement.observations"
                                placeholder="Observations supplémentaires"></textarea>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <button class="btn btn-primary mr-2" type="submit">Enregistrer le prélèvement</button>
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">Annuler</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* .dossier-section {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
} */

.animate__animated {
    animation-duration: 0.5s;
}

.animate__fadeIn {
    animation-name: fadeIn;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* .dossier-section-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.data-view {
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
}

.d-flex {
    display: flex;
    width: 100%;
}

.mr-3 {
    margin-right: 1rem !important;
}

.w-100 {
    width: 100% !important;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--gh-text-color-light);
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gh-border-color);
    border-radius: 0.25rem;
    background-color: var(--gh-input-bg);
    color: var(--gh-text-color);
    font-size: 1rem;
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.text-right {
    text-align: right;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s ease;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.d-flex-normal {
    display: flex;
}

.mr-2 {
    margin-right: 0.5rem;
}

.mt-5 {
    margin-top: 3rem !important;
}

.mb-5 {
    margin-bottom: 3rem !important;
} */
</style>