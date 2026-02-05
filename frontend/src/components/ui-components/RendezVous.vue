<script setup>
import { ref, onMounted } from 'vue';
import DatalistInput from '../ui-components/DatalistInput.vue'; // Import du nouveau composant
import SidebarSchedule from '../ui-components/sidebar.schedule.vue'; // Import du composant SidebarSchedule
import { getUserInfo } from '@/utils/auth';
import {
    createRendezVous,
    getAllRendezVous,
    getRendezVousByCentreId,
    getRendezVousByProfessionnelId,
    updateRendezVous,
    updateStatutRendezVous,
    deleteRendezVous
} from '@/utils/rendezVous';
import { getPatients, getPatientById } from '@/utils/patient'; // Pour récupérer la liste des patients
import { getAllMedecins, getProfessionnelById } from '@/utils/professionnel'; // Pour récupérer la liste des professionnels
import { initConsultation,initConsultationRdv, getConsultationsForPatientToday } from '@/utils/consultation'; // Import de la fonction initConsultation
import { useToast } from 'vue-toastification';

const toast = useToast();
const userInfo = getUserInfo();

const isModalActive = ref(false);
const isEditMode = ref(false); // Nouvelle variable pour le mode édition
const rendezVousList = ref([]);
const todayAppointments = ref([]);
const selectedAppointment = ref(null);
const searchQuery = ref('');

const patientsOptions = ref([]);
const professionnelsOptions = ref([]);

const scheduleTabs = ref(['Aujourd\'hui', 'À venir', 'Passés']);
const scheduleActiveTab = ref('');
const allAppointmentsFormatted = ref([]);

const today = new Date();
const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const minDate = getFormattedDate(today);
const maxDate = getFormattedDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));

const displayFormattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error("Invalid date string passed to displayFormattedDate:", dateString);
        return 'Date invalide';
    }
    return date.toLocaleDateString('fr-FR');
};

const newAppointment = ref({
    id_patient: '',
    nom_patient: '', // Pour l'affichage dans le datalist
    id_professionnel: '',
    nom_professionnel: '', // Pour l'affichage dans le datalist
    id_centre: userInfo.id_centre,
    date_rdv: minDate, // Définit la date par défaut à aujourd'hui
    heure_debut: '',
    heure_fin: null,
    motif_rdv: '',
    statut_rdv: 'Confirmé',
    notes_rdv: ''
});

const showModal = (edit = false, appointment = null) => {
    isModalActive.value = true;
    isEditMode.value = edit;
    if (edit && appointment) {
        selectedAppointment.value = appointment; // Garder une référence au rendez-vous original
        newAppointment.value = {
            id_rdv: appointment.id_rdv, // Ajouter l'ID pour la mise à jour
            id_patient: appointment.id_patient,
            nom_patient: `${appointment.patient_info?.nom} ${appointment.patient_info?.post_nom} ${appointment.patient_info?.prenoms}`,
            id_professionnel: appointment.id_professionnel,
            nom_professionnel: `${appointment.professional_info?.nom} ${appointment.professional_info?.prenoms} (${appointment.professional_info?.specialite})`,
            id_centre: appointment.id_centre,
            date_rdv: appointment.date_rdv ? getFormattedDate(new Date(appointment.date_rdv)) : minDate,
            heure_debut: appointment.heure_debut,
            heure_fin: appointment.heure_fin,
            motif_rdv: appointment.motif_rdv,
            statut_rdv: appointment.statut_rdv,
            notes_rdv: appointment.notes_rdv
        };
    } else {
        newAppointment.value = {
            id_rdv: null, // Assurer que l'ID est nul pour une nouvelle création
            id_patient: '',
            nom_patient: '',
            id_professionnel: '',
            nom_professionnel: '',
            id_centre: userInfo.id_centre,
            date_rdv: minDate,
            heure_debut: '',
            heure_fin: null,
            motif_rdv: '',
            statut_rdv: 'Confirmé',
            notes_rdv: ''
        };
    }
};

const closeModal = () => {
    isModalActive.value = false;
    isEditMode.value = false; // Réinitialiser le mode édition
    // selectedAppointment.value = null; // Réinitialiser le rendez-vous sélectionné
};

/**
 * Envoie un rendez-vous au triage.
 * Mettre à jour le statut du rendez-vous à "Arrivé".
 * Recharge la liste des rendez-vous.
 * Mettre à jour les consultations du patient.
 * Affiche une notification de succès ou d'erreur.
 * @returns {Promise<void>} 
 */
