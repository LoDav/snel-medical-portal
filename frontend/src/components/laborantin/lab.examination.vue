<script setup>
import { onMounted, ref, watch } from "vue";
import { getUserInfo } from '@/utils/auth';
import { handleFetchError, scrollToSection } from "../tools";
import { getDetailedPrescriptionsExamens, changeStatutExamen } from '@/utils/prescriptionsExamens'; // Import de la fonction API
import { createExamenMedical, getExamenDetailsByPrescriptionId } from '@/utils/examensMedicaux'; // Import de la fonction API pour les examens médicaux

import sidebarSchedule from "../ui-components/sidebar.schedule.vue";
import DashboardLink from "../ui-components/DashboardLink.vue";
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import PrelevementHistoriqueSection from "../ui-components/PrelevementHistoriqueSection.vue";
import HeaderUser from "../ui-components/HeaderUser.vue";

//toast
import { useToast } from 'vue-toastification';
const toast = useToast();


const examinations = ref([]); // Les données seront chargées depuis l'API
const examinationSelected = ref({});
const userInfo = getUserInfo();

const showFileUpload = ref(false);

watch(showFileUpload, (newVal) => {
    if (!newVal) {
        examinationForm.value.fichier_resultat = null;
    }
});

const examinationForm = ref({
    id_examen: '',
    id_patient: '', // Add this
    id_consultation: null, // Add this, can be null
    id_professionnel: '', // Add this
    type_examen: '', // Add this
    nom_examen: '', // Add this
    date_examen: '', // Add this
    resultats: null, // Changed from 'resultat' to 'resultats'
    fichier_resultat_url: null, // Changed from 'fichier_resultat'
    compte_rendu: null, // Changed from 'notes_laborantin' to 'compte_rendu'
    //statut_examen: 'En cours',  // Removed this, as it should not be part of the exam data
    //fichier_resultat: null, // Ajout du champ pour le fichier // Removed this as it's not part of the exam
});


const endExamination = async (index) => {
    const exam = examinationSelected.value
    console.log('Examen sélectionné avant création:', exam);
    console.log(exam.all_exams[index].medecin.id_professionnel);

    examinationForm.value.id_patient = exam.patient_info.id_patient
    examinationForm.value.id_consultation = exam.all_exams[index].consultation.id_consultation
    examinationForm.value.id_professionnel = exam.all_exams[index].medecin.id_professionnel //userInfo.id_professionnel // Remplacer par l'ID du professionnel connecté
    examinationForm.value.type_examen = exam.all_exams[index].type_examen
    examinationForm.value.nom_examen = exam.all_exams[index].nom_examen
    examinationForm.value.date_examen = new Date().toISOString().slice(0, 19).replace('T', ' ');
    examinationForm.value.id_prescription_examen = exam.all_exams[index].id_prescription_examen

    console.log(examinationForm.value);

    const champsObligatoires = [
        examinationForm.value.resultats,
    ];

    const tousChampsRemplis = champsObligatoires.every(champ =>
        champ !== null && champ !== undefined && champ !== ''
    );

    if (!tousChampsRemplis) {
        alert('Veuillez saisir les résultats de l\'examen.');
        return;
    }

    try {
        await createExamenMedical(
            {
                id_patient: examinationForm.value.id_patient,
                id_consultation: examinationForm.value.id_consultation || null,
                id_professionnel: examinationForm.value.id_professionnel,
                type_examen: examinationForm.value.type_examen,
                nom_examen: examinationForm.value.nom_examen,
                date_examen: examinationForm.value.date_examen,
                resultats: examinationForm.value.resultats,
                compte_rendu: examinationForm.value.compte_rendu || null,
                id_prescription_examen: examinationForm.value.id_prescription_examen || null
            },
            examinationForm.value.fichier_resultat
        );

        alert('resultat enregistré avec succès !');
        examinationSelected.value = {};
        await changeStatutExamen(examinationForm.value.id_prescription_examen, 'Réalisé')
        getData(); // Rafraîchir la liste
    } catch (error) {
        console.error('Erreur lors de la création de l\'examen médical:', error);
        handleFetchError(error, "Erreur lors de la création de l'examen médical.");
    }
};

