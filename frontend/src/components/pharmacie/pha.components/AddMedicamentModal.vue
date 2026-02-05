<template>
    <div v-if="show" class="lot-modal" @click="closeModal">
        <div class="modal-content" @click.stop>
            <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                {{ modalTitle }}
            </h3>
            <form @submit="handleSubmit" style="display: flex; flex-direction: column; gap: 1rem;">

                <div class="d-flex">
                    <div class="form-group">
                        <label for="nom_commercial" class="form-label">Nom Commercial *</label>
                        <input type="text" id="nom_commercial" v-model="formData.nom_commercial" required class="app-input">
                    </div>

                    <div class="form-group">
                        <label for="nom_generique" class="form-label">Nom Générique *</label>
                        <input type="text" id="nom_generique" v-model="formData.nom_generique" required class="app-input">
                    </div>
                </div>

                <div class="form-group">
                    <label for="forme_pharmaceutique" class="form-label">Forme Pharmaceutique *</label>
                    <select id="forme_pharmaceutique" v-model="formData.forme_pharmaceutique" required class="app-input">
                        <option value="">Sélectionner une forme</option>
                        <option value="Comprimé">Comprimé</option>
                        <option value="Gélule">Gélule</option>
                        <option value="Sirop">Sirop</option>
                        <option value="Injection">Injection</option>
                        <option value="Crème">Crème</option>
                        <option value="Pommade">Pommade</option>
                        <option value="Suppositoire">Suppositoire</option>
                        <option value="Solution">Solution</option>
                        <option value="Goutte">Goutte</option>
                        <option value="Poudre">Poudre</option>
                        <option value="Comprimé effervescent">Comprimé effervescent</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="dosage" class="form-label">Dosage *</label>
                    <input type="text" id="dosage" v-model="formData.dosage" required class="app-input" placeholder="ex: 500mg, 10ml, etc.">
                </div>

                <div class="d-flex-normal">
                    <div class="form-group w-100 mr-3">
                        <label for="prix_unitaire_indicatif" class="form-label">Prix Unitaire (FC)</label>
                        <input type="number" id="prix_unitaire_indicatif" v-model.number="formData.prix_unitaire_indicatif" min="0" step="0.01" class="app-input">
                    </div>

                    <div class="form-group w-100">
                        <label for="unite_vente" class="form-label">Unité de Vente *</label>
                        <select id="unite_vente" v-model="formData.unite_vente" required class="app-input">
                            <option v-for="option in uniteVenteOptions" :key="option" :value="option">
                                {{ option }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="id_categorie" class="form-label">Catégorie</label>
                    <select id="id_categorie" v-model="formData.id_categorie" class="app-input">
                        <option value="">Sélectionner une catégorie</option>
                        <option v-for="category in categories" :key="category.id_categorie" :value="category.id_categorie">
                            {{ category.nom_categorie }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="description" class="form-label">Description</label>
                    <textarea id="description" v-model="formData.description" class="app-input" rows="3"></textarea>
                </div>

                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i class="fa fa-save"></i> {{ loading ? 'Enregistrement...' : (props.medicament ? 'Modifier' : 'Enregistrer') }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { createMedicament, updateMedicament } from '@/utils/medicament';
import { getAllMedicamentCategories } from '@/utils/medicamentCategories';

const emit = defineEmits(['close', 'medicament-added']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    medicament: {
        type: Object,
        default: null
    }
});

const loading = ref(false);

const categories = ref([]);

const uniteVenteOptions = [
    'Comprimé',
    'Plaquette',
    'Flacon',
    'Tube',
    'Sachet',
    'Unité Injectable',
    'Patch',
    'Ampoule',
    'Suppositoire',
    'Piece',
    'Boîte.',
    'Autre'
];

const formData = ref({
    nom_commercial: '',
    nom_generique: '',
    forme_pharmaceutique: '',
    dosage: '',
    prix_unitaire_indicatif: 0,
    description: '',
    id_categorie: null,
    unite_vente: 'Plaquette'
});

const modalTitle = ref('Ajouter un Nouveau Médicament');

const resetForm = () => {
    formData.value = {
        nom_commercial: '',
        nom_generique: '',
        forme_pharmaceutique: '',
        dosage: '',
        prix_unitaire_indicatif: 0,
        description: '',
        id_categorie: null,
        unite_vente: 'Plaquette'
    };
};

// Watch for changes in props.medicament to populate form
watch(() => props.medicament, (newMedicament) => {
    if (newMedicament) {
        // Editing mode
        modalTitle.value = 'Modifier le Médicament';
        formData.value = {
            nom_commercial: newMedicament.nom_commercial || '',
            nom_generique: newMedicament.nom_generique || '',
            forme_pharmaceutique: newMedicament.forme_pharmaceutique || '',
            dosage: newMedicament.dosage || '',
            prix_unitaire_indicatif: newMedicament.prix_unitaire_indicatif || 0,
            description: newMedicament.description || '',
            id_categorie: newMedicament.id_categorie || null,
            unite_vente: newMedicament.unite_vente || 'Plaquette'
        };
    } else {
        // Adding mode
        modalTitle.value = 'Ajouter un Nouveau Médicament';
        resetForm();
    }
}, { immediate: true });

const closeModal = () => {
    resetForm();
    emit('close');
};

onMounted(async () => {
    try {
        categories.value = await getAllMedicamentCategories();
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
});

const handleSubmit = async (e) => {
    e.preventDefault();
    loading.value = true;
    console.log(formData.value);

    try {
        let resultMedicament;
        if (props.medicament) {
            // Modifier le médicament existant
            resultMedicament = await updateMedicament(props.medicament.id_medicament, formData.value);
        } else {
            // Créer le nouveau médicament
            resultMedicament = await createMedicament(formData.value);
        }
        emit('medicament-added', resultMedicament);
        closeModal();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du médicament:', error);
        alert('Erreur lors de la sauvegarde du médicament. Veuillez réessayer.');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Modal styles spécifiques */
.lot-modal {
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
    width: 90%;
    max-width: 400px;
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
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 5px;
    margin-top: 1.5rem;
}

.app-input {
    padding: 8px 12px;
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    background-color: var(--gh-input-bg);
    color: var(--gh-text-color);
    font-size: 14px;
}

.app-input:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
}

textarea.app-input {
    resize: vertical;
    min-height: 80px;
}
</style>
