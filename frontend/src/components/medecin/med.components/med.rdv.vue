<script setup>
import { ref } from 'vue';
import { getUserInfo } from '@/utils/auth';
import { createRendezVous } from '@/utils/rendezVous';

const props = defineProps({
    patient: {
        type: Object,
        required: true
    }
})
const userData = getUserInfo();

const minDate = new Date().toISOString().split('T')[0];

const rdvData = ref({
    motif_rdv: '',
    date_rdv: minDate,
    heure_debut: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5),
    heure_fin: ''
});



const loading = ref(false);

const addMinutes = (time, mins) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + mins);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).slice(0, 5);
};

const submitRendezVous = async () => {
    if (!rdvData.value.motif_rdv || !rdvData.value.date_rdv || !rdvData.value.heure_debut) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    loading.value = true;
    try {
        const payload = {
            id_patient: props.patient.id_patient,
            id_professionnel: userData.id_professionnel,
            id_centre: userData.id_centre,
            motif_rdv: rdvData.value.motif_rdv,
            date_rdv: rdvData.value.date_rdv,
            heure_debut: rdvData.value.heure_debut,
            heure_fin: rdvData.value.heure_fin || addMinutes(rdvData.value.heure_debut, 30),
            statut_rdv: 'Confirmé'
        };

        await createRendezVous(payload);
        alert('Rendez-vous créé avec succès');
        // Reset form
        rdvData.value.motif_rdv = '';
        rdvData.value.date_rdv = new Date().toISOString().split('T')[0];
    } catch (error) {
        console.error(error);
        alert('Erreur lors de la création du rendez-vous');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="medication-list-item animate__animated animate__fadeIn">
       <h4>Nouveau Rendez-vous</h4>
       
       <form @submit.prevent="submitRendezVous">
            <div class="form-group">
                <label for="motif">Motif du rendez-vous <span class="text-danger">*</span></label>
                <input type="text" id="motif" v-model="rdvData.motif_rdv" class="form-control" placeholder="Ex: Contrôle, Suivi..." required>
            </div>

            <div class="form-row">
                <div class="form-group col-md-6">
                    <label for="date">Date <span class="text-danger">*</span></label>
                    <input type="date" id="date" v-model="rdvData.date_rdv" class="form-control" :min="minDate" required>
                </div>
                <div class="form-group col-md-6">
                    <label for="heure">Heure de début <span class="text-danger">*</span></label>
                    <input type="time" id="heure" v-model="rdvData.heure_debut" class="form-control" required>
                </div>
            </div>

            <div class="text-right mt-3">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <i v-if="loading" class="fa fa-spinner fa-spin"></i>
                    <i v-else class="fa fa-calendar-plus-o"></i>
                    Planifier le rendez-vous
                </button>
            </div>
       </form>
    </div>
</template>

<style scoped>
.medication-list-item {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    background-color: var(--gh-sidebar-bg);
    margin-bottom: 20px;
}

.medication-list-item h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 10px;
    margin-bottom: 10px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    background-color: var(--gh-input-bg, #fff);
    color: var(--gh-text-color);
}

.form-row {
    display: flex;
    gap: 15px;
}

.col-md-6 {
    flex: 1;
}

/* .text-danger {
    color: #dc3545;
}

.text-right {
    text-align: right;
}

.btn {
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-primary {
    background-color: var(--gh-primary-color, #007bff);
    color: white;
}

.btn-primary:hover {
    background-color: var(--gh-primary-dark, #0069d9);
}

.btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
} */
</style>
