<script setup>
import { ref } from 'vue';
import { createPatient } from '@/utils/patient';
import { useToast } from 'vue-toastification';

const toast = useToast();

const emit = defineEmits([
    'update-patientlistData'
])

const newPatient = ref({
    id_patient: null, // Sera généré par la base de données
    id_agent_snel: '',
    id_ayant_droit: '',
    nom: '',
    post_nom: '',
    prenoms: '',
    date_naissance: '', // Format YYYY-MM-DD
    sexe: 'M', // Valeur par défaut, ou ''
    adresse: '',
    telephone: '',
    email: '',
    type_patient: 'PatientExterne', // Le type est fixe pour ce formulaire
    groupe_sanguin: '',
    photo_identification: '',
});

async function savePatient() {
    try {
        const patientData = {
            id_patient: newPatient.value.id_patient,
            nom: newPatient.value.nom,
            prenoms: newPatient.value.prenoms,
            post_nom: newPatient.value.post_nom,
            date_naissance: newPatient.value.date_naissance, // La date est déjà au bon format
            sexe: newPatient.value.sexe,
            telephone: newPatient.value.telephone,
            email: newPatient.value.email,
            adresse: newPatient.value.adresse,
            type_patient: 'PatientExterne',
            id_agent_snel: newPatient.value.id_agent_snel,
            id_ayant_droit: newPatient.value.id_ayant_droit,
        };

        await createPatient(patientData);
        toast.success("Patient enregistré avec succès !");
        emit('update-patientlistData')

        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');

    } catch (error) {
        console.error("Erreur lors de l'enregistrement du patient:", error);
        toast.error("Erreur lors de l'enregistrement du patient.");
    }
}
</script>

<template>
    <div class="dossier-section animate__animated animate__fadeIn">
        <div class="dossier-section-header">
            <h2>Création du Patient Externe</h2>
        </div>
        <form action="" @submit.prevent="savePatient">
            <div class="form-group">
                <label for="nom-patient">Nom</label>
                <input id="nom-patient" type="text" v-model="newPatient.nom" placeholder="Nom" required>
            </div>
            <div class="form-group">
                <label for="post-nom-patient">Post Nom</label>
                <input id="post-nom-patient" type="text" v-model="newPatient.post_nom" placeholder="Post Nom" required>
            </div>
            <div class="form-group">
                <label for="prenoms-patient">Prénoms</label>
                <input id="prenoms-patient" type="text" v-model="newPatient.prenoms" placeholder="Prénoms" required>
            </div>
            <div class="form-group">
                <label for="date-naissance-patient">Date de Naissance</label>
                <input 
                    id="date-naissance-patient" 
                    type="date" 
                    v-model="newPatient.date_naissance"
                    :max="new Date().toISOString().split('T')[0]"
                    required
                >
            </div>
            <div class="form-group">
                <label for="sexe-patient">Sexe</label>
                <select id="sexe-patient" v-model="newPatient.sexe" required>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                </select>
            </div>
            <div class="form-group">
                <label for="telephone-patient">Numéro de Téléphone</label>
                <input id="telephone-patient" type="text" v-model="newPatient.telephone" 
                    placeholder="Numéro de Téléphone" required>
            </div>
            <div class="form-group">
                <label for="email-patient">Email</label>
                <input id="email-patient" type="email" v-model="newPatient.email" placeholder="Email">
            </div>
            <div class="form-group">
                <label for="adresse-patient">Adresse</label>
                <textarea id="adresse-patient" v-model="newPatient.adresse" placeholder="address"></textarea>
            </div>
            <div class="text-right">
                <button class="btn btn-outline" type="submit">Enregistrer</button>
            </div>
        </form>
    </div>
</template>