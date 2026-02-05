<script setup>
import { defineProps, ref, watch, defineEmits, onMounted } from 'vue';
import { updateConstanteVitale, deleteConstanteVitale, getConstanteVitaleById, createConstanteVitale,getAllConstantesVitales, getConstantesVitalesByPatientId } from '../../utils/constantesVitales';
import { scrollToSection } from './../tools';
import { getUserInfo } from '@/utils/auth';

const props = defineProps({
    constantes: {
        type: Array,
        default: () => []
    },
    patientId: {
        type: String,
        required: false
    },
    consultationId: {
        type: String,
        required: false
    }
});

const emits = defineEmits(['reload-constantes']);

const showEditSection = ref(false);
const editedConstante = ref({});
const constantesList = ref([]);
const userData = getUserInfo();

const fetchConstantes = async () => {
    try {
        constantesList.value = await getConstantesVitalesByPatientId(props.patientId);
        console.log(constantesList.value, props.patientId);

    } catch (error) {
        console.error("Erreur lors du chargement des constantes vitales:", error);
        constantesList.value = [];
    }
};

const openEditForm = async (constanteId) => {
    if (constanteId) {
        try {
            const constante = await getConstanteVitaleById(constanteId);
            editedConstante.value = { ...constante };
            console.log(editedConstante.value.date_mesure);
            showEditSection.value = true;
        } catch (error) {
            console.error("Erreur lors du chargement de la constante pour édition:", error);
            alert("Impossible de charger la constante pour édition.");
        }
    } else {
        // Création d'une nouvelle constante
        editedConstante.value = {
            id_patient: props.patientId,
            id_consultation: props.consultationId,
            id_professionnel: userData.id_professionnel,
            temperature_celsius: null,
            tension_arterielle_systolique: null,
            tension_arterielle_diastolique: null,
            pouls_bpm: null,
            frequence_respiratoire_rpm: null,
            poids_kg: null,
            taille_cm: null,
            saturation_oxygene_pourcentage: null,
            notes: '',
        };
        showEditSection.value = true;

        if(editedConstante.value.date_mesure){
            console.log(editedConstante.value.date_mesure);
            editedConstante.value.date_mesure = new Date(editedConstante.value.date_mesure).toISOString().slice(0, 16)
        }
    }

    setTimeout(() => {
        scrollToSection('edit-constante-form');
    }, 100);
};

const saveConstante = async () => {
    try {
        if (editedConstante.value.id_constante) {
            if(editedConstante.value.date_mesure){
                editedConstante.value.date_mesure = new Date(editedConstante.value.date_mesure).toISOString().slice(0, 16)
                console.log(editedConstante.value.date_mesure);
            }
            await updateConstanteVitale(editedConstante.value.id_constante, editedConstante.value);
            alert('Constante mise à jour avec succès !');
        } else {
            await createConstanteVitale(editedConstante.value);
            alert('Constante créée avec succès !');
        }
        showEditSection.value = false;
        editedConstante.value = {}; // Réinitialiser le formulaire
        emits('reload-constantes'); // Émettre l'événement pour recharger les constantes
        fetchConstantes(); // Recharger la liste après modification/création
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la constante:", error);
        alert("Erreur lors de l'enregistrement de la constante.");
    }
};

const confirmDeleteConstante = async (constanteId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette constante ?')) {
        try {
            await deleteConstanteVitale(constanteId);
            await fetchConstantes()
            alert('Constante supprimée avec succès !');
            emits('reload-constantes'); // Émettre l'événement pour recharger les constantes
        } catch (error) {
            console.error("Erreur lors de la suppression de la constante:", error);
            alert("Erreur lors de la suppression de la constante.");
        }
    }
};

const cancelEdit = () => {
    showEditSection.value = false;
    editedConstante.value = {};
};

watch( async () => props.patientId, async (newVal) => {
    if (newVal) {
        await fetchConstantes();
    }
});

// // Watch for changes in props.constantes to potentially refresh the view if needed
// watch(() => props.constantes, (newVal) => {
//     // Si la liste des constantes devient vide après une action (ex: suppression),
//     // on peut vouloir réinitialiser le formulaire d'édition et notifier le parent.
//     if (newVal && newVal.length === 0 && showEditSection.value) {
//         showEditSection.value = false;
//         editedConstante.value = {};
//         emits('reload-constantes'); // Notifier le parent que la liste a changé
//     }
// }, { deep: true });

