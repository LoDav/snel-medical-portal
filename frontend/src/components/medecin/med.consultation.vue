<script setup>
/** 
 * Composant Consultation.vue
 * Description: Ce composant gère l'interface de consultation médicale pour les médecins.
 * Il affiche une liste de patients en attente, permet de sélectionner un patient,
 */

/*
    LOGIQUE D'AFFICHAGE DES CHAMPS BASÉE UNIQUEMENT SUR type_consultation
    Le statut_consultation (En cours/Terminée) N'INFLUENCE PAS les champs affichés
                                
    Pour "Première visite":
    - motif_consultation
    - anamnese
    - examen_clinique
    - hypotheses_diagnostiques
    - plan_traitement
    - diagnostic_principal
    - diagnostic_cim10
                                
    Pour "Suivi", "Contrôle" ou "Rendez-vous":
    - motif_consultation
    - evolution
    - examen_clinique
    - plan_traitement
*/
// Importations des modules indispensables de Vue
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";

// importation des la methodes pour recuperer les informations de l'utilisateur
import { getUserInfo } from '@/utils/auth';

//les composants enfants
import sidebarSchedule from "../ui-components/sidebar.schedule.vue";
import DashboardLink from "../ui-components/DashboardLink.vue";
//composant 
import Prescriptions from "../ui-components/Prescription.vue";
import medRdv from "./med.components/med.rdv.vue";
import Examen from "../ui-components/Examen.vue";

import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import headerUser from '../ui-components/HeaderUser.vue';
import lasConsultOfPatient from "../ui-components/lasConsultOfPatient.vue";
import HistoriqueMedicalSection from "../ui-components/HistoriqueMedicalSection.vue";


//api methods
// import { getConsultationById } from "@/utils/consultation"
import { getConstantesVitalesByConsultationId } from "@/utils/constantesVitales"
// import { getLastConsultationByPatientId } from '@/utils/consultation';
import { getRendezVousByStatusToday } from '@/utils/rendezVous'

import {
    getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation,
    getConsultationsEnCours,
    getConsultationsTerminees,
    updateConsultation,
    getConsultationsTermineesByPatientId,
    deleteConsultation
} from '@/utils/consultation';


import { correctDateFormat, handleFetchError, scrollToSection } from "../tools";



const route = useRoute();

const consultations = ref([])
const consultationSelected = ref({
})
const userData = getUserInfo()
const selectedTab = ref('')
const previousConsultation = ref(null)

const initialTab = computed(() => {
    if (route.query.tab === 'en-cours') return 'En cours';
    if (route.query.tab === 'en-attente') return 'En attente';
    if (route.query.tab === 'terminees') return 'Terminées';
    return 'En attente'; // default
});

const finishConsultation = ref({
    id_consultation: '',
    id_patient: '',
    id_professionnel: userData?.id_professionnel || '',
    id_centre: userData?.id_centre || '',
    date_consultation: '',
    heure_consultation: '',
    motif_consultation: '',
    type_consultation: '',
    anamnese: null,
    examen_clinique: null,
    diagnostic_principal: '',
    hypotheses_diagnostiques: '',
    diagnostic_cim10: null,
    plan_traitement: null,
    evolution: null,
    statut_consultation: 'Terminée'
})


const componentToRender = { Prescriptions, Examen, medRdv }
const showComponent = ref(false);
const currentComponent = ref('Prescriptions');

const isPremiereVisite = computed(() => finishConsultation.value.type_consultation === 'Première visite')
const isSuivi = computed(() => ['Suivi', 'Contrôle', 'Rendez-vous'].includes(finishConsultation.value.type_consultation))

const switchComponent = (component) => {
    if (currentComponent.value === component) {
        showComponent.value = !showComponent.value;
    } else {
        currentComponent.value = component;
        showComponent.value = true;
    }
}


