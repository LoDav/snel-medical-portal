<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createPatient } from '@/utils/patient';
import { useToast } from 'vue-toastification';

const props = defineProps({
    isModal: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'created']);

const router = useRouter();
const toast = useToast();

const isLoading = ref(false);

const form = reactive({
    nom: '',
    prenoms: '',
    post_nom: '',
    date_naissance: '',
    sexe: '',
    email: '',
    telephone: '',
    adresse: '',
    groupe_sanguin: ''
});

const errors = reactive({});

const validateForm = () => {
    errors.nom = '';
    errors.sexe = '';
    errors.date_naissance = '';
    
    let isValid = true;

    if (!form.nom.trim()) {
        errors.nom = 'Le nom complet est requis';
        isValid = false;
    }

    if (!form.sexe) {
        errors.sexe = 'Le sexe est requis';
        isValid = false;
    }

    if (!form.date_naissance) {
        errors.date_naissance = 'La date de naissance est requise';
        isValid = false;
    } else {
        const dob = new Date(form.date_naissance);
        const today = new Date();
        if (dob >= today) {
            errors.date_naissance = 'La date de naissance doit être dans le passé';
            isValid = false;
        }
    }

    return isValid;
};

const resetForm = () => {
    form.nom = '';
    form.prenoms = '';
    form.post_nom = '';
    form.date_naissance = '';
    form.sexe = '';
    form.email = '';
    form.telephone = '';
    form.adresse = '';
    form.groupe_sanguin = '';
    errors.nom = '';
    errors.sexe = '';
    errors.date_naissance = '';
};

const handleSubmit = async () => {
    if (!validateForm()) {
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
    }

    isLoading.value = true;

    try {
        const patientData = {
            nom: form.nom,
            prenoms: form.prenoms || '',
            post_nom: form.post_nom || '',
            date_naissance: form.date_naissance,
            sexe: form.sexe,
            email: form.email || '',
            telephone: form.telephone || '',
            adresse: form.adresse || '',
            type_patient: 'PatientExterne',
            groupe_sanguin: form.groupe_sanguin || ''
        };

        const response = await createPatient(patientData);
        
        toast.success('Patient externe enregistré avec succès !');
        emit('created', response);
        emit('close');
        
    } catch (error) {
        console.error('Erreur lors de la création du patient:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du patient');
    } finally {
        isLoading.value = false;
    }
};

const handleClose = () => {
    emit('close');
};

onMounted(() => {
    // Set default date to today minus 18 years for adults
    const today = new Date();
    const defaultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    form.date_naissance = defaultDate.toISOString().split('T')[0];
});
</script>