const sendToTriage = async () => {
    /**
     * Check if the selected appointment is valid.
     */
    if (!selectedAppointment.value) {
        toast.error("Veuillez sélectionner un rendez-vous à envoyer au triage.");
        return;
    }

    try {
        /**
         * Prepare the consultation data for the API request.
         */
        const consultationData = {
            id_patient: selectedAppointment.value.id_patient,
            id_professionnel: selectedAppointment.value.id_professionnel,
            id_rendez_vous: selectedAppointment.value.id_rdv,
            id_centre: selectedAppointment.value.id_centre,
            motif_consultation: selectedAppointment.value.motif_rdv,
            statut_consultation: 'En attente de constantes', // Statut initial pour le triage
            notes_consultation: selectedAppointment.value.notes_rdv,
            date_consultation: selectedAppointment.value.date_rdv,
            heure_debut: selectedAppointment.value.heure_debut,
            heure_fin: selectedAppointment.value.heure_fin,
        };
        
        /**
         * Initialize the consultation with the given data.
         */
        // await initConsultation(consultationData);
        await initConsultationRdv(consultationData)
        /**
         * Update the status of the appointment to "Arrivé".
         */
        await updateStatutRendezVous(selectedAppointment.value.id_rdv, 'Arrivé');
        toast.success("Rendez-vous envoyé au triage avec succès !");
        /**
         * Fetch the appointments for the current user.
         */
        fetchRendezVous();
        selectedAppointment.value.statut_rdv = "Arrivé";
        /**
         * Update the consultations for the patient.
         */
        try {
            selectedAppointment.value.haveConsultToday = await getConsultationsForPatientToday(selectedAppointment.value.id_patient);
        } catch (error) {
            console.error("Erreur lors de la mise à jour des consultations:", error);
            selectedAppointment.value.haveConsultToday = [];
        }

    } catch (error) {
        console.error("Erreur lors de l'envoi au triage:", error);
        toast.error("Erreur lors de l'envoi au triage.");
    }
};

/**
 * est appelé lorsque le tab de la sidebar est changé
 * Called when the tab is changed. This function is responsible for fetching the
 * rendez-vous associated with the new tab and updating the UI accordingly.
 * @param {string} tab The new tab, can be 'Aujourd\'hui', 'À venir' or 'Passés'
 */
const onTabChanged = (tab) => {
    scheduleActiveTab.value = tab;
    selectedAppointment.value = null;
}


/**
 * Fetch all rendez-vous for the current user
 * @param {string} tab The tab to fetch, can be 'Aujourd\'hui', 'À venir' or 'Passés'
 * @returns {Promise<void>} A promise that resolves when the rendez-vous are fetched
 */
const fetchRendezVous = async () => {

    try {
        let fetchedRendezVous = [];
        if (userInfo.type_professionnel === 'Médecin') {
            fetchedRendezVous = await getRendezVousByProfessionnelId(userInfo.id_professionnel);
        } else {
            fetchedRendezVous = await getAllRendezVous();
        }

        rendezVousList.value = fetchedRendezVous;
        console.log("rendezVousList.value", rendezVousList.value);

        const now = new Date();
        const todayIso = getFormattedDate(new Date());

        const todayRdv = [];
        const upcomingRdv = [];
        const pastRdv = [];

        for (const rdv of fetchedRendezVous) {
            const rdvDate = new Date(rdv.date_rdv);
            const rdvDateIso = getFormattedDate(rdvDate);
            console.log("rdvDateIso", rdvDateIso);

            let patient = {};
            try {
                const fetchedPatient = await getPatientById(rdv.id_patient);
                if (fetchedPatient) {
                    patient = fetchedPatient;
                }
            } catch (error) {
                console.error('Error fetching patient:', error);
            }

            let professionnel = {};
            try {
                const fetchedProfessionnel = await getProfessionnelById(rdv.id_professionnel);
                if (fetchedProfessionnel) {
                    professionnel = fetchedProfessionnel;
                }
            } catch (error) {
                console.error('Error fetching professionnel:', error);
            }

            const formattedRdv = {
                ...rdv,
                patient_info: {
                    id_patient: patient.id_patient,
                    nom: patient.nom,
                    post_nom: patient.post_nom,
                    prenoms: patient.prenoms,
                },
                professional_info: {
                    id_professionnel: professionnel.id_professionnel,
                    nom: professionnel.nom,
                    post_nom: professionnel.post_nom,
                    prenoms: professionnel.prenoms,
                    specialite: professionnel.specialite,
                },
                date_consultation: getFormattedDate(new Date(rdv.date_rdv)),
                id_consultation: rdv.id_rdv,
                date_rdv: getFormattedDate(new Date(rdv.date_rdv)), // Assurer que date_rdv est aussi formaté
            };
            // console.log("formattedRdv", formattedRdv);
            // console.log("rdvDateIso", rdvDateIso);
            // console.log("todayIso", todayIso);

            if (rdvDateIso === todayIso) {
                todayRdv.push(formattedRdv);
            } else if (rdvDate < now) {
                pastRdv.push(formattedRdv);
            } else {
                upcomingRdv.push(formattedRdv);
            }
        }

        allAppointmentsFormatted.value = [todayRdv, upcomingRdv, pastRdv];

        if (todayRdv.length > 0) {
            // selectedAppointment.value = todayRdv[0];
        } else {
            selectedAppointment.value = null;
        }

    } catch (error) {
        console.error("Erreur lors de la récupération des rendez-vous:", error);
        toast.error("Erreur lors de la récupération des rendez-vous.");
    }
};

