<script setup>
import { ref, onUnmounted, onMounted, watch } from 'vue';
import DatalistInput from '@/components/ui-components/DatalistInput.vue';

import { getOnlineMedecins } from '@/utils/professionnel'
import { updateTriageConsultation } from '@/utils/consultation';
import { getUserInfo } from '@/utils/auth';

const props = defineProps({
    id_patient: String,
    id_consultation: String,
})

const emit = defineEmits(['close']);

const userData = getUserInfo()
const medecins = ref([])
const motif_consultation = ref('')
const id_professionnel = ref('')
const selectedProfessionnelName = ref(''); // Pour afficher le nom dans le datalist
const statut_consultation = ref('En attente de consultation') // Set default value
const heure_consultation = ref(getCurrentTime())
const id_centre = ref(userData.id_centre) //récupere le code du centre
const degre_urgence = ref(null)
const noMedecinAvailable = ref(false); // Nouvelle variable pour l'état de disponibilité

// Surveiller les changements de id_professionnel pour mettre à jour selectedProfessionnelName
watch(id_professionnel, (newId) => {
    const selected = medecins.value.find(m => m.id === newId);
    selectedProfessionnelName.value = selected ? selected.name : '';
});

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

async function getMedecin() {
    try {
        const fetchedMedecins = await getOnlineMedecins();
        medecins.value = fetchedMedecins.map(m => ({
            id: m.id_professionnel,
            name: `${m.nom} ${m.prenoms} (${m.specialite})`
        }));
        noMedecinAvailable.value = medecins.value.length === 0; // Mettre à jour l'état
        console.log(medecins.value);

    } catch (error) {
        console.log(error)
        noMedecinAvailable.value = true; // En cas d'erreur, considérer qu'aucun médecin n'est disponible
    }
}

const handleProfessionnelSelect = (date) => {
    id_professionnel.value = date.id;
};

const handleSubmit = async () => {
    if (!degre_urgence.value) {
        alert('Veuillez sélectionner un degré d\'urgence.');
        return;
    }
    const triageData = {
        id_patient: props.id_patient,
        id_consultation: props.id_consultation,
        // motif_consultation: motif_consultation.value,
        id_professionnel: id_professionnel.value,
        statut_consultation: "En attente de consultation",
        heure_consultation: heure_consultation.value,
        id_centre: userData.id_centre,
        degre_urgence: degre_urgence.value // Envoie null si non sélectionné
    };
    console.log(triageData)

    try {
        await updateTriageConsultation(props.id_consultation, triageData)
        alert('effectuer avec success')
        closeModal()
    } catch (error) {
        alert("errur d'envoi")
    }

    // emit('submit', triageData);
}

function closeModal() {
    emit('close');
}

onMounted(() => {
    getMedecin()
})
</script>

<template>
    <div class="modal-overlay animate__animated animate__fadeIn" :class="{ 'active': true }">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Orienter vers le Médecin</h2>
                <button class="modal-close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body">
                <form @submit.prevent="handleSubmit">
                    <div class="form-group">
                        <label for="id_patient">ID Patient:</label>
                        <input type="text" id="id_patient" :value="id_patient" readonly>
                    </div>

                    <div class="form-group">
                        <label for="id_professionnel">Professionnel de Santé (en ligne):</label>
                        <DatalistInput id="id_professionnel" :options="medecins" v-model="selectedProfessionnelName"
                            @select="handleProfessionnelSelect" placeholder="Sélectionner un professionnel" required
                            :disabled="noMedecinAvailable" />
                        <p v-if="noMedecinAvailable" class="error-message">Aucun médecin en ligne disponible.</p>
                    </div>

                    <div class="form-group">
                        <label for="degre_urgence">Degré d'urgence:</label>
                        <select id="degre_urgence" v-model="degre_urgence" required>
                            <option :value="null" disabled hidden>Sélectionner le degré d'urgence</option>
                            <option value="Normal">Normal</option>
                            <option value="Urgent">Urgent</option>
                            <!-- <option value="Très urgent">Très urgent</option>
                            <option value="Critique">Critique</option> -->
                        </select>
                    </div>

                    <!-- <div class="form-group">
                        <label for="motif_consultation">Motif de consultation:</label>
                        <textarea name="motif_consultation" id="motif_consultation" placeholder=""
                            v-model="motif_consultation" required></textarea>
                    </div> -->

                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" @click="closeModal">Annuler</button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="noMedecinAvailable">Initialiser</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.error-message {
    color: red;
    font-size: 0.9em;
    margin-top: 5px;
}
</style>
