<script setup>
/**
 * module IdentificationAndCreation.vue
 * Description: Ce composant permet de rechercher un agent SNEL par son matricule,
 * d'afficher ses informations ainsi que celles de ses ayants droits,
 * et de créer des patients à partir de ces informations.
 * et on ajoute aussi la possibilité de créer un patient externe.
 * Auteur: @necromastery alias David MUKOKO
 * Date: 04/09/2024
 * Version: 2.0
*/

import { ref } from 'vue';
import { getAgentAndAyantsByMatricule } from '@/utils/agent_snel';
import { createPatient } from '@/utils/patient';
// import { createPatient } from '../../images/childs';

import { useToast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
const toast = useToast();


const agentFoundData = ref(null);
const matricule_snel = ref('');
const localImagesObj = ref({
    'childs':[
            'stock-photo-portrait-of-young-african-black-boy-509908456.jpg',
            'stock-photo-smiling-african-girl-with-a-pretty-face-and-natural-woven-hair-1352027447.jpg',
            'stock-photo-young-black-african-girl-portrait-collection-504694072.jpg',
            'stock-photo-young-black-african-girl-portrait-collection-505302595.jpg',
            'stock-photo-young-black-african-girl-portrait-collection-505303942.jpg',
            'stock-photo-young-black-african-girl-portrait-collection-509908492.jpg'
        ],
    'mans':[
        'istockphoto-1080403834-1024x1024.jpg',
        'istockphoto-1082483632-1024x1024.jpg',
        'istockphoto-1125861322-1024x1024.jpg',
        'istockphoto-1358152477-1024x1024.jpg',
        'istockphoto-1407566424-1024x1024.jpg',
        'istockphoto-2135643049-1024x1024.jpg',
        'stock-photo-amazingly-high-detailed-portrait-of-an-african-face-must-see-at-full-size-62322925.jpg',
        'stock-photo-amazingly-high-detailed-portrait-of-an-african-face-must-see-at-full-size-62322934.jpg',
        'stock-photo-portrait-headshot-of-a-handsome-african-american-male-1524689.jpg',
        'stock-photo-portrait-of-real-black-african-man-with-no-expression-id-or-passport-photo-full-collection-of-504679618.jpg',
        'stock-photo-portrait-of-real-black-african-man-with-no-expression-id-or-passport-photo-full-collection-of-504740665.jpg',
        'stock-photo-portrait-of-real-black-african-man-with-no-expression-id-or-passport-photo-full-collection-of-505303987.jpg',
        'stock-photo-portrait-of-real-black-african-man-with-no-expression-id-or-passport-photo-full-collection-of-509414548.jpg'
    ],
    'femmes':[
        'id-passport-photo-of-african-woman-with-serious-expression.jpg',
        'istockphoto-1035118658-2048x2048.jpg',
        'istockphoto-944138450-2048x2048.jpg',
        'istockphoto-944577638-2048x2048.jpg',
        'istockphoto-944685702-2048x2048.jpg',
        'istockphoto-944984032-2048x2048.jpg',
        'istockphoto-944984060-2048x2048.jpg',
        'istockphoto-944984110-2048x2048.jpg',
        'istockphoto-944986378-2048x2048.jpg',
        'istockphoto-944987820-2048x2048.jpg',
        'istockphoto-947206714-2048x2048.jpg',
        'istockphoto-947207550-2048x2048.jpg',
        'stock-photo-portrait-of-real-black-african-woman-with-no-expression-id-or-passport-photo-full-collection-of-505302649.jpg',
    ]     
});


const toggle_create_form = ref(false);

const agentImage = ref('');
const ayantsImages = ref([]);

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
});

const custom_date_naissance = ref({
    jour: '',
    mois: '',
    annee: '',
})