async function getSelectedData(data) {
    examinationSelected.value = data;

    for (let i = 0; i < data.all_exams.length; i++) {
        try {
            examinationSelected.value.all_exams[i].resultat_examen = await getExamenDetailsByPrescriptionId(data.all_exams[i].id_prescription_examen);
        } catch (error) {
            console.warn(error, "Erreur lors de la recherche des résultats de l'examen.");
            examinationSelected.value.all_exams[i].resultat_examen = {};
        }

    }

    // Pré-remplir le formulaire avec les données de l'examen sélectionné
    examinationForm.value.resultats = data.resultat_examen?.resultats || null; // Accéder au résultat_examen
    examinationForm.value.compte_rendu = data.resultat_examen?.compte_rendu || null; // Utiliser compte_rendu comme notes
    examinationForm.value.fichier_resultat_url = null; // Réinitialiser le fichier lors de la sélection d'un nouvel examen
}

const handleFileSelected = (event) => {
    const file = event.target?.files?.[0] || event;
    examinationForm.value.fichier_resultat = file;
    console.log("Fichier sélectionné dans le parent:", file);
};

async function getData() {
    try {
        const detailedExams = await getDetailedPrescriptionsExamens();

        let allExams = [];
        detailedExams.forEach(center => {
            center.prescriptions_examens.forEach(exam => {
                allExams.push({
                    ...exam,
                    centre_info: {
                        id_centre: center.id_centre,
                        nom_centre: center.nom_centre,
                        adresse: center.centre_adresse,
                        telephone: center.centre_telephone
                    }
                });
            });
        });

        // Regrouper les examens par patient
        const examsByPatient = allExams.reduce((acc, exam) => {
            const patientId = exam.patient_info.id_patient;
            if (!acc[patientId]) {
                acc[patientId] = {
                    patient_info: exam.patient_info,
                    id_patient: patientId, // Pour la clé dans la sidebar
                    date_demande: exam.date_demande, // Date la plus récente pour le tri
                    all_exams: []
                };
            }
            acc[patientId].all_exams.push(exam);
            // Mettre à jour la date de demande si l'examen actuel est plus récent
            if (new Date(exam.date_demande) > new Date(acc[patientId].date_demande)) {
                acc[patientId].date_demande = exam.date_demande;
            }
            return acc;
        }, {});

        const groupedExams = Object.values(examsByPatient);

        // Filtrer les examens pour chaque onglet en se basant sur le statut des examens individuels
        let enAttenteRes = groupedExams.filter(patientGroup =>
            patientGroup.all_exams.some(exam => exam.statut_examen === 'Demandé')
        );
        // let enCoursRes = groupedExams.filter(patientGroup =>
        //     patientGroup.all_exams.some(exam => exam.statut_examen === 'En cours')
        // );
        let termineesRes = groupedExams.filter(patientGroup =>
            patientGroup.all_exams.some(exam => exam.statut_examen === 'Réalisé')
        );

        examinations.value = [
            enAttenteRes,
            // enCoursRes,
            termineesRes,
        ];
        console.log("Examens chargés pour les onglets :", examinations.value);

    } catch (error) {
        console.error("Erreur lors de la récupération des examens détaillés:", error);
        handleFetchError(error, "Erreur lors de la récupération des examens.");
        examinations.value = [[], [], []]; // Réinitialiser en cas d'erreur
    }
}
const currentTab = ref('');
const onTabChanged = (index) => {
    examinationSelected.value = {};
    currentTab.value = index;
};

// Fonction pour obtenir l'URL du fichier qui peut etre le scan d'un examen ou le fichier de l'exam
const getFileUrl = (path) => {
    if (!path) return '';
    return `http://localhost:3000${path}`;
};

onMounted(() => {
    getData();

});
</script>