const endConsultation = async () => {
    // Mise à jour des champs avec les données de la consultation
    const consultation = consultationSelected.value
    console.log('Consultation sélectionnée avant mise à jour:', consultation);


    // Vérifier si tous les champs obligatoires sont remplis
    const champsObligatoires = [
        finishConsultation.value.anamnese,
        finishConsultation.value.examen_clinique,
        finishConsultation.value.diagnostic_principal,
        finishConsultation.value.plan_traitement
    ]

    // Vérifie si tous les champs obligatoires sont remplis
    // const tousChampsRemplis = champsObligatoires.every(champ =>
    //     champ !== null && champ !== undefined && champ !== ''
    // )

    let statut = 'Terminée';

    // Pour les consultations de type "Première visite", vérifier si les champs Diagnostic principal et Code CIM-10 sont remplis
    if (finishConsultation.value.type_consultation === 'Première visite' &&
        (!finishConsultation.value.diagnostic_principal || !finishConsultation.value.diagnostic_cim10)) {
        alert('Les champs Diagnostic principal et Code CIM-10 sont obligatoires pour une Première visite. La consultation enregistrée comme "En cours".');    
        statut = 'En cours';
    }

    // Met à jour l'objet finishConsultation avec les données nécessaires
    finishConsultation.value = {
        ...finishConsultation.value, // Garde les valeurs existantes du formulaire
        id_consultation: consultation.id_consultation,
        id_patient: consultation.patient_info.id_patient,
        id_professionnel: userData.id_professionnel,
        id_centre: userData.id_centre,
        date_consultation: correctDateFormat(consultation.date_consultation),
        // date_consultation: new Date(consultation.date_consultation).toISOString().split('T')[0],
        heure_consultation: consultation.heure_consultation,
        // motif_consultation : consultation.motif_consultation,
        // Les champs suivants sont déjà liés via v-model dans le formulaire
        // anamnese, examen_clinique, diagnostic_principal, diagnostic_cim10, plan_traitement, evolution
        statut_consultation: statut
        // statut_consultation: 'Terminée'
    }

    console.log('Consultation à mettre à jour:', finishConsultation.value);

    try {
        await updateConsultation(consultation.id_consultation, finishConsultation.value)
        alert('Consultation terminée avec succès !')
        consultationSelected.value = {} // Réinitialiser la consultation sélectionnée
        getData()// Rafraîchir la liste des consultations
    } catch (error) {
        console.log(error);
        handleFetchError(error, "Erreur de connexion au serveur.")
    }

    // Met à jour la consultation via l'API
    // if (tousChampsRemplis) {
    //     try {
    //         await updateConsultation(consultation.id_consultation, finishConsultation.value)
    //         alert('Consultation terminée avec succès !')
    //         consultationSelected.value = {} // Réinitialiser la consultation sélectionnée
    //         getData()// Rafraîchir la liste des consultations
    //     } catch (error) {
    //         console.log(error);
    //         handleFetchError(error,"Erreur de connexion au serveur.")
    //     }

    // } else {
    //     try{
    //         await updateConsultation(consultation.id_consultation, finishConsultation.value)
    //         alert('Consultation enregistrée comme "En cours". Certains champs obligatoires sont manquants.')
    //         consultationSelected.value = {} // Réinitialiser la consultation sélectionnée
    //         getData()// Rafraîchir la liste des consultations
    //     }catch(error){
    //         console.log(error)
    //         handleFetchError(error,"Erreur de connexion au serveur.")
    //     }

    // }

    console.log(`Données de la consultation ${statut}:`, finishConsultation.value)
}

const onTabChange = (tab) => {
    selectedTab.value = tab
    consultationSelected.value = {}
}


/**
 * Réinitialise l'affichage des composants de prescription et d'examen,
 * puis rempli le formulaire avec les données de la consultation sélectionnée.
 * @param {Object} data - Objet contenant les informations de la consultation
 */
