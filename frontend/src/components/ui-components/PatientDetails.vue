<script setup>
/**
 * Patient Details Component
 * ce composant permet d'afficher les détails d'un patient sélectionné.
 * Il permet aussi de supprimer le patient seulement de type PatientExterne.
 * author: @Necronemesis for SNEL S.A
 * version: 1.0.8
 * date: 2025-09-01
 */

import { defineProps, defineEmits } from 'vue';
import { getUserInfo } from '@/utils/auth';
import { deletePatient } from '@/utils/patient';


import { useToast } from 'vue-toastification';
const toast = useToast();



const props = defineProps({
    patientData: {
        type: Object,
        required: true
    }
});

// emits events
const emit = defineEmits([
    'init-consultation',
    'update-patientlistData',
    'clean-patientData'
]);

//varibale
const userData = getUserInfo();

const onDeletePatient = (patientID) => {
    console.log('delete patient');
    deletePatient(patientID).then(response => {
        console.log('Patient deleted successfully:', response);
        // You can add additional logic here, such as updating the UI or notifying the user
        emit('clean-patientData'); // Emit an event to clean the current patient data
        emit('update-patientlistData'); // Emit an event to update the patient list
        toast.success('Patient supprimé avec succès');
    }).catch(error => {
        toast.error('Erreur lors de la suppression du patient');
        console.error('Error deleting patient:', error);
        // Handle the error appropriately, such as showing an error message to the user
    });
};

/**
 * Émet un événement pour initialiser une consultation pour le patient courant.
 * L'événement est émis avec l'objet patientData en paramètre.
 */
const onInitConsultation = () => {
    /**
     * @param {Object} patientData - Objet contenant les informations du patients
     */
    emit('init-consultation', props.patientData);
};
</script>

<template>
    <div>
        <div v-if="JSON.stringify(patientData) == '{}'" class="no-selection">
            <i class="fa fa-user-o" aria-hidden="true"></i>
            <p>Aucun patient sélectionné</p>
        </div>

        <div v-else>
            <div class="dossier-section animate__animated animate__fadeIn" :key="patientData">
                <div class="dossier-section-header">
                    Informations Personnelles
                    <span>
                        <button class="btn btn-outline mr-2"
                            v-if="JSON.stringify(patientData) != '{}' && userData.type_professionnel == 'Secrétaire Médical'"
                            @click="onInitConsultation"
                            :disabled="patientData.consultToDay && patientData.consultToDay.length > 0">Envoyer au
                            triage</button>
                        <button class="btn btn-danger" v-if="patientData.type_patient === 'PatientExterne'"
                            @click="onDeletePatient(patientData.id_patient)">Supprimers</button>
                    </span>

                </div>

                <div style="display: flex; align-items:center">

                    <div class="mr-5 profile-card">
                        <div v-if="patientData?.asAgentData?.photo_identification != null">
                            <img :src="patientData?.asAgentData?.photo_identification || 'https://placehold.co/40x40/0366d6/ffffff?text=PR'"
                                alt="Photo de profil" class="avatar">
                        </div>
                        <div v-else-if="patientData?.asAyantDroitData?.photo_identification != null">
                            <img :src="patientData?.asAyantDroitData?.photo_identification || 'https://placehold.co/40x40/0366d6/ffffff?text=PR'"
                                alt="" srcset="" class="avatar">
                        </div>
                        <div v-else>
                            <img src="https://placehold.co/40x40/0366d6/ffffff?text=PR" alt="Photo de profil par défaut"
                                class="avatar">
                        </div>
                    </div>

                    <div class="ml-5">
                        <h2>
                            {{ patientData?.nom }}
                            {{ patientData?.post_nom }}
                            {{ patientData?.prenoms }}
                            <br>
                            <small class="status pending ml-1"
                                v-if="patientData?.consultToDay && patientData.consultToDay.length > 0">
                                {{ patientData.consultToDay[0]?.statut_consultation }}
                            </small>
                        </h2>

                        <span><strong>ID Patient : </strong> {{ patientData?.id_patient ?
                            patientData.id_patient.toUpperCase() :
                            'N/A'
                            }}</span>

                        <section class="" style="display: flex; width: 100%;">
                            <div class="mr-5">
                                <p v-if="patientData?.type_patient === 'Agent'">
                                    <strong>Matricule : </strong>{{
                                        patientData?.matricule_snel || patientData?.asAgentData?.matricule_snel }}
                                </p>

                                <p v-else-if="patientData?.type_patient === 'AyantDroit'">
                                    <strong>Statut : </strong> {{ patientData.asAyantDroitData?.lien_parente }}
                                </p>

                                <p>
                                    <strong>
                                        Date de naissance:
                                    </strong>
                                    {{ new Date(patientData?.date_naissance).toLocaleDateString('FR-fr', {
                                        year: 'numeric',
                                        month: 'long', day: 'numeric'
                                    }) }}
                                </p>
                                <p><strong>Sexe:</strong> {{ patientData?.sexe }}</p>
                                <p><strong>Type de patient : </strong> {{ patientData?.type_patient }}</p>
                            </div>

                            <div>
                                <p><strong>Adresse:</strong> {{ patientData?.adresse }}</p>
                                <p><strong>Téléphone:</strong> {{ patientData?.telephone || 'Non renseigner'
                                    }}</p>
                                <p><strong>Email:</strong> {{ patientData?.email || 'Non renseigner' }}</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <div class="dossier-section animate__animated animate__fadeIn"
                v-if="patientData?.ayant_droit && patientData.ayant_droit.length > 0">
                <div class="dossier-section-header">
                    Ayant droit
                </div>

                <div class="info-grid">
                    <div class="info-card d-flex" v-for="data in patientData.ayant_droit" :key="data.id_ayant">
                        <div class="">
                            <strong>Nom : </strong>{{ data.nom }} <br>
                            <strong>Post-noms :</strong> {{ data.post_nom }} <br>
                            <strong>Prenoms : </strong> {{ data.prenoms }} <br>
                            <strong>Lien :</strong> {{ data.lien_parente }}
                        </div>

                        <!-- <button class="btn btn-circle btn-outline"> <i class="fa fa-plus-circle" aria-hidden="true"></i></button> -->
                    </div>
                </div>
            </div>

            <div class="dossier-section" v-if="patientData?.agent_affiliation != null">
                <div class="dossier-section-header">
                    Agent d'affiliation
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <div class="">
                            <strong>Matricule : </strong> {{ patientData.agent_affiliation.matricule_snel }}
                            <br>
                            <strong>Nom : </strong> {{ patientData.agent_affiliation.agent_principal }} <br>
                            <strong>Entiter : </strong> {{
                                patientData.agent_affiliation.departement_snel }} <br>
                            <strong>Status :</strong> <span class="statute-active">{{
                                patientData.agent_affiliation.statut_agent }}</span>
                        </div>
                    </div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>

    </div>


</template>

<style scoped>
.no-selection {
    text-align: center;
    color: var(--gh-text-muted);
    margin-top: 50px;
}
</style>
