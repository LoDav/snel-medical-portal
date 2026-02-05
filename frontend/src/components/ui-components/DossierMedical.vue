<script setup>
/*Components dossier medical
* Affiche les informations détaillées d'un patient sélectionné
* Permet d'initialiser une consultation pour le patient
* Permet de créer un nouveau patient
* Utilise plusieurs composants enfants pour afficher différentes sections du dossier médical
* permet aussi d'afficher les ayant droit ou l'agent d'affiliation selon le type de patient
* Utilise des notifications pour informer l'utilisateur des actions réussies ou échouées
* autheur : @Ôkami alias @Necromastery
* date : 20/06/2024
*/

import { ref } from 'vue';

import { getUserInfo } from '@/utils/auth'; // Récupère les informations de l'utilisateur connecté
import { getPatientById } from '@/utils/patient' // Récupère les informations d'un patient par son ID
import { getConsultationsByPatientId, initConsultation, getConsultationsForPatientToday } from '@/utils/consultation'; // Récupère les consultations d'un patient et initialise une nouvelle consultation
import { getConstantesVitalesByPatientId } from '@/utils/constantesVitales' // Récupère les constantes vitales d'un patient par son ID
import { getAntecedentsByPatientId } from '@/utils/antecedent'; // Récupère les antécédents médicaux d'un patient par son ID
import { getAyantsByAgent, getAgentByAyantDroitId, getAyantDroitById } from '@/utils/ayantDroit' // Récupère les ayants droit d'un agent et l'agent d'affiliation d'un ayant droit
import { getAgentById } from '@/utils/agent_snel' // Récupère les informations d'un agent par son ID
import { getActesByPatient } from '@/utils/acteMedical'
import { getPrelevementsByPatientId } from '@/utils/prelevementsExamens' // Récupère les prélèvements d'examens d'un patient par son ID

import { useToast } from 'vue-toastification';
const toast = useToast();

import AntecedentSection from '../ui-components/AntecedentSection.vue'; // Composant pour afficher les antécédents médicaux
import ConstanteHistoriqueSection from '../ui-components/ConstanteHistoriqueSection.vue'; // Composant pour afficher l'historique des constantes vitales
import HistoriqueMedicalSection from '../ui-components/HistoriqueMedicalSection.vue'; // Composant pour afficher l'historique médical
import ActeMedicalSection from '../ui-components/ActeMedicalSection.vue'; // Nouveau composant pour afficher les actes médicaux
import ResultatHistorySection from '../ui-components/ResultatHistorySection.vue'; // Composant pour afficher l'historique des résultats d'analyses
import SideBar from '../ui-components/SideBar.vue'; // Composant pour la barre latérale de sélection des patients
// import IdentificationAndCreation from './old/IdentificationAndCreation.vue'; // Composant pour le formulaire de création de patient
import PatientDetails from './PatientDetails.vue'; // Nouveau composant pour afficher les détails du patient
// import TriageModal from '../ui-components/TriageModal.vue';


const userData = getUserInfo() // Récupère les informations de l'utilisateur connecté
const fadeIn = ref(false)
const patiensData = ref({})
const toggle_create_form = ref(false)


/**
 * getSiderData
 * Affiche les informations détaillées d'un patient sélectionné
 * Met à jour les constantes vitales, les antécédents, les consultations et les actes médicaux
 * @param {Object} data - Informations du patient sélectionné
 * @returns {Promise<void>}
 */
async function getSiderData(data) {
    fadeIn.value = true
    setTimeout(() => {
        fadeIn.value = false
    }, 400)

    if (data) {
        toggle_create_form.value = false
        patiensData.value = await getPatientById(data.id_patient);
        console.log(data);
    }


    if (data.type_patient === 'Agent') {
        try {
            patiensData.value.ayant_droit = await getAyantsByAgent(data.id_patient)
            patiensData.value.asAgentData = await getAgentById(data.id_patient)
        } catch (error) {
            console.log('error get ayants by agent', error);
        }
    } else if (data.type_patient === 'AyantDroit') {
        try {
            patiensData.value.agent_affiliation = await getAgentByAyantDroitId(data.id_patient)
            patiensData.value.asAyantDroitData = await getAyantDroitById(data.id_patient)
        } catch (error) {
            console.log('error get agent by ayant droit id', error);
        }

    }

    // Fetch constantes and antecedents concurrently
    await Promise.all([
        fetchConstantes(data.id_patient),
        fetchAntecedents(data.id_patient),
        getConstationTodoy(data.id_patient),
        fetchConsultations(data.id_patient),
        fetchActesMedicaux(data.id_patient),
        fetchResultats(data.id_patient)
    ]);

}

// Fetch consultations separately
async function fetchConsultations(patientId) {
    try {
        patiensData.value.consultations = await getConsultationsByPatientId(patientId);
    } catch (error) {
        console.warn("No consultations found for this patient.");
        patiensData.value.consultations = [];
    }
}

// on recupere les actes medicaux
async function fetchActesMedicaux(patientId) {
    try {
        patiensData.value.actesMedicaux = await getActesByPatient(patientId);
    } catch (error) {
        console.warn("No actes médicaux found for this patient.");
        patiensData.value.actesMedicaux = [];
    }
}

// Fetch today's consultations
async function getConstationTodoy(patientId) {
    try {
        patiensData.value.consultToDay = await getConsultationsForPatientToday(patientId)
    } catch (error) {
        console.log(error);
        console.warn("No consultations today found for this patient.");
        patiensData.value.consultToDay = [];
    }
}