/**
 * Récupère les listes des patients et des professionnels
 * @returns {Promise<void>} 
 */
const fetchPatientsAndProfessionals = async () => {
    try {
        const patients = await getPatients();
        patientsOptions.value = patients.map(p => ({
            id: p.id_patient,
            name: `${p.nom} ${p.post_nom} ${p.prenoms}`
        }));

        const professionnels = await getAllMedecins(); // Ou une autre fonction pour tous les professionnels
        professionnelsOptions.value = professionnels.map(p => ({
            id: p.id_professionnel,
            name: `${p.nom} ${p.prenoms} (${p.specialite})`
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des patients ou professionnels:", error);
        toast.error("Erreur lors de la récupération des listes.");
    }
};

const selectPatient = (data) => {
    newAppointment.value.id_patient = data.id;
};

const selectProfessional = (id) => {
    newAppointment.value.id_professionnel = id;
};

const selectAppointment = async (appointment) => {
    selectedAppointment.value = appointment;
    try{
        selectedAppointment.value.haveConsultToday = await getConsultationsForPatientToday(selectedAppointment.value.id_patient);
    } catch (error) {
        console.error("Erreur lors de la recherche des consultations:", error);
        selectedAppointment.value.haveConsultToday = [];
    }
};

const saveAppointment = async () => {
    try {
        const dataToSend = {
            id_patient: newAppointment.value.id_patient,
            id_professionnel: userInfo.id_professionnel,
            id_centre: newAppointment.value.id_centre,
            date_rdv: newAppointment.value.date_rdv,
            heure_debut: newAppointment.value.heure_debut,
            heure_fin: newAppointment.value.heure_fin,
            motif_rdv: newAppointment.value.motif_rdv,
            statut_rdv: newAppointment.value.statut_rdv || 'Confirmé',
            notes_rdv: newAppointment.value.notes_rdv
        };

        if (!dataToSend.id_patient || !dataToSend.id_professionnel) {
            toast.error("Veuillez sélectionner un patient et un professionnel valides.");
            return;
        }

        if (isEditMode.value) {
            await updateRendezVous(newAppointment.value.id_rdv, dataToSend);
            toast.success("Rendez-vous mis à jour avec succès !");
        } else {
            await createRendezVous(dataToSend);
            toast.success("Rendez-vous enregistré avec succès !");
        }

        closeModal();
        fetchRendezVous();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du rendez-vous:", error);
        toast.error("Erreur lors de l'enregistrement du rendez-vous.");
    }
};

const deleteAppointment = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
        try {
            await deleteRendezVous(id);
            toast.success("Rendez-vous supprimé avec succès !");
            fetchRendezVous();
        } catch (error) {
            console.error("Erreur lors de la suppression du rendez-vous:", error);
            toast.error("Erreur lors de la suppression du rendez-vous.");
        }
    }
};

const editAppointment = (appointment) => {
    showModal(true, appointment);
};



const printAppointment = () => {
    if (!selectedAppointment.value) return;

    const patientInfo = selectedAppointment.value.patient_info || {};
    const professionalInfo = selectedAppointment.value.professional_info || {};

    const nomPatient = `${patientInfo.nom || ''} ${patientInfo.post_nom || ''} ${patientInfo.prenoms || ''}`.trim();
    const nomDocteur = `${professionalInfo.nom || ''} ${professionalInfo.prenoms || ''}`.trim();
    const specialite = professionalInfo.specialite || '';
    const dateRdv = displayFormattedDate(selectedAppointment.value.date_rdv);
    const heureRdv = selectedAppointment.value.heure_debut;

    const content = `
PATIENT: ${nomPatient}
------------------------------
DOCTEUR : ${nomDocteur}
SPÉCIALITÉ : ${specialite} 
-------------------------------
DATE : ${dateRdv}
HEURE : ${heureRdv}
`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Impression Rendez-vous</title>
                    <style>
                        body {
                            font-family: monospace;
                            white-space: pre;
                            padding: 20px;
                        }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } else {
        toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    }
};

