<script setup>
import { defineProps, defineEmits, ref, defineExpose } from 'vue';
import { createPatient, getPatientsToday } from '@/utils/patient';
import { getConsultationsForPatientToday } from '@/utils/consultation';
import { getUserInfo } from '@/utils/auth';
import { getAgentAndAyantsByMatricule } from '@/utils/agent_snel';
import { useToast } from 'vue-toastification';

const toast = useToast();
const userInfo = getUserInfo();

// const props = defineProps({
//     matriculeSnel: String,
// });

const emit = defineEmits([
    'init-Consultation',
    'update-patientlistData'
]);



const agentFoundData = ref(null);
const MatriculeBackup = ref('');// pour sauvegarder le matricule recherché
const matriculeSnel = ref(''); // pour lier avec le champ de recherche

const newPatient = ref({
    id_patient: '',
    id_agent_snel: null,
    id_ayant_droit: null,
    type_patient: '',
    groupe_sanguin: '',
    nom: '',
    post_nom: '',
    prenoms: '',
    date_naissance: null,
    sexe: '',
    telephone: '',
    email: '',
    adresse: '',
    photo_identification: '',
});

// Fonction pour créer un patient qui est un ayant droit
async function createAsAyantDroit(data) {
    if(parseInt(new Date().getFullYear()) - parseInt(data.date_naissance.substring(0, 4)) > 18 && data.lien_parente === "Enfant"){
        if(!confirm('la patient est majeur, voulez-vous vraiment créer un patient ayant droit ?')) return
    }
    try {
        newPatient.value.id_patient = data.id_ayant_droit
        newPatient.value.id_ayant_droit = data.id_ayant_droit
        newPatient.value.type_patient = 'AyantDroit'
        newPatient.value.nom = data.nom
        newPatient.value.post_nom = data.post_nom
        newPatient.value.prenoms = data.prenoms
        newPatient.value.date_naissance = data.date_naissance
        newPatient.value.sexe = data.sexe
        newPatient.value.telephone = data.telephone
        newPatient.value.email = data.email
        newPatient.value.adresse = data.adresse
        newPatient.value.photo_identification = data.photo_identification

        console.table(newPatient.value);

        await createPatient(newPatient.value);
        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');

        toast.success("Patient enregistré avec succès !", {
            position: "top-center",
        });

        searchAgent(MatriculeBackup.value)
        emit('update-patientlistData')

    } catch (error) {
        console.error("Erreur lors de la création du patient ayant droit:", error);
        toast.error("Erreur lors de la création du patient ayant droit.", {
            position: "top-center",
        });
    }
}

// Fonction pour créer un patient qui est un agent SNEL
async function createAsAgentSnel(agentData) {
    try {
        newPatient.value.id_patient = agentData.id_agent_snel
        newPatient.value.id_agent_snel = agentData.id_agent_snel
        newPatient.value.type_patient = 'Agent';
        newPatient.value.matricule_snel = agentData.matricule_snel;
        newPatient.value.nom = agentData.agent_nom;
        newPatient.value.post_nom = agentData.agent_post_nom;
        newPatient.value.prenoms = agentData.agent_prenoms;

        newPatient.value.date_naissance = new Date(agentData.agent_date_naissance).toISOString().split('T')[0];

        newPatient.value.sexe = agentData.agent_sexe;
        newPatient.value.telephone = agentData.agent_telephone;
        newPatient.value.email = agentData.agent_email;
        newPatient.value.adresse = agentData.agent_adresse;
        newPatient.value.photo_identification = agentData.photo_identification

        console.table(newPatient.value);

        await createPatient(newPatient.value);
        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');

        toast.success("Patient enregistré avec succès !", {
            position: "top-center",
        });

        searchAgent(MatriculeBackup.value)
        emit('update-patientlistData')

    } catch (error) {
        console.error("Erreur lors de la création du patient agent SNEL:", error);
        toast.error("Erreur lors de la création du patient agent SNEL.", {
            position: "top-center",
        });
    }
}

async function searchAgent(matricule) {
    if (matricule === '') {
        // emit('update:agentFoundData', null);
        toast.info('veuillez saisir un matricule', { position: "top-center" });
        return
    }

    try {
        const response = await getAgentAndAyantsByMatricule(matricule);
        // emit('update:agentFoundData', response);
        agentFoundData.value = response;
        MatriculeBackup.value = matricule; // sauvegarde du matricule
        matriculeSnel.value = ''; // reset le champ de recherche
        console.log('Agent et ayants droit trouvés:', response);
        // on cherche les consultations d'aujourd'hui pour l'agent
        if (response) {
            try {
                const consultations = await getConsultationsForPatientToday(response.id_agent_snel);
                if (consultations.length > 0) {
                    agentFoundData.value.consultToDay = consultations
                }
            } catch (error) {
                agentFoundData.value.consultToDay = [] // mise à jour de la valeur réactive
            }

            // on cherche les consultations d'aujourd'hui pour chaque ayant droit
            if (response.ayants_droit) {
                response.ayants_droit.forEach(async (ayant, index) => {
                    try {
                        const consultations = await getConsultationsForPatientToday(ayant.id_ayant_droit);
                        if (consultations.length > 0) {
                            agentFoundData.value.ayants_droit[index].consultToDay = consultations
                        }
                    } catch (error) {
                        agentFoundData.value.ayants_droit[index].consultToDay = []
                    }
                });
            }
        }
        
    } catch (error) {
        if (error.message === "Erreur HTTP: 404") {
            toast.error("matricule introuvable.", {
                position: "top-center",
            });
            emit('update:agentFoundData', null)
        } else {
            console.error('Erreur lors de la recherche de l\'agent:', error);
            toast.error("Erreur lors de la recherche de l'agent.", {
                position: "top-center",
            });
        }
    }
};