// on recupere les constantes vitales
async function fetchConstantes(patientId) {
    try {
        patiensData.value.constanteVital = await getConstantesVitalesByPatientId(
            patientId
        );
    } catch (error) {
        console.warn("No constantes vitales found for this patient.");
        patiensData.value.constanteVital = [];
    }
}

// on recupere les antecedents
async function fetchAntecedents(patientId) {
    try {
        patiensData.value.antecedents = await getAntecedentsByPatientId(patientId);
    } catch (error) {
        console.warn("No antecedents found for this patient.");
        patiensData.value.antecedents = [];
    }
}

// on recupere les resultats d'analyses
async function fetchResultats(patientId) {
    try {
        patiensData.value.resultats = await getPrelevementsByPatientId(patientId);
    } catch (error) {
        console.warn("No résultats d'analyses found for this patient.");
        patiensData.value.resultats = [];
    }
}


// Fonction pour initialiser une consultation

async function onInitConsultation() {
    if (patiensData.value.consultToDay?.length > 0) {
        const confirmSendToTriage = window.confirm(
            "Le patient a déjà une consultation aujourd'hui. Envoyer au triage quand même ?"
        );

        if (confirmSendToTriage) {
            await sendPatientToTriage();
        } else {
            toast.info('Envoi au triage annulé.', {
                position: "top-center",
            }); // Display info toast
        }
    } else {
        await sendPatientToTriage();
    }
}


/* Fonction pour envoyer le patient au triage
* Crée une nouvelle consultation pour le patient
* Affiche une notification de succès ou d'erreur
* Recharge les consultations du patient
* recharge la consultation d'aujourd'hui
*/
async function sendPatientToTriage() {
    let newConsultation = {
        id_patient: patiensData.value.id_patient,
        id_centre: userData.id_centre,
    };

    try {
        await initConsultation(newConsultation);
        toast.success('Patient envoyé au triage avec succès !', {
            position: "top-center",
        }); // Use vue-toastification

        await getConstationTodoy(newConsultation.id_patient)
        await fetchConsultations(newConsultation.id_patient)

        // alert('Patient envoyé au triage avec succès !');
    } catch (error) {
        console.error(error);
        toast.error("Erreur lors de l'envoi au triage !!!", {
            position: "top-center",
        }); // Use vue-toastification
        // alert("Erreur lors de l'envoi au triage !!!");
    }
}


</script>
<template>
    <div class="main-wrapper animate__animated animate__fadeIn">

        <div class="container">

            <div class="header">
                <div>
                    <span style="font-weight: bold; font-size: large;">Dossiers Médicaux</span> <br />
                </div>


                <div v-if="userData && userData?.type_professionnel === 'Secrétaire Médical'">
                    <!-- <button
                        class="btn mr-2"
                        v-if="!toggle_create_form && JSON.stringify(patiensData) != '{}'"
                        @click="onInitConsultation">Envoyer au triage</button> -->


                    <!-- <button class="btn mr-2" v-if="!toggle_create_form && patiensData?.consultToDay && patiensData.consultToDay.length > 0"
                        @click="openTriageModal(patiensData.consultToDay[0].id_consultation, patiensData.nom + ' ' + patiensData.prenoms)">
                        Orienter Consultation
                    </button> -->
                    <button class="btn"
                        :class="{ 'btn-primary': !toggle_create_form, 'btn-danger': toggle_create_form }"
                        @click="toggle_create_form = !toggle_create_form">
                        {{ toggle_create_form ? 'Retour' : ' Identification et creation' }}
                    </button>
                </div>

            </div>

            <div class="main-content">
                <!-- la side bar -->
                <SideBar @getdata=getSiderData />

                <div style="width: 100%;" class="animate__animated animate__fadeIn scrollable"
                    v-if="toggle_create_form === false">
                    <div class="detail-panel" v-if="JSON.stringify(patiensData) != '{}'"
                        :class="{ 'animate__animated animate__fadeIn': fadeIn }">

                        <!-- debug -->
                        <!-- Affichage des données du patient -->
                        <!-- <pre>{{ userData }}</pre> -->
                        <!-- <pre> {{ patiensData }} </pre> -->
                        <!-- <pre>{{ patiensData.asAgentData }}</pre> -->

                        <PatientDetails :patientData="patiensData" @init-consultation="onInitConsultation"
                            v-if="!toggle_create_form && JSON.stringify(patiensData) != '{}'" />


                        <HistoriqueMedicalSection :consultations="patiensData.consultations" />

                        <!-- <AntecedentSection :antecedents="patiensData.antecedents" /> -->


                        <!-- <ConstanteHistoriqueSection :constantes="patiensData.constanteVital"
                            :patient-id="patiensData.id_patient" />

                        <ActeMedicalSection v-if="patiensData.consultations && patiensData.consultations.length > 0"
                            :actes="patiensData.actesMedicaux"
                            :consultationId="patiensData.consultations[0]?.id_consultation"
                            :PatientId="patiensData.id_patient" /> -->

                        <!-- <ResultatHistorySection :patient-id="patiensData.id_patient" /> -->

                    </div>

                    <div v-if="JSON.stringify(patiensData) === '{}'" style="
                            text-align: center;
                            color: var(--gh-text-color-secondary);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 50vh;
                            min-width: 100vh;
                        ">
                        <div>
                            <i class="fa fa-arrow-left" style="font-size: 2em; margin-bottom: 10px;"></i>
                            <p>Sélectionnez un patient dans la liste pour voir ses informations.</p>
                        </div>
                    </div>
                </div>

                <!-- Formulaire de création de patient -->
                <!-- <IdentificationAndCreation v-if="toggle_create_form" /> -->
            </div>
        </div>
    </div>



</template>