<template>
    <nav>
        <div class="navbar animate__animated animate__fadeIn">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/laborantin/tableau-de-bord" />
                <DashboardLink text="Examens" icon="medkit" to="/laborantin/examens" :active="true" />
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
                    <h1>Gestion des Examens</h1>

                </div>
            </div>

            <div class="main-content">
                <sidebarSchedule
                    title="Examens par Patient"
                    :items="examinations"
                    :tabs="['Demandé', 'Réalisé']"
                    @getdata="getSelectedData"
                    @tab-changed="onTabChanged"
                    :preselected="examinationSelected?.id_patient" />

                <div class="detail-panel main-panel" v-if="JSON.stringify(examinationSelected) != '{}'">

                    <!-- <pre>{{ examinations }}</pre> -->
                    <!-- <pre>{{ examinationSelected }}</pre> -->

                    <section class="dossier-section">
                        <div class="dossier-header">
                            <h2>Examens de {{ examinationSelected.patient_info?.nom }} {{
                                examinationSelected.patient_info?.prenoms }}</h2>
                        </div>
                        <ul>
                            <li>
                                <span>ID Patient : <span style="text-transform: uppercase;">{{
                                    examinationSelected.patient_info?.id_patient }}</span></span>
                            </li>
                            <li>
                                Date de naissance : {{ new
                                    Date(examinationSelected.patient_info?.date_naissance).toLocaleDateString() }}
                            </li>
                            <li>
                                Sexe : {{ examinationSelected.patient_info?.sexe }}
                            </li>
                            <li>
                                Nombre d'Examen : {{ examinationSelected.all_exams.length }}
                            </li>
                        </ul>
                    </section>

                    <PrelevementHistoriqueSection :patientId="examinationSelected.patient_info.id_patient"
                        :exams="examinationSelected.all_exams" />

                    <section class=" dossier-section mt-1">
                        <div class="dossier-section-header">
                            <h2>Liste des Examens pour ce Patient</h2>
                        </div>
                        <section v-for="exam, i in examinationSelected.all_exams" :key="exam.id_prescription_examen">
                            <div class="medication-list-item mb-3" v-if="exam.statut_examen === 'Demandé' && currentTab === 'Demandé' || exam.statut_examen === 'Réalisé' && currentTab === 'Réalisé'">

                                <div class="dossier-section-header">
                                    <h4>Examen: {{ exam.nom_examen }} ({{ exam.type_examen }})<br>Statut: <span
                                            class="status"
                                            :class="{ 'completed': exam.statut_examen === 'Réalisé', 'danger': exam.statut_examen === 'Demandé' }">{{
                                                exam.statut_examen }}</span> </h4>
                                    <span>#{{ i + 1 }}</span>
                                </div>

                                <ul>
                                    <li><span>Date de demande: {{ new Date(exam.date_demande).toLocaleDateString()
                                    }}</span></li>
                                    <li>
                                        <span>
                                            Priorité: <span :class="{
                                                'status completed': exam.priorite === 'Normale',
                                                'status danger': exam.priorite === 'Urgente'
                                            }">{{ exam.priorite }}</span>
                                        </span>
                                    </li>
                                    <li>Instructions : {{ exam.instructions || 'Aucune' }}</li>
                                    <li>Médecin prescripteur : Dr . {{ exam.medecin?.nom }} {{ exam.medecin?.prenoms }}
                                    </li>
                                    <li>Consultation du : {{ exam.consultation?.date_consultation }}</li>
                                    <!-- <li>Statut : {{ exam.statut_examen }}</li> -->
                                </ul>
                                <div v-if="exam.statut_examen === 'Réalisé'">
                                    <h4>Détails des Résultats d'Examen</h4>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type d'examen</th>
                                                <th>Nom de l'examen</th>
                                                <th>resultat</th>
                                                <th>compte rendu</th>
                                                <th>url du fichier</th>
                                                <th>date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="value in exam.resultat_examen">
                                                <td>{{ value.type_examen }}</td>
                                                <td>{{ value.nom_examen }}</td>
                                                <td>{{ value.resultats }}</td>
                                                <td>{{ value.compte_rendu }}</td>
                                                <td class="text-center">
                                                    <a v-if="value.fichier_resultat_url" :href="getFileUrl(value.fichier_resultat_url)" target="_blank" class="btn btn-sm btn-outline-primary" title="Voir le fichier">
                                                        <i class="fa fa-eye"></i>
                                                    </a>
                                                    <span v-else class="text-muted">-</span>
                                                </td>
                                                <td>{{ new Date(value.date_examen).toLocaleDateString() }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div v-if="exam.statut_examen === 'En cours' || exam.statut_examen === 'Demandé'">
                                    <h4>Saisie des Résultats</h4>
                                    <form @submit.prevent="endExamination(i)">
                                        <!-- <FileInput :titre="'Fichier de résultat'" @file-selected="handleFileSelected" /> -->
                                        <div class="form-group mt-3">
                                            <label :for="`resultat-${exam.id_prescription_examen}`">Résultat de
                                                l'examen</label>
                                            <textarea :id="`resultat-${exam.id_prescription_examen}`"
                                                v-model="examinationForm.resultats" rows="5"
                                                placeholder="Saisir les résultats détaillés de l'examen"></textarea>
                                        </div>

                                        <div class="form-group">
                                            <label :for="`notes-${exam.id_prescription_examen}`">Notes du laborantin
                                                (Compte rendu)</label>
                                            <textarea :id="`notes-${exam.id_prescription_examen}`"
                                                v-model="examinationForm.compte_rendu" rows="3"
                                                placeholder="Ajouter des notes ou observations supplémentaires"></textarea>
                                        </div>
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="toggleFile"
                                                v-model="showFileUpload">
                                            <label class="form-check-label" for="toggleFile"> Joindre un fichier </label>
                                        </div>

                                        <div class="form-group" v-if="showFileUpload">
                                            <label class="d-block font-weight-bold mb-2">Fichier de résultat</label>
                                            <label for="fichier_resultat" class="w-100 cursor-pointer mb-0">
                                                <div class="file-upload-zone">
                                                    <div class="upload-icon mb-2">
                                                        <i v-if="!examinationForm.fichier_resultat" class="fa fa-cloud-upload" style="font-size: 2rem; opacity: 0.6;"></i>
                                                        <i v-else class="fa fa-file-text" style="font-size: 2rem; color: var(--success-color, #28a745);"></i>
                                                    </div>
                                                    
                                                    <div v-if="!examinationForm.fichier_resultat">
                                                        <h6 class="mb-1">Cliquez pour sélectionner un fichier</h6>
                                                        <small class="text-muted d-block">PDF, JPG, PNG acceptés</small>
                                                    </div>
                                                    <div v-else>
                                                        <h6 class="text-success mb-1" style="word-break: break-all;">
                                                            {{ examinationForm.fichier_resultat.name }}
                                                        </h6>
                                                        <small class="text-muted">Cliquez pour remplacer le fichier</small>
                                                    </div>
                                                </div>
                                            </label>
                                            <input type="file" id="fichier_resultat" @change="handleFileSelected" style="display: none;" accept=".pdf,image/*" />
                                        </div>

                                        <div class="text-right">
                                            <button type="submit" class="btn btn-primary"><i class="fa fa-check"></i>
                                                Enregistrer et Terminer l'examen</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </section>

                    </section>
                </div>

                <div v-else style="
                    margin-top: 50px;
                    text-align: center;
                    color: var(--gh-text-color-secondary);
                    display: flex;
                    justify-content: center;
                    min-width: 100vh;">
                    <div>
                        <i class="fa fa-arrow-left" style="font-size: 2em; margin-bottom: 10px;"></i>
                        <p>Sélectionnez un patient dans la liste pour voir ses examens et saisir les résultats.</p>
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

/* .sidebar {
    margin: 15px 0px 15px 15px;
    width: 300px;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    overflow-y: auto;
} */

.medication-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.medication-list-item {
    /* overflow: auto;
    max-height: 60vh; */
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

.medoc-list {
    max-height: 40vh;
    overflow-y: auto;
}

.file-upload-zone {
    border: 2px dashed var(--gh-border-color);
    border-radius: 8px;
    padding: 25px;
    text-align: center;
    cursor: pointer;
    background-color: var(--gh-card-bg);
    transition: all 0.2s ease;
}

.file-upload-zone:hover {
    border-color: var(--primary-color, #0d6efd);
    background-color: rgba(13, 110, 253, 0.05);
}

.cursor-pointer {
    cursor: pointer;
}
</style>