async function getSelectedData(data) {
    // Réinitialiser l'affichage des composants de prescription et d'examen
    showComponent.value = false;

    consultationSelected.value = data;
    // Récupérer les constantes vitales associées à la consultation sélectionnée
    try {
        consultationSelected.value.constantes = await getConstantesVitalesByConsultationId(data.id_consultation);
    } catch (error) {
        consultationSelected.value.constantes = [];
        handleFetchError(error, "Erreur de connexion au serveur.")
    }

    // Pré-remplir le formulaire avec les données de la consultation sélectionnée
    finishConsultation.value.type_consultation = data.type_consultation || '';
    finishConsultation.value.anamnese = data.anamnese || null;
    finishConsultation.value.examen_clinique = data.examen_clinique || null;
    finishConsultation.value.diagnostic_principal = data.diagnostic_principal || '';
    finishConsultation.value.hypotheses_diagnostiques = data.hypotheses_diagnostiques || '';
    finishConsultation.value.diagnostic_cim10 = data.diagnostic_cim10 || null;
    finishConsultation.value.plan_traitement = data.plan_traitement || null;
    finishConsultation.value.evolution = data.evolution || null;
    finishConsultation.value.motif_consultation = data.motif_consultation || ''; // Initialiser motif_consultation

    try {
        /*
            Récupérer les consultations terminées du patient pour l'historique médical dans le compsant HistoriqueMedicalSection

        */
        const consultationsTerminees = await getConsultationsTermineesByPatientId(data.patient_info.id_patient);
        consultationSelected.value.historiqueConsultations = consultationsTerminees;
        //console.log('Consultations terminées du patient:', consultationsTerminees);

        // Pour les suivis, trouver la consultation précédente et pré-remplir
        if (data.type_consultation && ['Suivi', 'Contrôle', 'Rendez-vous'].includes(data.type_consultation) && data.id_consultation_precedente) {
            previousConsultation.value = consultationsTerminees.find(c => c.id_consultation === data.id_consultation_precedente);
            if (previousConsultation.value && previousConsultation.value.plan_traitement) {
                finishConsultation.value.plan_traitement = previousConsultation.value.plan_traitement;
            }
        }
    } catch (error) {
        console.log('Erreur lors de la récupération des consultations terminées du patient:', error);
    }

    // Si on vient pour voir les résultats, ouvrir l'onglet Examens et scroller vers les résultats
    if (route.query.view === 'results') {
        switchComponent('Examen');
        // nextTick(() => {
        //     setTimeout(() => scrollToSection('exam-results'), 500);
        // });
    }
}

const deleteConsult = async (id_consultation) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.")) {
        try {
            await deleteConsultation(id_consultation)
            alert('Consultation supprimée avec succès !')
            consultationSelected.value = {} // Réinitialiser la consultation sélectionnée
            getData()// Rafraîchir la liste des consultations
        } catch (error) {
            console.log(error);
            handleFetchError(error, "Erreur de connexion au serveur.")
        }
    }
}

/**
 * Récupère les consultations pour le médecin connecté et les classe en trois catégories :
 * 'En attente', 'En cours' et 'Terminées'.
 * Les résultats sont stockés dans la variable réactive `consultations`.
 */