// Fonction pour créer un patient qui est un ayant droit
async function createAsAyantDroit(data) {
    try{
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

        console.table(newPatient.value);

        await createPatient(newPatient.value);
        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');
        
        toast.success("Patient enregistré avec succès !",{
            position: "top-center",
        });

        searchAgent(matricule_snel.value)

    }catch(error){
        console.error("Erreur lors de la création du patient ayant droit:", error);
        toast.error("Erreur lors de la création du patient ayant droit.",{
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

    //Assurez-vous que la date est au format YYYY-MM-DD
        let formattedDate = '';
        if (agentData.agent_date_naissance) {
            const dateObj = new Date(agentData.agent_date_naissance);
            if (!isNaN(dateObj)) { // Vérifie si la date est valide
                formattedDate = dateObj.toISOString().split('T')[0];
            }
        }

        newPatient.value.date_naissance = new Date(agentData.agent_date_naissance).toISOString().split('T')[0];

        newPatient.value.sexe = agentData.agent_sexe;
        newPatient.value.telephone = agentData.agent_telephone;
        newPatient.value.email = agentData.agent_email;
        newPatient.value.adresse = agentData.agent_adresse;

        console.table(newPatient.value);

        await createPatient(newPatient.value);
        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');
        
        toast.success("Patient enregistré avec succès !",{
            position: "top-center",
        });

        searchAgent(matricule_snel.value)

    } catch (error) {
        console.error("Erreur lors de la création du patient agent SNEL:", error);
        toast.error("Erreur lors de la création du patient agent SNEL.",{
            position: "top-center",
        });
    }
}

async function savePatient() {
    try {
        let patientData = {
            id_patient: newPatient.value.id_patient,
            nom: newPatient.value.nom,
            prenoms: newPatient.value.prenoms,
            post_nom: newPatient.value.post_nom,
            date_naissance: `${custom_date_naissance.value.annee}-${String(custom_date_naissance.value.mois).padStart(2, '0')}-${String(custom_date_naissance.value.jour).padStart(2, '0')}`,
            sexe: newPatient.value.sexe,
            telephone: newPatient.value.telephone,
            email: newPatient.value.email,
            adresse: newPatient.value.adresse,
            type_patient: 'PatientExterne',
            id_agent_snel: newPatient.value.id_agent_snel, // Default to null
            id_ayant_droit: newPatient.value.id_ayant_droit, // Default to null
        };

        console.table(patientData);

        
        await createPatient(patientData);
        alert("Patient enregistré avec succès !");
        // Réinitialiser le formulaire
        Object.keys(newPatient.value).forEach(key => newPatient.value[key] = '');
        agentFoundData.value = null;

    } catch (error) {
        console.error("Erreur lors de l'enregistrement du patient:", error);
    alert("Erreur lors de l'enregistrement du patient.");
    }
}


const getRandomImage = (category) => {
    if (!category || !localImagesObj.value[category]) {
        console.error(`Invalid category: ${category}`);
        return '';
    }
    
    const images = localImagesObj.value[category];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    return `http://localhost:3000/files/upload/${category}/${randomImage}`;
}



const searchAgent = async (matricule) => {
    try {
        const response = await getAgentAndAyantsByMatricule(matricule);
        agentFoundData.value = response;
        agentImage.value = response.agent_sexe === 'M' ? getRandomImage('mans') : getRandomImage('femmes');
        let index = 0
        if (response.ayants_droit) {
            for (const ayant of response.ayants_droit) {
                // const category =  === 'Épouse'  ? 'femmes' : 'childs';

                switch (ayant.lien_parente) {
                    case 'Épouse':
                        ayantsImages.value[index] = getRandomImage('femmes');
                        console.log(index, ayantsImages.value[index]);
                        break;
                    case 'Enfant':
                        ayantsImages.value[index] = getRandomImage('childs');
                        console.log(index, ayantsImages.value[index]);
                        break;
                    case 'Époux':
                        ayantsImages.value[index] = getRandomImage('mans');
                        console.log(ayantsImages.value[index]);
                        
                        break;
                }
                index += 1;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'agent:', error);
        agentFoundData.value = null; // Réinitialiser si erreur
    }
};
</script>
<template>
    <div class="detail-panel">

        <pre>{{ agentFoundData }}</pre>

        <div class="dossier-section">
            <div class="dossier-section-header">
                <h2>Identification</h2>
                <button :class="{'btn btn-outline' : !toggle_create_form, 'btn btn-danger' : toggle_create_form }" @click="toggle_create_form = !toggle_create_form">
                    {{ toggle_create_form ? 'Fermer le formulaire' : 'Créer un Patient Externe' }}
                </button>
            </div>

            <div class="mb-4">
                <div class="form-group">
                    <label for="">Rechercher par Matricule</label>
                    <span class="d-flex">
                        <input type="text" v-model="matricule_snel" placeholder="entrez le Matricule des l'agent" required>
                        <button class="btn btn-primary ml-3" @click="searchAgent(matricule_snel)">Rechercher</button>
                    </span>
                </div>
            </div>

            <hr>

            <div style="max-height: 40vh; overflow-y: auto;">
                <div v-if="agentFoundData" class="d-flex align-items-center">

                    <div class="mr-5 profile-card w-50">
                        <div>
                            <img 
                                :src="agentImage" 
                                alt="Photo de profil" 
                                class="avatar">
                        </div>
                    </div>

                    <div class="w-100">
                        <h3>Détails de l'Agent <span v-if="agentFoundData?.is_agent_patient_exist" class="statute-danger">Déjà Patient</span></h3>
                        <ul>
                            <li>
                                Nom : {{ agentFoundData.agent_nom }} {{ agentFoundData.agent_post_nom }} {{ agentFoundData.agent_prenoms }}
                            </li>
                            <li>
                                Matricule : {{ agentFoundData.matricule_snel }}
                            </li>
                            <li>
                                Sexe : {{ agentFoundData.agent_sexe === 'M' ? 'Masculin' : 'Féminin' }}
                            </li>
                            <li>
                                Né(e) le : {{ new Date(agentFoundData.agent_date_naissance).toLocaleDateString('fr-FR', 
                                        { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }
                                    ) }} - {{ parseInt(new Date().getFullYear()) - parseInt(agentFoundData.agent_date_naissance.substring(0, 4)) }} ans
                            </li>
                            <li>
                                Entiter : {{ agentFoundData.departement_snel }} - service {{ agentFoundData.service_snel }}
                            </li>
                            <li>
                                <span>
                                    Statut : <span class="statute-active">{{ agentFoundData.statut_agent }}</span>
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div class="w-50 p-5 d-flex">
                        <button :disabled="agentFoundData.is_agent_patient_exist" class="btn" @click="createAsAgentSnel(agentFoundData)">Crée le Patient</button>
                        <button class="btn btn-outline ml-2">Envoyer au triage</button>
                    </div>

                </div>
                <hr>
                <div 
                v-if="agentFoundData && agentFoundData.ayants_droit && agentFoundData.ayants_droit.length > 0" 
                class="mt-4 d-flex align-items-center"
                v-for="ayant,id in agentFoundData.ayants_droit" :key="ayant.id_ayant">

                    <div class="mr-5 profile-card w-50">
                        <div>
                            <img 
                                :src="ayantsImages[id]" 
                                alt="Photo de profil"
                                class="avatar">
                            <!-- <img src="./../../../public/" /> -->
                        </div>
                    </div>

                    <div class="w-100">
                        <h4>Details de l'Ayants Droit <span v-if="ayant?.is_ayant_droit_patient_exist" class="badge bg-success statute-danger">Déjà Patient</span></h4>

                        <ul>
                            <li>
                                Nom complet : {{ ayant.nom }} {{ ayant.post_nom }} {{ ayant.prenoms }} - ({{ ayant.lien_parente }})
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
                                Ages : {{ parseInt(new Date().getFullYear()) - parseInt(ayant.date_naissance.substring(0, 4)) }} ans
                            </li>
                        </ul>
                    </div>
                    <div class="w-50 p-5 d-flex">
                        <button 
                        :disabled="ayant.is_ayant_droit_patient_exist" 
                        class="btn" 
                        @click="createAsAyantDroit(ayant)">Crée le Patient</button>

                        <button class="btn btn-outline ml-2">Envoyer au triage</button>
                    </div>

                </div>

                <!-- <div v-else>
                    <p>Aucun agent trouvé. Veuillez vérifier le matricule et réessayer.</p>
                </div> -->
            </div>

        </div>

        <div>
            
        </div>

        <div class="dossier-section mt-4" v-if="toggle_create_form">
            <div class="dossier-section-header">
                <h2>Création du Patient</h2>
            </div>
            <form action="" @submit.prevent="savePatient">
                <!-- <div class="form-group">
                    <label for="type-patient">Type de Patient</label>
                    <input id="type-patient" type="text" value="PatientExterne" disabled v-model="newPatient.type_patient" placeholder="Type de Patient (Externe)" required>
                </div> -->
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
                    <label for="date-naissance-patient">Date de Naissance {{ newPatient.date_naissance }}</label>
                    <div class="d-flex">
                        <input v-model="custom_date_naissance.jour" class="mr-3" type="number" min="1" max="31" step="1" placeholder="jour" />
                        <input v-model="custom_date_naissance.mois"  class="mr-3" type="number" min="1" max="12" step="1" placeholder="Mois"/>
                        <input v-model="custom_date_naissance.annee" type="number" min="1900" :max="new Date().getFullYear()" step="1" placeholder="année"/>
                    </div>
                    
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
                    <input id="telephone-patient" type="text" v-model="newPatient.telephone" placeholder="Numéro de Téléphone" required>
                </div>
                <div class="form-group">
                    <label for="email-patient">Email</label>
                    <input id="email-patient" type="email" placeholder="Email" v-model="newPatient.email">
                </div>
                <div class="form-group">
                    <label for="adresse-patient">Adresse</label>
                    <textarea id="adresse-patient" placeholder="address" v-model = "newPatient.adresse"></textarea>
                </div>
                <div class="text-right">
                    <button class="btn btn-outline" type="submit">Enregistrer</button>
                </div>
            </form>
        </div>
        
        
    </div>
    

</template>
