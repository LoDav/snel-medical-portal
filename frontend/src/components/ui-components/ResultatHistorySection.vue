<script setup>
import { ref, watch, onMounted } from 'vue';
import { getExamensByPatientId, updateExamenMedical, deleteExamenMedical, getExamenMedicalById, createExamenMedical } from '../../utils/examensMedicaux';
import { getPatientById } from '../../utils/patient';
import { getProfessionnelById } from '../../utils/professionnel';
import { scrollToSection } from './../tools';
import { getUserInfo } from '@/utils/auth';

const props = defineProps({
    patientId: {
        type: String,
        required: true
    },
    consultationId: {
        type: String,
        required: false
    }
});

const emits = defineEmits(['reload-resultats']);

const showEditSection = ref(false);
const editedResultat = ref({});
const resultatsList = ref([]);
const userData = getUserInfo();

const fetchResultats = async () => {
    try {
        const exams = await getExamensByPatientId(props.patientId);
        // Fetch patient name once
        const patient = await getPatientById(props.patientId);
        const patientName = `${patient.nom} ${patient.prenoms}`;
        // Fetch unique professionals
        const uniqueProfIds = [...new Set(exams.map(e => e.id_professionnel))];
        const profPromises = uniqueProfIds.map(id => getProfessionnelById(id));
        const profs = await Promise.all(profPromises);
        const profMap = {};
        profs.forEach(p => profMap[p.id_professionnel] = `${p.nom} ${p.prenoms}`);
        // Add names to exams
        resultatsList.value = exams.map(exam => ({
            ...exam,
            patientName,
            professionnelName: profMap[exam.id_professionnel] || 'Inconnu'
        }));
        console.log(resultatsList.value, props.patientId);
    } catch (error) {
        console.error("Erreur lors du chargement des résultats d'analyses:", error);
        resultatsList.value = [];
    }
};

const openEditForm = async (resultatId) => {
    if (resultatId) {
        try {
            const resultat = await getExamenMedicalById(resultatId);
            editedResultat.value = { ...resultat };
            showEditSection.value = true;
        } catch (error) {
            console.error("Erreur lors du chargement du résultat pour édition:", error);
            alert("Impossible de charger le résultat pour édition.");
        }
    } else {
        // Création d'un nouveau résultat
        editedResultat.value = {
            id_patient: props.patientId,
            id_consultation: props.consultationId,
            id_professionnel: userData.id_professionnel,
            type_examen: '',
            nom_examen: '',
            date_examen: new Date().toISOString().slice(0, 16),
            resultats: '',
            compte_rendu: '',
        };
        showEditSection.value = true;
    }

    setTimeout(() => {
        scrollToSection('edit-resultat-form');
    }, 100);
};

const saveResultat = async () => {
    try {
        if (editedResultat.value.id_examen) {
            if(editedResultat.value.date_examen){
                editedResultat.value.date_examen = new Date(editedResultat.value.date_examen).toISOString().slice(0, 16)
            }
            await updateExamenMedical(editedResultat.value.id_examen, editedResultat.value);
            alert('Résultat mis à jour avec succès !');
        } else {
            await createExamenMedical(editedResultat.value);
            alert('Résultat créé avec succès !');
        }
        showEditSection.value = false;
        editedResultat.value = {}; // Réinitialiser le formulaire
        emits('reload-resultats'); // Émettre l'événement pour recharger les résultats
        fetchResultats(); // Recharger la liste après modification/création
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du résultat:", error);
        alert("Erreur lors de l'enregistrement du résultat.");
    }
};

const confirmDeleteResultat = async (resultatId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce résultat ?')) {
        try {
            await deleteExamenMedical(resultatId);
            await fetchResultats()
            alert('Résultat supprimé avec succès !');
            emits('reload-resultats'); // Émettre l'événement pour recharger les résultats
        } catch (error) {
            console.error("Erreur lors de la suppression du résultat:", error);
            alert("Erreur lors de la suppression du résultat.");
        }
    }
};

const cancelEdit = () => {
    showEditSection.value = false;
    editedResultat.value = {};
};

watch( async () => props.patientId, async (newVal) => {
    if (newVal) {
        await fetchResultats();
    }
});

onMounted(async ()=>{
    await fetchResultats()
})
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Historique des Résultats d'Analyses
            <button v-if="userData.type_professionnel === 'Infirmier'" @click="openEditForm(null)" class="btn btn-primary"><i class="fa fa-plus"
                    aria-hidden="true"></i> Ajouter un résultat</button>
        </div>
        <div v-if="resultatsList.length > 0">
            <div class="data-view">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Nom d'Examen</th>
                            <th>Type d'Examen</th>
                            <th>Résultats</th>
                            <th>Professionnel</th>
                            <th  v-if="userData.type_professionnel === 'Infirmier de Laboratoire'">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="resultat in resultatsList" :key="resultat.id_examen">
                            <td>{{ new Date(resultat.date_examen).toLocaleString() }}</td>
                            <td>{{ resultat.nom_examen }}</td>
                            <td>{{ resultat.type_examen }}</td>
                            <td>{{ resultat.resultats || 'N/A' }}</td>
                            <td>{{ resultat.professionnelName }}</td>
                            <td  v-if="userData.type_professionnel === 'Infirmier de Laboratoire'">
                                <span class="d-flex-normal">
                                    <button class="btn text-primary mr-2" @click="openEditForm(resultat.id_examen)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                    <button class="btn text-danger" @click="confirmDeleteResultat(resultat.id_examen)">&times;</button>
                                </span>

                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else>
            <p>Aucun historique de résultats d'analyses pour ce patient.</p>
        </div>

        <!-- Formulaire de modification/création -->
        <div v-if="showEditSection" class="animate__animated animate__fadeIn mt-5">
            <div class="dossier-section-header mb-5">
                <h2>{{ editedResultat.id_examen ? 'Modifier le Résultat d\'Analyse' : 'Ajouter un Nouveau Résultat d\'Analyse' }}</h2>
            </div>
            <form @submit.prevent="saveResultat" id="edit-resultat-form">
                <div>
                    <div class="form-group">
                        <label for="date-examen">Date de l'Examen</label>
                        <input type="datetime-local" id="date-examen"
                            v-model="editedResultat.date_examen" required>
                    </div>

                    <div class="form-group">
                        <label for="nom-examen">Nom de l'Examen</label>
                        <input type="text" id="nom-examen" placeholder="Ex: Hémogramme"
                            v-model="editedResultat.nom_examen" required>
                    </div>

                    <div class="form-group">
                        <label for="type-examen">Type d'Examen</label>
                        <select id="type-examen" v-model="editedResultat.type_examen" required>
                            <option value="">Sélectionner</option>
                            <option value="Laboratoire">Laboratoire</option>
                            <option value="Imagerie">Imagerie</option>
                            <option value="Fonctionnel">Fonctionnel</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="resultats">Résultats</label>
                        <textarea id="resultats" rows="4"
                            placeholder="Résultats de l'examen..."
                            v-model="editedResultat.resultats"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="compte-rendu">Compte Rendu</label>
                        <textarea id="compte-rendu" rows="4"
                            placeholder="Commentaires supplémentaires..."
                            v-model="editedResultat.compte_rendu"></textarea>
                    </div>
                </div>
                <div class="text-right">
                    <button class="btn btn-primary mr-2" type="submit">Enregistrer le
                        résultat</button>
                    <button type="button" class="btn btn-secondary" @click="cancelEdit">Annuler</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.data-view {
    overflow-y: auto;
}
.data-view {
    max-height: 400px; /* Adjust as needed for all columns */
}
</style>