async function getData() {
    //Initialiser les tableaux pour chaque catégorie de consultation
    let enAttenteRes = [];
    let termineesRes = [];
    let enCoursRes = [];
    let rendezVous = [];

    /**
     * Utilise des blocs try-catch pour gérer les erreurs potentielles lors des appels API.
     * Chaque appel est effectué séparément pour s'assurer que la défaillance d'un appel
     * n'affecte pas les autres.
     * Les résultats sont vérifiés et formatés avant d'être stockés dans `consultations`.
     */
    try {
        enAttenteRes = await getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation(userData.id_professionnel);
    } catch (error) {
        console.warn("Erreur lors de la récupération des consultations en attente ou aucune :", error);
        enAttenteRes = []; // Initialise à un tableau vide en cas d'erreur
        handleFetchError(error, "Erreur de connexion au serveur.") // Affiche une alerte en cas d'erreur de connexion
    }



    try {
        termineesRes = await getConsultationsTerminees(userData.id_professionnel);
        console.log('termineesRes', termineesRes);
    } catch (error) {
        console.warn("Erreur lors de la récupération des consultations terminées :", error);
        termineesRes = { data: [] }; // Initialise à un objet avec data vide
    }

    try {
        enCoursRes = await getConsultationsEnCours(userData.id_professionnel);
    } catch (error) {
        console.warn("Erreur lors de la récupération des consultations en cours :", error);
        enCoursRes = { data: [] }; // Initialise à un objet avec data vide
    }

    try {
        rendezVous = await getRendezVousByStatusToday(userData.id_professionnel, 'En consultation')
    } catch (error) {
        console.log(error)
        console.log("Erreur lors de la récupération des rendez-vous aujourd'hui :", error);

    }

    console.log('Réponses des consultations:', {
        enAttenteRes,
        termineesRes,
        enCoursRes
    });

    // Structure les données pour correspondre à l'ordre des onglets : ['En attente', 'En cours', 'Terminées']
    // la structure est un tableau de tableaux
    // Chaque sous-tableau contient les consultations pour cet onglet

    consultations.value = [
        Array.isArray(enAttenteRes) ? enAttenteRes : [],
        (enCoursRes && enCoursRes.data && Array.isArray(enCoursRes.data)) ? enCoursRes.data : [],
        (termineesRes && termineesRes.data && Array.isArray(termineesRes.data)) ? termineesRes.data : [],
        (rendezVous && Array.isArray(rendezVous)) ? rendezVous : []
    ];

    // console.log('Consultations structurées pour les onglets :', consultations.value);
    // console.log('preselect data :', consultations.value[0][0]);
    // console.dir(route.query.consultation)
    // getSelectedData(consultations.value[0][0] || {}) // sélectionner la première consultation de la liste "En attente" par défaut
    /**
     * commentaire a ajouter
     */

    if (route.query?.consultation) {
        let tabIndex = 0; // default En attente
        if (route.query.tab === 'en-cours') tabIndex = 1;
        if (route.query.tab === 'terminees') tabIndex = 2;
        const data = consultations.value[tabIndex].filter((el) => el.id_consultation === route.query.consultation)
        getSelectedData(data[0] || {})
    } else {
        getSelectedData(consultations.value[0][0] || {}) // sélectionner la première consultation de la liste "En attente" par défaut
    }
}

onMounted(() => {
    getData()
})

</script>