<template>
    <div class="create-patient-container" :class="{ 'modal-mode': isModal }">
        <div class="create-patient-form">
            <!-- Header -->
            <div class="form-header">
                <div class="header-left">
                    <button class="btn-back" @click="handleClose">
                        <i class="fa fa-arrow-left"></i>
                    </button>
                    <h1>Enregistrement Patient Externe</h1>
                </div>
                <!-- <span class="temp-id-badge">
                    <i class="fa fa-user-clock"></i> Nouveau
                </span> -->
            </div>

            <form @submit.prevent="handleSubmit">
                <!-- Section Identité -->
                <div class="card">
                    <div class="card-header">
                        <i class="fa fa-id-card"></i> Informations Personnelles
                    </div>
                    <div class="card-body">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label for="nom">Nom *</label>
                                <input 
                                    type="text" 
                                    id="nom" 
                                    v-model="form.nom" 
                                    placeholder="Ex: Kabongo"
                                    :class="{ 'error': errors.nom }"
                                    required
                                >
                                <span v-if="errors.nom" class="error-text">{{ errors.nom }}</span>
                            </div>

                            <div class="form-group">
                                <label for="prenoms">Prénoms</label>
                                <input 
                                    type="text" 
                                    id="prenoms" 
                                    v-model="form.prenoms" 
                                    placeholder="Ex: Pierre"
                                >
                            </div>

                            <div class="form-group">
                                <label for="post_nom">Post-nom</label>
                                <input 
                                    type="text" 
                                    id="post_nom" 
                                    v-model="form.post_nom" 
                                    placeholder="Ex: kinvula"
                                >
                            </div>

                            <div class="form-group">
                                <label for="sexe">Sexe *</label>
                                <select 
                                    id="sexe" 
                                    v-model="form.sexe"
                                    :class="{ 'error': errors.sexe }"
                                    required
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                                <span v-if="errors.sexe" class="error-text">{{ errors.sexe }}</span>
                            </div>

                            <div class="form-group">
                                <label for="date_naissance">Date de Naissance *</label>
                                <input 
                                    type="date" 
                                    id="date_naissance" 
                                    v-model="form.date_naissance"
                                    :class="{ 'error': errors.date_naissance }"
                                    required
                                >
                                <span v-if="errors.date_naissance" class="error-text">{{ errors.date_naissance }}</span>
                            </div>

                            <div class="form-group">
                                <label for="email">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    v-model="form.email" 
                                    placeholder="exemple@email.com"
                                >
                            </div>

                            <div class="form-group">
                                <label for="telephone">Téléphone</label>
                                <input 
                                    type="tel" 
                                    id="telephone" 
                                    v-model="form.telephone" 
                                    placeholder="+243 ..."
                                >
                            </div>

                            <div class="form-group full-width">
                                <label for="adresse">Adresse Résidentielle</label>
                                <input 
                                    type="text" 
                                    id="adresse" 
                                    v-model="form.adresse" 
                                    placeholder="Quartier, Commune, Ville"
                                >
                            </div>

                            <div class="form-group">
                                <label for="groupe_sanguin">Groupe Sanguin</label>
                                <select 
                                    id="groupe_sanguin" 
                                    v-model="form.groupe_sanguin"
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Form Footer -->
                <div class="form-footer">
                    <button type="button" class="btn btn-cancel" @click="handleClose" :disabled="isLoading">
                        <i class="fa fa-times"></i> Annuler
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="isLoading">
                        <i v-if="isLoading" class="fa fa-spinner fa-spin"></i>
                        <i v-else class="fa fa-save"></i>
                        {{ isLoading ? 'Enregistrement...' : 'Enregistrer & Envoyer au Triage' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.create-patient-container {
    min-height: 100vh;
    background-color: var(--gh-bg-color);
}

.create-patient-container.modal-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-patient-form {
    max-width: 800px;
    margin: 0 auto;
    /* padding: 30px; */
}

/* Header Styles */
.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding: 0 5px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-left h1 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: var(--gh-text-color);
}

.btn-back {
    background: none;
    border: none;
    color: var(--gh-text-color-secondary);
    font-size: 18px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: var(--border-radius);
    transition: all 0.2s;
}

.btn-back:hover {
    background-color: var(--gh-navbar-link-hover);
    color: var(--gh-text-color);
}

.temp-id-badge {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
    background-color: var(--gh-header-bg);
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid var(--gh-border-color);
}

.temp-id-badge i {
    margin-right: 6px;
    color: var(--gh-primary-blue);
}

/* Card Styles */
.card {
    background: white;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    margin-bottom: 20px;
}

.card-header {
    padding: 15px 20px;
    background-color: #fcfcfc;
    border-bottom: 1px solid var(--gh-border-color);
    font-weight: 600;
    font-size: 14px;
    color: var(--gh-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-header i {
    color: var(--gh-primary-blue);
}

.card-body {
    padding: 25px;
}

/* Form Grid */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.full-width {
    grid-column: span 2;
}

/* Form Group */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--gh-text-color);
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 10px 12px;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    font-size: 14px;
    background-color: #fafbfc;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
    background-color: #fff;
}

.form-group input.error,
.form-group select.error {
    border-color: var(--gh-danger-red);
}

.error-text {
    font-size: 11px;
    color: var(--gh-danger-red);
    margin-top: -4px;
}

.help-text {
    font-size: 11px;
    color: var(--gh-text-color-secondary);
    margin-top: -4px;
}

textarea {
    resize: vertical;
    min-height: 60px;
}

/* Form Footer */
.form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid var(--gh-border-color);
}

/* Buttons */
.btn {
    padding: 10px 20px;
    border-radius: var(--border-radius);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid var(--gh-border-color);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-cancel {
    background: #fff;
    color: var(--gh-danger-red);
}

.btn-cancel:hover:not(:disabled) {
    background: #fff5f5;
}

.btn-primary {
    background: var(--gh-success-green);
    color: white;
    border: none;
}

.btn-primary:hover:not(:disabled) {
    filter: brightness(0.95);
}

.btn-outline {
    background: transparent;
    color: var(--gh-text-color);
    border: 1px solid var(--gh-border-color);
}

.btn-outline:hover:not(:disabled) {
    background-color: var(--gh-header-bg);
}

.full-width {
    width: 100%;
    justify-content: center;
}

/* Success Modal */
.success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-modal {
    background: white;
    padding: 40px;
    border-radius: 8px;
    text-align: center;
    max-width: 450px;
    width: 90%;
}

.success-icon {
    width: 80px;
    height: 80px;
    background: rgba(40, 167, 69, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 25px;
}

.success-icon i {
    font-size: 40px;
    color: var(--gh-success-green);
}

.success-modal h2 {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 15px;
    color: var(--gh-text-color);
}

.success-message {
    color: var(--gh-text-color-secondary);
    font-size: 14px;
    margin-bottom: 25px;
    line-height: 1.5;
}

.success-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.success-actions .btn {
    padding: 12px 20px;
}

/* Responsive */
@media (max-width: 768px) {
    .create-patient-form {
        padding: 20px;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .full-width {
        grid-column: span 1;
    }

    .form-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }

    .form-footer {
        flex-direction: column-reverse;
    }

    .form-footer .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
