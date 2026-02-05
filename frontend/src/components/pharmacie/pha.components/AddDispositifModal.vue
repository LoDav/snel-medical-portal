<template>
    <div v-if="show" class="lot-modal" @click="closeModal">
        <div class="modal-content" @click.stop>
            <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                {{ modalTitle }}
            </h3>
            <form @submit="handleSubmit" style="display: flex; flex-direction: column; gap: 1rem;">

                <div class="form-group">
                    <label for="nom_dispositif" class="form-label">Nom du Dispositif *</label>
                    <input type="text" id="nom_dispositif" v-model="formData.nom_dispositif" required class="app-input">
                </div>

                <div class="form-group">
                    <label for="categorie" class="form-label">Catégorie *</label>
                    <select id="categorie" v-model="formData.categorie" required class="app-input">
                        <option value="">Sélectionner une catégorie</option>
                        <option value="Équipement médical">Équipement médical</option>
                        <option value="Suture">Suture</option>
                        <option value="Protection">Protection</option>
                        <option value="Pansements">Pansements</option>
                        <option value="Instruments">Instruments</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="reference_fabricant" class="form-label">Référence Fabricant</label>
                    <input type="text" id="reference_fabricant" v-model="formData.reference_fabricant" class="app-input">
                </div>

                <div class="form-group">
                    <label for="unite_vente" class="form-label">Unité de Vente *</label>
                    <select id="unite_vente" v-model="formData.unite_vente" required class="app-input">
                        <option value="boîte">Boîte</option>
                        <option value="pièce">Pièce</option>
                        <option value="rouleau">Rouleau</option>
                        <option value="unité">Unité</option>
                        <option value="paquet">Paquet</option>
                        <option value="flacon">Flacon</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="description" class="form-label">Description</label>
                    <textarea id="description" v-model="formData.description" class="app-input" rows="3"></textarea>
                </div>

                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i class="fa fa-save"></i> {{ loading ? 'Enregistrement...' : (props.dispositif ? 'Modifier' : 'Enregistrer') }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { createDispositifMedical, updateDispositifMedical } from '@/utils/dispositifsMedicaux';

const emit = defineEmits(['close', 'dispositif-added']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    dispositif: {
        type: Object,
        default: null
    }
});

const loading = ref(false);

const formData = ref({
    nom_dispositif: '',
    categorie: '',
    reference_fabricant: '',
    unite_vente: 'unité',
    description: ''
});

const modalTitle = ref('Ajouter un Nouveau Dispositif Médical');

const resetForm = () => {
    formData.value = {
        nom_dispositif: '',
        categorie: '',
        reference_fabricant: '',
        unite_vente: 'unité',
        description: ''
    };
};

// Watch for changes in props.dispositif to populate form
watch(() => props.dispositif, (newDispositif) => {
    if (newDispositif) {
        // Editing mode
        modalTitle.value = 'Modifier le Dispositif Médical';
        formData.value = {
            nom_dispositif: newDispositif.nom_dispositif || '',
            categorie: newDispositif.categorie || '',
            reference_fabricant: newDispositif.reference_fabricant || '',
            unite_vente: newDispositif.unite_vente || 'unité',
            description: newDispositif.description || ''
        };
    } else {
        // Adding mode
        modalTitle.value = 'Ajouter un Nouveau Dispositif Médical';
        resetForm();
    }
}, { immediate: true });

const closeModal = () => {
    resetForm();
    emit('close');
};

const handleSubmit = async (e) => {
    e.preventDefault();
    loading.value = true;
    console.log(formData.value);

    try {
        let resultDispositif;
        if (props.dispositif) {
            // Modifier le dispositif existant
            resultDispositif = await updateDispositifMedical(props.dispositif.id_dispositif, formData.value);
        } else {
            // Créer le nouveau dispositif
            resultDispositif = await createDispositifMedical(formData.value);
        }
        emit('dispositif-added', resultDispositif);
        closeModal();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du dispositif:', error);
        alert('Erreur lors de la sauvegarde du dispositif. Veuillez réessayer.');
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