<template>
    <nav>
        <div class="navbar ">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer-alt" to="/medecin/tableau-de-bord" />
                <DashboardLink text="Consutations" icon="user-md" to="/medecin/consultation" :active="true" />
                <DashboardLink text="Patients" icon="users" to="/medecin/patients" />
                <DashboardLink text="Rendez-vous" icon="calendar-plus-o" to="/medecin/rendezvous" />
            </ul>
            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>

                <div class="ml-3">
                    <header-user />
                </div>
            </div>
        </div>
    </nav>

    <div class="main-wrapper animate__animated animate__fadeIn">
        <div class="container">
            <div class="header">
                <div>
                    <h1>Consultation</h1>
                </div>

            </div>

            <div class="main-content">
                <sidebarSchedule title="Patients en attente" :items="consultations"
                    :tabs="['En attente', 'En cours', 'Terminées']" @getdata=getSelectedData @tab-changed="onTabChange"
                    :preselected="consultationSelected?.id_consultation" :initialTab="initialTab" />

                <!-- <div class="sidebar">
                    <div class="search-box">
                        <input type="search" placeholder="Rechercher par nom ou ID patient..."
                            v-model="searchTerm">
                    </div>
                    <div class="tabs-container">
                        <button class="tab-button">
                            <span>En attente</span>
                        </button>
                    </div>
                </div> -->

                <div class="detail-panel main-panel"
                    v-if="JSON.stringify(consultationSelected) != '{}' && selectedTab != 'rendez-vous'">
                    <!-- <pre>{{ consultationSelected }}</pre> -->
                    <!-- <pre>{{ consultations }}</pre> -->

                    <section class="header-section">
                        <div>
                            <h2>
                                <span>
                                    <i class="fa fa-user"></i> Fiche de {{ consultationSelected.patient_info?.nom }} {{
                                        consultationSelected.patient_info?.prenoms }}
                                </span>
                                <button v-if="selectedTab !== 'Terminées'" class="btn btn-danger"
                                    @click="deleteConsult(consultationSelected.id_consultation)">supprimer</button>
                            </h2>
                            <small class="text-muted mb-3">ID Consultation : {{ consultationSelected.id_consultation
                            }}</small>
                            <br>
                            <br>
                        </div>
                    </section>

                    <!-- <pre>{{ consultationSelected }}</pre> -->
                    <!-- <lasConsultOfPatient :consultationsId="consultationSelected.id_consultation"
                        :consultations-precedente-id="consultationSelected.id_consultation_precedente"
                        :patientId="consultationSelected.patient_info.id_patient" /> -->
                    <HistoriqueMedicalSection v-if="selectedTab !== 'Terminées'"
                        :consultations="consultationSelected.historiqueConsultations" />

                    <section>
                        <div class="vital-signs-card" id="vital-signs-card"
                            v-for="data in consultationSelected.constantes">
                            <div class="vital-sign-item">
                                <i class="fa fa-thermometer-half"></i>
                                <small> Temperature</small>
                                <strong>{{ data.temperature_celsius }} °C</strong>
                            </div>

                            <div class="vital-sign-item" v-if="data?.pouls_bpm">
                                <i class="fa fa-heartbeat"></i>
                                <small> Pouls</small>
                                <strong>{{ data.pouls_bpm }} bpm</strong>
                            </div>

                            <div class="vital-sign-item"
                                v-if="data?.tension_arterielle_systolique && data?.tension_arterielle_diastolique">
                                <i class="fa fa-heartbeat"></i>
                                <small> Tension</small>
                                <strong>{{ data.tension_arterielle_systolique }}/{{ data.tension_arterielle_diastolique
                                }} mmHg</strong>
                            </div>

                            <div class="vital-sign-item" v-if="data?.poids_kg">
                                <i class="fa fa-cube"></i>
                                <small> Poids</small>
                                <strong>{{ data.poids_kg }} kg</strong>
                            </div>

                            <div class="vital-sign-item" v-if="data?.taille_cm">
                                <i class="fa fa-text-height"></i>
                                <small> Taille</small>
                                <strong>{{ data.taille_cm }} cm</strong>
                            </div>

                            <div class="vital-sign-item" v-if="data?.saturation_oxygene_pourcentage">
                                <i class="fa fa-heart"></i>
                                <small> Saturation</small>
                                <strong>{{ data.saturation_oxygene_pourcentage }} %</strong>
                            </div>
                        </div>
                        <!-- <p v-if="consultationSelected.constantes[0]?.notes">
                                notes: {{ consultationSelected.constantes[0].notes }}
                            </p> -->
                    </section>

                    <section class="mt-5">
                        <div class="dossier-section-header">
                            <h2><i class="fa fa-plus-circle mr-1"></i> Consultation</h2>

                            <div class="tab-container">
                                <button
                                    :class="['tab-button', { 'active': currentComponent === 'Prescriptions' && showComponent }]"
                                    @click="switchComponent('Prescriptions')">
                                    <i class="fa fa-plus-square"></i> Prescriptions
                                </button>
                                <button
                                    :class="['tab-button', { 'active': currentComponent === 'Examen' && showComponent }]"
                                    @click="switchComponent('Examen')">
                                    <i class="fa fa-stethoscope"></i> Analyses
                                </button>
                                <button 
                                    :class="['tab-button', { 'active': currentComponent === 'medRdv' && showComponent }]" 
                                    @click="switchComponent('medRdv')">
                                    <i class="fa fa-calendar" aria-hidden="true"></i> rendez-vous
                                </button>
                            </div>
                        </div>



                        <component 
                            :is="componentToRender[currentComponent]" 
                            :consultation="consultationSelected"
                            :patient="consultationSelected.patient_info"
                            :disabled="selectedTab === 'Terminées'"
                            v-if="showComponent"></component>

                        <!-- <Prescriptions :consultation="consultationSelected" v-if="showPrescription"/>
                        <Examen :consultation="consultationSelected" v-if="showExamen"/> -->

                        <form @submit.prevent="endConsultation">
                            <!-- Affichage en lecture seule pour les suivis -->
                            <div v-if="isSuivi && previousConsultation">
                                <div class="form-group">
                                    <label>Anamnèse précédente (Référence)</label>
                                    <textarea readonly>{{ previousConsultation.anamnese }}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Diagnostic principal précédent (Référence)</label>
                                    <input readonly :value="previousConsultation.diagnostic_principal">
                                    <datalist>
                                        <option value="Douleurs abdominales récurrentes"></option>
                                    </datalist>
                                </div>
                            </div>

                            <!-- Motif de consultation - AFFICHÉ POUR TOUS LES TYPES -->
                            <div class="form-group">
                                <label for="motif_consultation">Motif de la consultation</label>
                                <input type="text" id="motif_consultation"
                                    v-model="finishConsultation.motif_consultation"
                                    placeholder="Motif de la consultation"
                                    list="motifs_list">
                                <datalist id="motifs_list">
                                    <option value="Douleurs abdominales récurrentes"></option>
                                    <option value="Maux de tête"></option>
                                    <option value="Fièvre"></option>
                                    <option value="Toux persistante"></option>
                                    <option value="Mal de gorge"></option>
                                    <option value="Douleur thoracique"></option>
                                    <option value="Fatigue anormale"></option>
                                    <option value="Mal de dos"></option>
                                    <option value="Troubles du sommeil"></option>
                                    <option value="Anxiété ou stress"></option>
                                    <option value="Vertiges"></option>
                                    <option value="Éruption cutanée"></option>
                                    <option value="Nausées ou vomissements"></option>
                                    <option value="Palpitations"></option>
                                    <option value="Douleurs articulaires"></option>
                                    <option value="Essoufflement"></option>
                                    <option value="Troubles de la vision"></option>
                                    <option value="Douleurs musculaires"></option>
                                    <option value="Perte de poids inexpliquée"></option>
                                    <option value="Engourdissements"></option>
                                </datalist>
                            </div>

                            <!-- Anamnèse - UNIQUEMENT pour Première visite -->
                            <div class="form-group" v-if="isPremiereVisite">
                                <label for="anamnese">Anamnèse</label>
                                <textarea id="anamnese" v-model="finishConsultation.anamnese" rows="6"
                                    placeholder="Historique et informations recueillies"></textarea>
                            </div>

                            <!-- Examen clinique - AFFICHÉ POUR TOUS LES TYPES -->
                            <div class="form-group">
                                <label for="examen_clinique">Examen clinique</label>
                                <textarea id="examen_clinique" v-model="finishConsultation.examen_clinique" rows="6"
                                    placeholder="Observations de l'examen physique"></textarea>
                            </div>

                            <!-- Plan de traitement - AFFICHÉ POUR TOUS LES TYPES -->
                            <div class="form-group">
                                <label for="plan_traitement">Plan de traitement</label>
                                <textarea id="plan_traitement" v-model="finishConsultation.plan_traitement"
                                    placeholder="Description du plan de traitement et de suivi"></textarea>
                            </div>

                            <!-- Hypothèse de diagnostic - UNIQUEMENT pour Première visite -->
                            <div class="form-group" v-if="isPremiereVisite">
                                <label for="hypothese">Hypothèse de diagnostic</label>
                                <textarea name="" id="hypothese" placeholder="hypothèse de diagnostic"
                                    v-model="finishConsultation.hypotheses_diagnostiques"></textarea>
                            </div>

                            <!-- Diagnostic principal et CIM-10 - UNIQUEMENT pour Première visite -->
                            <div class="d-flex-normal w-100" v-if="isPremiereVisite">
                                <div class="form-group w-100 mr-3">
                                    <label for="diagnostic_principal">Diagnostic principal</label>
                                    <input id="diagnostic_principal" type="text"
                                        v-model="finishConsultation.diagnostic_principal"
                                        placeholder="Diagnostic principal posé">
                                </div>

                                <div class="form-group w-100">
                                    <label for="diagnostic_cim10">Code CIM-10</label>
                                    <input id="diagnostic_cim10" type="text"
                                        v-model="finishConsultation.diagnostic_cim10"
                                        placeholder="Code CIM-10 du diagnostic principal" maxlength="20">
                                </div>
                            </div>

                            <!-- Évolution - UNIQUEMENT pour Suivi/Contrôle/Rendez-vous -->
                            <div class="form-group" v-if="isSuivi">
                                <label for="evolution">Évolution</label>
                                <textarea id="evolution" v-model="finishConsultation.evolution"
                                    placeholder="Notes sur l'évolution du patient"></textarea>
                            </div>





                            <div class="text-right mt-3 mb-3">
                                <!-- <button class="btn btn-outline mr-3"><i class="fas fa-file-pdf"></i> Imprimer l'ordonnance</button> -->
                                <button class="btn btn-primary mr-3" :disabled="selectedTab === 'Terminées'"
                                    id="end-consultation-btn"><i class="fa fa-check"></i>
                                    Terminer la consultation</button>
                                <!-- <button 
                                    v-if="selectedTab === 'En attente' && consultationSelected.type_consultation !== 'Rendez-vous'" 
                                    class="btn btn-warning"
                                    id="end-consultation-btn"
                                    ><i class="fa fa-spinner"></i> Mettre en attente de resultats
                                </button> -->
                            </div>
                        </form>
                    </section>
                </div>

                <!-- <div v-if="JSON.stringify(consultationSelected) != '{}' && selectedTab == 'rendez-vous'">
                    <div>
                        <h2>consultation</h2>
                    </div>
                </div> -->

                <div v-else style="
                    margin-top: 50px;
                    text-align: center; 
                    color: var(--gh-text-color-secondary);
                    display: flex;
                    justify-content: center;
                    min-width: 100vh;
                    ">
                    <div>
                        <i class="fa fa-arrow-left" style="font-size: 2em; margin-bottom: 10px;"></i>
                        <p>Sélectionnez un patient dans la liste pour voir ses informations.</p>
                    </div>
                </div>

            </div>

        </div>

    </div>