onMounted(async ()=>{
    await fetchConstantes()
})
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Historique des constantes
            <button v-if="userData.type_professionnel === 'Infirmier'" @click="openEditForm(null)" class="btn btn-primary"><i class="fa fa-plus"
                    aria-hidden="true"></i> Ajouter une constante</button>
        </div>
        <div v-if="constantesList.length > 0" style="max-height: 200px; overflow: auto;">
            <div class="data-view">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Température</th>
                            <th>Tension</th>
                            <th>Pouls</th>
                            <th>Fréquence Respiratoire</th>
                            <th>Poids</th>
                            <th>Taille</th>
                            <th>Saturation O2</th>
                            <th>Notes</th>
                            <th v-if="userData.type_professionnel === 'Infirmier'">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="constante in constantesList" :key="constante.id_constante">
                            <td>{{ new Date(constante.date_mesure).toLocaleString() }}</td>
                            <td>{{ constante.temperature_celsius }}</td>
                            <td>{{ constante.tension_arterielle_systolique }}/{{
                                constante.tension_arterielle_diastolique }} mmHg</td>
                            <td>{{ constante.pouls_bpm }}</td>
                            <td>{{ constante.frequence_respiratoire_rpm }}</td>
                            <td>{{ constante.poids_kg || 'N/A'}}</td>
                            <td>{{ constante.taille_cm  || 'N/A'}}</td>
                            <td>{{ constante.saturation_oxygene_pourcentage || 'N/A' }} %</td>
                            <td>{{ constante.notes  || 'N/A'}}</td>
                            <td  v-if="userData.type_professionnel === 'Infirmier'">
                                <span class="d-flex-normal">
                                    <button class="btn text-primary mr-2" @click="openEditForm(constante.id_constante)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                    <button class="btn text-danger" @click="confirmDeleteConstante(constante.id_constante)">&times;</button>
                                </span>

                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else>
            <p>Aucun historique de constantes vitales pour ce patient.</p>
        </div>

        <!-- Formulaire de modification/création -->
        <div v-if="showEditSection" class="animate__animated animate__fadeIn mt-5">
            <div class="dossier-section-header mb-5">
                <h2>{{ editedConstante.id_constante ? 'Modifier les Constantes Vitales' : 'Ajouter de Nouvelles Constantes Vitales' }}</h2>
            </div>
            <form @submit.prevent="saveConstante" id="edit-constante-form">
                <div>
                    <div style="display: flex; width: 100%;">
                        <div class="form-group mr-3 w-100">
                            <label for="temperature">Température (°C)</label>
                            <input type="number" id="temperature" placeholder="Ex: 37.2"
                                v-model="editedConstante.temperature_celsius" step="0.1" required>
                        </div>
                        <div class="form-group  mr-3 w-100">
                            <label for="poids">Poids (kg)</label>
                            <input type="number" id="poids" placeholder="Ex: 75.5"
                                v-model="editedConstante.poids_kg" step="0.1" required>
                        </div>
                        <div class="form-group w-100">
                            <label for="taille">Taille (cm)</label>
                            <input type="number" id="taille" placeholder="Ex: 175"
                                v-model="editedConstante.taille_cm" step="0.1">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="tension-sys">Tension Artérielle (mmHg)</label>
                        <div style="display:flex; gap: 1rem;">
                            <input type="number" id="tension-sys" placeholder="Systolique"
                                style="flex-grow: 1;" v-model="editedConstante.tension_arterielle_systolique"
                                required>
                            <input type="number" id="tension-dia" placeholder="Diastolique"
                                style="flex-grow: 1;"
                                v-model="editedConstante.tension_arterielle_diastolique" required>
                        </div>
                    </div>

                    <div class="d-flex-normal w-100">
                        <div class="form-group mr-3 w-100">
                            <label for="pouls">Pouls (bpm)</label>
                            <input type="number" id="pouls" placeholder="Ex: 72"
                                v-model="editedConstante.pouls_bpm" required>
                        </div>

                        <div class="form-group mr-3 w-100">
                            <label for="frequence-respiratoire">Fréquence Respiratoire (rpm)</label>
                            <input type="number" id="frequence-respiratoire" placeholder="Ex: 16"
                                v-model="editedConstante.frequence_respiratoire_rpm" required>
                        </div>

                        <div class="form-group w-100">
                            <label for="saturation-oxygene">Saturation en Oxygène (%)</label>
                            <input type="number" id="saturation-oxygene" placeholder="Ex: 98"
                                v-model="editedConstante.saturation_oxygene_pourcentage" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="allergies-notes">Informations brèves (facultatif)</label>
                        <textarea id="allergies-notes" rows="4"
                            placeholder="Ex: Allergie connue au Paracétamol."
                            v-model="editedConstante.notes"></textarea>
                    </div>
                </div>
                <div class="text-right">
                    <button class="btn btn-primary mr-2" type="submit">Enregistrer les
                        constantes</button>
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">Annuler</button>
                </div>
            </form>
        </div>
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

/* Styles pour le formulaire d'édition */
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
</style>
