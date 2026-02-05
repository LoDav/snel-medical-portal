<template>
    <div v-if="show" class="dispensation-modal animate__animated animate__fadeIn" @click="closeModal">
        <div class="modal-content" @click.stop>
            <span @click="closeModal" class="close"><i class="fa fa-times"></i></span>
            <h3 class="detail-subtitle" style="margin-top: 0;">
                Dispenser {{ medicamentName }}
            </h3>

            <div v-if="!hasAvailableStock" class="no-stock-message" style="text-align: center; padding: 20px; background-color: var(--gh-header-bg); border-radius: 6px; margin-bottom: 20px;">
                <i class="fa fa-exclamation-triangle" style="font-size: 2rem; color: var(--gh-danger-red); margin-bottom: 10px;"></i>
                <h4 style="margin: 0 0 10px 0; color: var(--gh-danger-red);">Aucun stock disponible</h4>
                <p style="margin: 0; color: var(--gh-text-color-secondary);">Il n'y a actuellement aucun lot disponible pour ce médicament.</p>
            </div>

            <form v-else @submit="handleSubmit" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                    <label for="lot-select" class="form-label">Sélectionner un Lot *</label>
                    <select id="lot-select" v-model="formData.numero_lot_delivre" required class="app-input">
                        <option value="">Choisir un lot...</option>
                        <option v-for="lot in availableLots" :key="lot.id_stock_medicament" :value="lot.numero_lot">
                            Lot {{ lot.numero_lot }} - {{ lot.quantite_actuelle }} unités restantes
                            (Exp: {{ formatDate(lot.date_peremption) }})
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="quantite_delivree" class="form-label">Quantité à délivrer *</label>
                    <input
                        type="number"
                        id="quantite_delivree"
                        v-model.number="formData.quantite_delivree"
                        required
                        class="app-input"
                        :min="1"
                        :max="selectedLot?.quantite_actuelle || 0"
                        placeholder="Quantité à délivrer"
                    >
                    <small v-if="selectedLot" class="form-hint">
                        Maximum disponible: {{ selectedLot.quantite_actuelle }} unités
                    </small>
                </div>

                <div class="form-group">
                    <label for="notes_dispensation" class="form-label">Notes (optionnel)</label>
                    <textarea
                        id="notes_dispensation"
                        v-model="formData.notes_dispensation"
                        class="app-input"
                        rows="3"
                        placeholder="Notes sur la dispensation..."
                    ></textarea>
                </div>

                <div class="form-summary" style="background-color: var(--gh-header-bg); padding: 15px; border-radius: 6px; margin-top: 10px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px;">Résumé de la dispensation</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                        <div><strong>Patient:</strong> {{ patientName }}</div>
                        <div><strong>Médicament:</strong> {{ medicamentName }}</div>
                        <div><strong>Dispensateur:</strong> {{ userInfo?.prenoms }} {{ userInfo?.nom }}</div>
                        <div><strong>Date:</strong> {{ formatDate(new Date()) }}</div>
                        <div v-if="selectedLot"><strong>Lot sélectionné:</strong> {{ selectedLot.numero_lot }}</div>
                        <div><strong>Quantité:</strong> {{ formData.quantite_delivree || 0 }} unités</div>
                    </div>
                </div>

                <button type="submit" class="btn btn-success" :disabled="loading || !selectedLot || !formData.quantite_delivree">
                    <i class="fa fa-check"></i> {{ loading ? 'Dispensation en cours...' : 'Dispenser le médicament' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { createDispensation } from '@/utils/dispensation';
import { getStockWithMedicamentById } from '@/utils/stockMedicament';
import { getUserInfo } from '@/utils/auth';

const emit = defineEmits(['close', 'dispensation-created']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    medicament: {
        type: Object,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    lignePrescriptionId: {
        type: String,
        required: true,
        default: ''
    },
    quantite:{
        type:Number,
        required:true
    }
});

const loading = ref(false);
const availableLots = ref([]);
const userInfo = ref(null);

const formData = ref({
    id_ligne_prescription: '',
    id_medicament: '',
    id_patient: '',
    id_professionnel_dispensateur: '',
    id_centre: '',
    quantite_delivree: 0,
    date_dispensation: '',
    numero_lot_delivre: '',
    notes_dispensation: ''
});

const selectedLot = computed(() => {
    return availableLots.value.find(lot => lot.numero_lot === formData.value.numero_lot_delivre);
});

const medicamentName = computed(() => {
    return props.medicament?.name || 'Médicament';
});

const closeModal = () => {
    resetForm();
    emit('close');
};

const resetForm = () => {
    formData.value = {
        id_ligne_prescription: '',
        id_medicament: '',
        id_patient: '',
        id_professionnel_dispensateur: '',
        id_centre: '',
        quantite_delivree: 0,
        date_dispensation: '',
        numero_lot_delivre: '',
        notes_dispensation: ''
    };
    availableLots.value = [];
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
};

const loadAvailableLots = async () => {
    try {
        const stocks = await getStockWithMedicamentById(props.medicament.id_medicament_reference || props.medicament.id_medicament);
        console.log('Stocks récupérés:', stocks);

        // Filtrer les lots avec quantité > 0 et non expirés
        availableLots.value = stocks.filter(stock =>
            stock.quantite_actuelle > 0 &&
            new Date(stock.date_peremption) > new Date()
        );
        console.log(availableLots.value);
        

        console.log('Lots disponibles:', availableLots.value);
    } catch (error) {
        console.error('Erreur lors du chargement des lots:', error);
        availableLots.value = [];
    }
};

const hasAvailableStock = computed(() => {
    return availableLots.value.length > 0;
});

const loadUserInfo = async () => {
    try {
        userInfo.value = await getUserInfo();
    } catch (error) {
        console.error('Erreur lors du chargement des informations utilisateur:', error);
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLot.value || !formData.value.quantite_delivree) {
        alert('Veuillez sélectionner un lot et saisir une quantité.');
        return;
    }

    if (formData.value.quantite_delivree > selectedLot.value.quantite_actuelle) {
        alert('La quantité demandée dépasse la quantité disponible dans ce lot.');
        return;
    }

    loading.value = true;

    try {
        const dispensationData = {
            id_ligne_prescription: props.lignePrescriptionId,
            id_medicament: props.medicament.id_medicament_reference || props.medicament.id_medicament,
            id_patient: props.patientId,
            id_professionnel_dispensateur: userInfo.value?.id_professionnel,
            id_centre: userInfo.value?.id_centre || 'centre-default', // À adapter selon la structure
            quantite_delivree: formData.value.quantite_delivree,
            date_dispensation: new Date().toISOString().split('T')[0], // Format yyyy-mm-dd
            numero_lot_delivre: formData.value.numero_lot_delivre,
            notes_dispensation: formData.value.notes_dispensation || null,
            id_stock_produit: availableLots.value.find(lot => lot.numero_lot === formData.value.numero_lot_delivre)?.id_stock || null,
        };
        console.log('Données de dispensation à envoyer:', dispensationData);

        const result = await createDispensation(dispensationData);
        emit('dispensation-created', result);
        closeModal();

    } catch (error) {
        console.error('Erreur lors de la création de la dispensation:', error);
        alert('Erreur lors de la dispensation. Veuillez réessayer.');
    } finally {
        loading.value = false;
    }
};

// Watchers
watch(() => props.show, async (newShow) => {
    if (newShow) {
        await loadUserInfo();
        await loadAvailableLots();
    }
});

watch(() => props.medicament, () => {
    if (props.show) {
        loadAvailableLots();
    }
}, { deep: true });


watch(()=> formData.value.numero_lot_delivre, ()=>{
    if(selectedLot.value.quantite_actuelle > props.quantite){
        formData.value.quantite_delivree = props.quantite
    }else{
        formData.value.quantite_delivree = selectedLot.value.quantite_actuelle
    }
},{ deep: true })


onMounted(async () => {
    if (props.show) {
        await loadUserInfo();
        await loadAvailableLots();
        // formData.value.quantite_delivree = props.quantite
    }
});
</script>

<style scoped>
/* Modal styles */
.dispensation-modal {
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
    max-width: 500px;
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
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
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

.form-hint {
    color: var(--gh-text-color-secondary);
    font-size: 12px;
    margin-top: 4px;
}

.form-group {
    margin-bottom: 15px;
}

.form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--gh-text-color);
}
</style>