onMounted(() => {
    fetchRendezVous();
    fetchPatientsAndProfessionals();
});
</script>
<template>
    <div class="main-wrapper">
        <div class="container">
            <div class="header">
                <h1>Gestion des Rendez-vous</h1>
                <div>
                    <button class="btn btn-primary" v-if="userInfo.type_professionnel === 'Médecin'"
                        @click="showModal(false)"><i class="fa fa-plus"></i> Nouveau
                        Rendez-vous</button>
                        
                </div>
            </div>

            <div class="main-content">
                <!-- Panneau de la barre latérale pour la liste des rendez-vous -->
                <SidebarSchedule title="Rendez-vous" :items="allAppointmentsFormatted" :tabs="scheduleTabs"
                    @getdata="selectAppointment" @tab-changed="onTabChanged" />

                <!-- Panneau de détails du rendez-vous (prend le reste de l'espace) -->
                <div class="appointment-detail-panel">
                    <!-- <pre>{{ selectedAppointment }}</pre> -->
                    <div class="appointment-header" v-if="selectedAppointment">
                        <div>
                            <h1>Détails du Rendez-vous <span v-if="selectedAppointment?.haveConsultToday?.length != 0" class="status pending">en visite aujourd'hui</span></h1>
                            
                        </div>


                        <div>
                            <button class="btn btn-danger mr-2"
                                v-if="selectedAppointment && userInfo.type_professionnel === 'Médecin'"
                                @click="deleteAppointment(selectedAppointment.id_rdv)"><i class="fa fa-trash"></i>
                                Supprimer</button>

                            <button 
                                v-if="selectedAppointment" 
                                class="btn btn-primary" 
                                @click="printAppointment"><i class="fa fa-print"></i> Imprimer</button>

                            <button @click="sendToTriage"
                                :disabled="selectedAppointment?.haveConsultToday?.length != 0"
                                v-if="scheduleActiveTab === 'Aujourd\'hui' && userInfo.type_professionnel === 'Secrétaire Médical'"
                                class="btn btn-outline ml-2">Envoyer au triage</button>
                            <!-- <button @click="sendToTriage()" class="btn btn-outline ml-2">Envoyer au triage</button> -->
                        </div>
                    </div>

                    <!-- Grille d'informations de base sur le rendez-vous -->
                    <div class="appointment-info-grid" v-if="selectedAppointment">
                        <div class="appointment-info-card">
                            <strong>Rendez-vous</strong>
                            <p>
                                <strong>Date:</strong> {{ displayFormattedDate(selectedAppointment.date_rdv) }}<br>
                                <strong>Heure de début:</strong> {{ selectedAppointment.heure_debut }}<br>
                                <strong v-if="selectedAppointment.heure_fin">Heure de fin:</strong> {{
                                    selectedAppointment.heure_fin }}<br v-if="selectedAppointment.heure_fin">
                                <strong>Statut:</strong> <span :class="{
                                    'status pending': selectedAppointment.statut_rdv === 'Confirmé',
                                    'status completed': selectedAppointment.statut_rdv === 'Arrivé'
                                }"> {{ selectedAppointment.statut_rdv }} </span>
                            </p>
                        </div>
                        <div class="appointment-info-card">
                            <strong>Patient</strong>
                            <p>
                                <strong>Nom:</strong> {{ selectedAppointment.patient_info?.nom }} {{
                                    selectedAppointment.patient_info?.post_nom }} {{
                                    selectedAppointment.patient_info?.prenoms }}<br>
                                <strong>Contact:</strong> {{ selectedAppointment.patient_info?.telephone || 'N/A' }}
                            </p>
                        </div>
                        <div class="appointment-info-card">
                            <strong>Professionnel</strong>
                            <p>
                                <strong>Nom:</strong> {{ selectedAppointment.professional_info?.nom }} {{
                                    selectedAppointment.professional_info?.prenoms }}<br>
                                <strong>Spécialité:</strong> {{ selectedAppointment.professional_info?.specialite }}
                            </p>
                        </div>
                    </div>

                    <div class="section-header" v-if="selectedAppointment">
                        <h2>Motif du rendez-vous</h2>
                        <button v-if="userInfo.type_professionnel === 'Médecin'" class="btn btn-outline"
                            @click="editAppointment(selectedAppointment)"><i class="fa fa-edit"></i> Modifier</button>
                    </div>
                    <div class="card" v-if="selectedAppointment">
                        <p>{{ selectedAppointment.motif_rdv }}</p>
                        <h3 v-if="selectedAppointment.notes_rdv">Notes additionnelles</h3>
                        <p v-if="selectedAppointment.notes_rdv">{{ selectedAppointment.notes_rdv }}</p>
                    </div>

                    <div v-if="!selectedAppointment" class="card text-center"> <!-- Ajout de la classe text-center -->
                        <p>Sélectionnez un rendez-vous pour voir les détails.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modale pour ajouter/modifier un rendez-vous -->
    <div id="addAppointmentModal" class="modal-overlay" :class="{ 'active': isModalActive }" @click="closeModalOutside">
        <div class="modal-content animate__animated animate__fadeInDown animate__faster">
            <div class="modal-header">
                <h2>{{ isEditMode ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous' }}</h2>
                <button class="modal-close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body">
                <form @submit.prevent="saveAppointment">

                    <div class="d-flex justify-content-between">
                        <div class="form-group w-100 mr-3">
                            <label for="patientName">Patient</label>
                            <DatalistInput id="patientName"
                                :is_disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                                :options="patientsOptions" v-model="newAppointment.nom_patient" @select="selectPatient"
                                placeholder="Rechercher un patient" />
                        </div>
                        <!-- <div class="form-group w-100">
                            <label for="professionalName">Professionnel</label>
                            <DatalistInput id="professionalName" :is_disabled="userInfo.type_professionnel === 'Secrétaire Médical'" :options="professionnelsOptions"
                                v-model="newAppointment.nom_professionnel" @select="selectProfessional"
                                placeholder="Rechercher un professionnel" />
                        </div> -->
                    </div>

                    <div class="form-group">
                        <label for="appointmentDate">Date</label>
                        <input type="date" id="appointmentDate"
                            :disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                            v-model="newAppointment.date_rdv" :min="minDate" :max="maxDate" required>
                    </div>
                    <div class="form-group">
                        <label for="appointmentTime">Heure de début</label>
                        <input type="time" id="appointmentTime"
                            :disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                            v-model="newAppointment.heure_debut" required>
                    </div>
                    <!-- Champ pour l'heure de fin, optionnel pour l'instant -->
                    <div class="form-group">
                        <label for="appointmentEndTime">Heure de fin (optionnel)</label>
                        <input type="time" id="appointmentEndTime"
                            :disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                            v-model="newAppointment.heure_fin">
                    </div>
                    <div class="form-group">
                        <label for="appointmentReason">Motif du rendez-vous</label>
                        <textarea id="appointmentReason"
                            :disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                            v-model="newAppointment.motif_rdv" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="appointmentNotes">Notes (optionnel)</label>
                        <textarea id="appointmentNotes" :disabled="userInfo.type_professionnel === 'Secrétaire Médical'"
                            v-model="newAppointment.notes_rdv" rows="3"></textarea>
                    </div>
                    <div class="form-group" v-if="userInfo.type_professionnel == 'Medecin'">
                        <label for="appointmentStatus">Statut</label>
                        <select id="appointmentStatus" v-model="newAppointment.statut_rdv">
                            <option value="Confirmé" :disabled="userInfo.type_professionnel === 'Secrétaire Médical'">
                                Confirmé</option>
                            <option value="Arrivé">Arrivé</option>
                            <option value="Annulé" v-if="!userInfo.type_professionnel === 'Secrétaire Médical'">Annulé
                            </option>
                            <option value="Effectué" v-if="!userInfo.type_professionnel === 'Secrétaire Médical'">
                                Effectué</option>
                            <option value="Absent" v-if="!userInfo.type_professionnel === 'Secrétaire Médical'">Absent
                            </option>
                            <option value="Reporté">Reporté</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" @click="closeModal">Annuler</button>
                        <button type="submit" class="btn btn-primary">{{ isEditMode ? 'Mettre à jour' : 'Enregistrer'
                            }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
<style scoped>
/* Styles additionnels pour la mise en page spécifique de cette interface */
.appointment-detail-panel {
    flex-grow: 1;
    /* Prend l'espace restant */
    padding: 20px;
    overflow-y: auto;
}


.appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.appointment-header h1 {
    margin: 0;
    font-size: 24px;
    text-align: center;
    /* Centrer le titre */
}

.appointment-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.appointment-info-card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    font-size: 14px;
}

.appointment-info-card strong {
    display: block;
    margin-bottom: 5px;
    color: #586069;
}

/* Style pour les boutons d'action dans le panneau de détails */
.action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}
</style>