</template>

<style scoped>
.main-panel {
    margin: 15px;
    flex-grow: 1;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    overflow-y: auto;
}

/**
sans ce style, l'impression est parasitee sur la page
une page parasuite s'ajoute sans aucune raison
 */
@media print {
    * {
        visibility: hidden;
        width: 148mm;
        /* A5 width */
        max-height: 210mm;
        /* A5 height */
    }
}

.medication-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.medication-list-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    background-color: var(--gh-sidebar-bg);
    margin-bottom: 15px;
}

.medication-list-item h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    /* border-bottom: 1px solid var(--gh-border-color); */
    padding-bottom: 10px;
}

/* .form-group input:focus,
.form-group textarea:focus {
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
} */

/* Style pour les champs remplis */
/* .form-group input:not(:placeholder-shown),
.form-group textarea:not(:placeholder-shown) {
    background-color: #e8f0fe;
    border-color: #8ab4f8;
} */

.sidebar {
    margin: 15px 0px 15px 15px;
    width: 300px;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    overflow-y: auto;
}

.section-header {
    font-size: 18px;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.vital-signs-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
}

.vital-sign-item {
    text-align: center;
    background-color: var(--gh-border-color);
    padding: 10px;
    border-radius: 6px;
}

.vital-sign-item strong {
    display: block;
    font-size: 1.2em;
}

.prescription-section {
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    margin: 20px 0;
    background-color: var(--color-background-soft);
}

.prescription-ligne {
    position: relative;
    border-bottom: 1px dashed var(--gh-border-color);
    padding: 15px 0;
    margin-bottom: 15px;
}

.btn-remove-ligne {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #dc3545;
    cursor: pointer;
}

/* .tab-buttons {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    margin-bottom: 15px;
}

.tab-button {
    padding: 10px 15px;
    cursor: pointer;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--gh-text-color-secondary);
    font-weight: 600;
    font-size: 1em;
}

.tab-button.active {
    color: var(--gh-text-color);
    border-bottom-color: var(--gh-accent-color);
}

.tab-button:hover {
    color: var(--gh-text-color);
} */
</style>