defineExpose({
    searchAgent
});
</script>

<template>
    <div>
        <!-- <pre>{{ agentFoundData }}</pre> -->
        <div class="dossier-section animate__animated animate__fadeIn">
        <div class="dossier-section-header">
            <h2>Identification</h2>
        </div>

        <form class="mb-4" @submit.prevent="searchAgent(matriculeSnel)">
            <div class="form-group">
                <label for="">Rechercher par Matricule</label>
                <span class="d-flex">
                    <input type="search" v-model="matriculeSnel"
                        placeholder="entrez le Matricule des l'agent" required>
                </span>
            </div>
        </form>

        <hr>

        <div style="max-height: 52vh; overflow-y: auto;">
            <div v-if="agentFoundData" class="d-flex align-items-center">
                <div class="mr-5 profile-card w-50">
                    <div>
                        <img :src="agentFoundData?.photo_identification || 'https://placehold.co/200x200'"
                            alt="Photo de profil" class="avatar">
                    </div>
                </div>

                <div class="w-100">
                    <h3 style="margin: 0; padding: 0;">Détails de l'Agent </h3>
                    <div>
                        <span v-if="agentFoundData?.is_agent_patient_exist" class="status completed mr-1">Déjà Patient
                        </span>
                        <span v-if="agentFoundData?.consultToDay && agentFoundData.consultToDay.length > 0"
                            class="status completed">En visite aujourd'hui
                        </span>
                    </div>

                    <ul>
                        <li>
                            Nom : {{ agentFoundData.agent_nom }} {{ agentFoundData.agent_post_nom }} {{
                                agentFoundData.agent_prenoms }}
                        </li>
                        <li>
                            Matricule : {{ agentFoundData.matricule_snel }}
                        </li>
                        <li>
                            Sexe : {{ agentFoundData.agent_sexe === 'M' ? 'Masculin' : 'Féminin' }}
                        </li>
                        <li>
                            Né(e) le : {{ new
                                Date(agentFoundData.agent_date_naissance).toLocaleDateString('fr-FR',
                                    {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                            }
                            ) }} - {{ parseInt(new Date().getFullYear()) -
                                parseInt(agentFoundData.agent_date_naissance.substring(0, 4)) }} ans
                        </li>
                        <li>
                            Entiter : {{ agentFoundData.departement_snel }}
                        </li>
                        <li>
                            <span>
                                Statut : <span class="statute-active">{{ agentFoundData.statut_agent
                                    }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
                <div class="w-50 p-5 d-flex">
                    <button :disabled="agentFoundData.is_agent_patient_exist" class="btn"
                        @click="createAsAgentSnel(agentFoundData)">Crée le Patient</button>
                    <button @click="emit('init-Consultation', agentFoundData, MatriculeBackup)"
                        v-if="agentFoundData.is_agent_patient_exist"
                        :disabled="!agentFoundData.consultToDay || agentFoundData.consultToDay.length > 0"
                        class="btn btn-outline ml-2">Envoyer au triage</button>
                </div>
            </div>

            <hr v-if="agentFoundData && Object.keys(agentFoundData).length > 0">

            <div v-if="agentFoundData && agentFoundData.ayants_droit && agentFoundData.ayants_droit.length > 0"
                class="mt-4 d-flex align-items-center" v-for="ayant, id in agentFoundData.ayants_droit"
                :key="ayant.id_ayant">

                <div class="mr-5 profile-card w-50">
                    <div>
                        <img :src="ayant?.photo_identification || 'https://placehold.co/200x200'" alt="Photo de profil"
                            class="avatar">
                    </div>
                </div>

                <div class="w-100">
                    <h4>Details de l'Ayants Droit</h4>
                    <span v-if="ayant?.is_ayant_droit_patient_exist" class="status completed mr-1">
                        Déjà Patient
                    </span>
                    <span v-if="ayant.lien_parente === 'Enfant'" class="mb-1">
                        <span class="status danger mr-1" v-if="parseInt(new Date().getFullYear()) - parseInt(ayant.date_naissance.substring(0, 4)) > 18">
                            Non éligible au soin
                        </span>
                        <span class="status completed mr-1" v-else>
                            Éligible au soin
                        </span>
                    </span>
                   
                    <span>
                        <span v-if="ayant?.consultToDay && ayant.consultToDay.length > 0" class="status completed">En
                            visite aujourd'hui</span>
                    </span>

                    <ul>
                        <li>
                            Nom complet : {{ ayant.nom }} {{ ayant.post_nom }} {{ ayant.prenoms }} - {{
                                ayant.lien_parente }}
                        </li>
                        <li>
                            Sexe : {{ ayant.sexe === 'M' ? '(Masculin)' : '(Féminin)' }}
                        </li>
                        <li>
                            Né(e) le : {{ new Date(ayant.date_naissance).toLocaleDateString('fr-FR',
                                {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                            }
                            ) }}
                        </li>
                        <li>
                            Ages : {{ parseInt(new Date().getFullYear()) -
                                parseInt(ayant.date_naissance.substring(0, 4)) }} ans
                        </li>
                    </ul>
                </div>

                <div class="w-50 p-5 d-flex">
                    <button :disabled="ayant.is_ayant_droit_patient_exist" class="btn"
                        @click="createAsAyantDroit(ayant)">Crée le Patient</button>

                    <button @click="emit('init-Consultation', ayant, MatriculeBackup)" v-if="ayant.is_ayant_droit_patient_exist"
                        :disabled="!ayant.consultToDay || ayant.consultToDay.length > 0"
                        class="btn btn-outline ml-2">Envoyer
                        au triage</button>
                </div>
            </div>
        </div>
        </div>
    </div>

</template>