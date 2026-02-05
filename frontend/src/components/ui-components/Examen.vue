<script setup>
/**
 * @description Composant pour afficher/demander des examens médicaux d'un patient.
 * Permet de lier les examens à une consultation sélectionnée.
 * @component   Examen.vue
 * @author      Ôkami alias @Necromastery 
 * @version     1.0.0
 * @date        2024-09-02
 */

import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { getUserInfo } from '@/utils/auth';
import { createPrescriptionWithExamen, deletePrescription, getPrescriptionsWithExamsByConsultationId } from '@/utils/prescription';
import { getExamenDetailsByPrescriptionId } from '@/utils/examensMedicaux';
import { scrollToSection } from '../tools';
import PrintExam from './PrintExam.vue'; // Importation du composant PrintExam
import ExamenResultatDetail from './ExamenResultatDetail.vue'; // Importation du composant d'affichage détaillé des résultats


const props = defineProps({
    consultation: {
        type: Object,
        required: true
    },
    patient: { // Ajout de la prop patient
        type: Object,
        required: true
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const examens = ref([]);

const toast = useToast();
const userData = getUserInfo();

const examensList = ref([
    "Glycose", "Urée", "Acide urique", "Créatinine", "Cholestérol (LD)", "Lipides totaux",
    "Protéines totales", "Albumine", "Globulines", "Rapport A/G", "Bilirubine tot",
    "Bilirubine dir.", "Bilirubine ind.", "Fer sérique", "SGPT (ALAT)", "SGOT (ASAT)",
    "Phosph Alc", "Amylases", "Gamma (GT)", "HBAEC", "Hb", "Ht", "GR", "GB", "VS", "FL",
    "CRP", "Electrophorèse d'Hb", "Temps de saig (TS)", "Temps de coag (TC)",
    "Groupe ABO Rhésus", "Coombs direct", "Coombs indirect", "Test de compatibilité",
    "HIV (rapide ou Elisa)", "VDRL", "HVC (rapide ou Elisa)", "Hbs Ao (rapide ou Elisa)",
    "TO", "TH", "Widal", "ASLO", "FR", "Test de grossesse", "Plasma", "Sang complet",
    "Sang frais", "H Pylori sang", "H Pylori selles", "PSA Direct (Test)", "PSA Dosage",
    "Rivalta", "Protéines", "Glucose", "Chlorure", "Cytologie", "Bandella urinaire",
    "Rés. Alc", "Chlorures", "Sodium", "Potacium", "Calcium", "Mg+", "GE", "TDR",
    "TDR TH", "Sédiment Urinaire"
]);

// UI State
const showExamForm = ref(false);
const showDatalist = ref(false);
const activeExamenIndex = ref(0);
const showPrintViewExam = ref(false); // Nouvelle variable pour la vue d'impression des examens
const selectedPrescriptionForPrintExam = ref(null); // Nouvelle variable pour la prescription sélectionnée à imprimer

const openPrintViewExam = (prescription) => {
    selectedPrescriptionForPrintExam.value = {
        ...prescription,
        // Les informations du patient sont déjà dans props.patient
        // Les informations du professionnel sont déjà dans prescription
        centre: props.consultation.centre_info || 'Centre Médical SNEL'
    };
    showPrintViewExam.value = true;
};

// Form state
const examensForm = ref({
    prescription: {
        id_consultation: '',
        id_professionnel: userData.id_professionnel,
        date_prescription: '',
        statut_prescription: 'Active',
        notes_supplementaires: ''
    },
    examens: [
        {
            id_patient: '',
            type_examen: '', // 'Laboratoire' | 'Imagerie' | 'Fonctionnel'
            nom_examen: '',
            instructions: '',
            priorite: 'Normale', // Normale | Haute | Urgente (côté app)
            date_demande: ''
        }
    ]
});

const deletePrescriptionExamen = async (id_prescription) => {
    // Code pour supprimer la prescription
    try {
        await deletePrescription(id_prescription);
        showExamForm.value = false;
        fetchExamens();
        toast.success('Prescription supprimée avec succès !');
    } catch (error) {
        toast.error("Erreur lors de la suppression de la prescription.");
        console.error("Erreur lors de la suppression de la prescription :", error);
    }
}

onMounted(() => {
    // Pré-remplir avec la consultation sélectionnée
    if (props.consultation?.id_consultation) {
        examensForm.value.prescription.id_consultation = props.consultation.id_consultation;
        examensForm.value.prescription.date_prescription = new Date().toISOString();
        examensForm.value.examens[0].id_patient = props.consultation.id_patient;
        examensForm.value.examens[0].date_demande = new Date().toISOString();
    }
});

// Ajouter/Supprimer des examens
const addExamen = () => {
    examensForm.value.examens.push({
        id_patient: props.consultation.id_patient,
        type_examen: '',
        nom_examen: '',
        instructions: '',
        priorite: 'Normale',
        date_demande: new Date().toISOString()
    });
};

const removeExamen = (index) => {
    if (examensForm.value.examens.length > 1) {
        examensForm.value.examens.splice(index, 1);
    }
};

const filteredExamens = computed(() => {
    const currentExamen = examensForm.value.examens[activeExamenIndex.value];
    if (!currentExamen || !currentExamen.nom_examen) {
        return examensList.value;
    }
    const searchTerm = currentExamen.nom_examen.toLowerCase();
    return examensList.value.filter(examen =>
        examen.toLowerCase().includes(searchTerm)
    );
});

const selectExamen = (examen, index) => {
    const currentExamen = examensForm.value.examens[activeExamenIndex.value];
    if (currentExamen) {
        currentExamen.nom_examen = examen;
    }
    showDatalist.value = false;
};

const hideDatalist = () => {
    setTimeout(() => {
        showDatalist.value = false;
    }, 200); // Delay to allow click event on list item
};

const hasExamens = computed(() => {
    return examens.value.some(p => p.examens && p.examens.length > 0);
});

const fetchExamens = async () => {
    try {
        // Récupérer les prescriptions avec les examens
        const prescriptions = await getPrescriptionsWithExamsByConsultationId(props.consultation.id_consultation);

        if (!prescriptions || prescriptions.length === 0) {
            examens.value = [];
            return;
        }

        // Traiter chaque prescription et ses examens
        const processedPrescriptions = await Promise.all(
            prescriptions.map(async (prescription) => {
                if (!prescription.examens || prescription.examens.length === 0) {
                    return prescription;
                }

                // Récupérer les détails de chaque examen en parallèle
                const examensWithResults = await Promise.all(
                    prescription.examens.map(async (examen) => {
                        try {
                            const resultDetails = await getExamenDetailsByPrescriptionId(examen.id_prescription_examen);
                            return {
                                ...examen,
                                resultat_examen: resultDetails || null
                            };
                        } catch (error) {
                            console.warn(`Erreur lors de la récupération des résultats pour l'examen ${examen.id_prescription_examen}:`, error);
                            return {
                                ...examen,
                                resultat_examen: null
                            };
                        }
                    })
                );

                return {
                    ...prescription,
                    examens: examensWithResults
                };
            })
        );

        examens.value = processedPrescriptions;

    } catch (error) {
        console.error("Erreur lors du chargement des examens :", error);
        examens.value = [];
        // toast.error("Erreur lors du chargement des examens. Veuillez réessayer.");
    }
}

//sauvegarder les examens
const handleSaveExamens = async () => {
    // Validation minimale
    const examsValides = examensForm.value.examens.filter(e => e.type_examen && e.nom_examen);
    if (!props.consultation.id_consultation) {
        toast.warning("Veuillez d'abord sélectionner une consultation.");
        return;
    }
    if (examsValides.length === 0) {
        toast.warning("Veuillez ajouter au moins un examen avec son type et son nom.");
        return;
    }

    const dataToSend = {
        prescription: examensForm.value.prescription,
        examens: examsValides
    }
    console.log(dataToSend);
    try {
        await createPrescriptionWithExamen(dataToSend);
        toast.success('Prescription d\'examens enregistrée avec succès !');
        showExamForm.value = false;
        fetchExamens();
        // Reset léger en gardant la consultation
        examensForm.value = {
            prescription: {
                id_consultation: props.consultation.id_consultation,
                id_professionnel: userData.id_professionnel,
                date_prescription: new Date().toISOString(),
                statut_prescription: 'Active',
                notes_supplementaires: ''
            },
            examens: [
                {
                    id_patient: props.consultation.id_patient,
                    type_examen: '',
                    nom_examen: '',
                    instructions: '',
                    priorite: 'Normale',
                    date_demande: new Date().toISOString()
                }
            ]
        };
    } catch (error) {
        console.error(error);
        toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
};

const openExamForm = () => {

    showExamForm.value = !showExamForm.value;

    setTimeout(() => {
        scrollToSection('edit-examen-form')
    }, 100)
}

// (Données factices d'affichage)


onMounted(async () => {
    // Charger les examens existants (simulé ici avec des données factices)
    // Dans une vraie application, vous feriez un appel API pour récupérer les examens du patient

    fetchExamens();

    // if (props.consultation?.id_consultation) {
    //     try{
    //         examens.value = await getPrescriptionsWithExamsByConsultationId(props.consultation.id_consultation);
    //         console.log(examens.value);
    //     }catch(error){
    //         console.error("Erreur lors du chargement des examens :", error);
    //     }
    // }
});

</script>
<template>
    <div v-if="showPrintViewExam">
        <button class="btn btn-outline mb-3" @click="showPrintViewExam = false">Retour</button>
        <PrintExam :prescription="selectedPrescriptionForPrintExam" :patient="props.consultation.patient_info" />
    </div>
    <section v-else class="medication-list-item animate__animated animate__fadeIn">
        <div class="dossier-section-header">
            <h4>Examens</h4>
            <button class="btn btn-primary" @click="openExamForm" :disabled="props.disabled">Demander un examen</button>
        </div>
        <div>
            <!-- <pre>{{ examens }}</pre> -->
            <ul class="medication-list">
                <template v-for="prescription in examens" :key="prescription.id_prescription">
                    <div v-if="prescription.examens && prescription.examens.length > 0">
                        <span>Prescription n° <small style="font-weight: bold; text-transform: uppercase;"> {{
                            prescription.id_prescription }} </small></span><br>
                        <span>Date prescription : {{ new Date(prescription.date_prescription).toLocaleDateString()
                        }}</span>
                        <table class="data-table mb-3">
                            <thead>
                                <tr>
                                    <th>Type d'examen</th>
                                    <th>Nom de l'examen</th>
                                    <th>Priorité</th>
                                    <th>Statut</th>
                                    <th>Date de la demande</th>
                                    <!-- <th>Date de réalisation</th>
                                    <th>Résultats</th> -->
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="exam in prescription.examens" :key="exam.id_prescription_examen">
                                    <td>{{ exam.type_examen }}</td>
                                    <td>{{ exam.nom_examen }}</td>
                                    <td>{{ exam.priorite }}</td>
                                    <td>{{ exam.statut_examen }}</td>
                                    <td>{{ new Date(exam.date_demande).toLocaleDateString() }}</td>
                                    <!-- <td v-if="exam.resultat_examen && exam.resultat_examen.date_examen">{{ new
                                        Date(exam.resultat_examen.date_examen).toLocaleDateString() }}</td>
                                    <td v-else>N/A</td>
                                    <td v-if="exam.resultat_examen && exam.resultat_examen.resultats">{{
                                        exam.resultat_examen.resultats }}</td>
                                    <td v-else>N/A</td> -->
                                </tr>
                            </tbody>
                        </table>

                        <div id="exam-results"
                            v-if="prescription.examens && prescription.examens.some(ex => ex.resultat_examen && ex.resultat_examen.length > 0)">
                            <h4>Détails des résultats</h4>
                            <ExamenResultatDetail
                                :prescription="prescription"
                                :patient="props.patient" />
                        </div>
                        <div v-else class="text-center text-muted">
                            <h4>Résultats non disponibles pour le moment</h4>
                        </div>

                        <div class="text-right mt-3" v-if="!prescription.examens.some(ex => ex.resultat_examen && ex.resultat_examen.length > 0)">
                            <button class="btn btn-outline" @click="openPrintViewExam(prescription)">Imprimer</button>
                            <button class="btn btn-danger ml-2"
                                @click="deletePrescriptionExamen(prescription.id_prescription)">supprimer</button>
                        </div>
                        <hr>
                    </div>
                </template>
            </ul>
            <div v-if="!hasExamens && !showExamForm" class="empty-state">
                <i class="fas fa-vial-virus empty-icon"></i>
                <p>Aucun examen n'a été prescrit pour cette consultation.</p>
                <small>Pour prescrire un examen, cliquez sur le bouton "Demander un examen".</small>
            </div>
        </div>
    </section>

    <section v-if="showExamForm" class="medication-list-item animate__animated animate__fadeIn">
        <div class="dossier-section-header" id="edit-examen-form">
            <h4>Prescription d'examens</h4>
        </div>

        <form @submit.prevent="handleSaveExamens">
            <div class="medoc-list">
                <div v-for="(ex, index) in examensForm.examens" :key="index" class="medication-list-item">
                    <div class="dossier-section-header">
                        <h4>Examen #{{ index + 1 }}</h4>
                        <button v-if="examensForm.examens.length > 1" class="btn text-danger" type="button"
                            @click="removeExamen(index)">&times;</button>
                    </div>

                    <div class="">

                        <div class="form-group w-100">
                            <label>Nom de l'examen</label>
                            <div class="custom-datalist-container">
                                <input type="text" placeholder="Ex: NFS, Radiographie Thoracique"
                                    v-model="examensForm.examens[index].nom_examen"
                                    @focus="activeExamenIndex = index; showDatalist = true" @blur="hideDatalist"
                                    autocomplete="off" />
                                <ul v-if="showDatalist && activeExamenIndex === index && filteredExamens.length"
                                    class="custom-datalist animate__animated animate__fadeIn">
                                    <li v-for="(examen, examenIndex) in filteredExamens" :key="examenIndex"
                                        @mousedown="selectExamen(examen, index)">
                                        {{ examen }}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="form-group w-100 mr-3">
                            <label>Type d'examen</label>
                            <select v-model="examensForm.examens[index].type_examen">
                                <option value="">-- Choisir --</option>
                                <option>Laboratoire</option>
                                <option>Imagerie</option>
                                <option>Fonctionnel</option>
                                <option>Autre</option>
                            </select>
                        </div>

                    </div>

                    <div class="d-flex-normal">
                        <div class="form-group w-100 mr-3">
                            <label>Priorité</label>
                            <select v-model="examensForm.examens[index].priorite">
                                <option>Normale</option>
                                <option>Urgente</option>
                            </select>
                        </div>
                        <div class="form-group w-100">
                            <label>Instructions</label>
                            <input type="text" placeholder="Instructions spécifiques pour l'examen"
                                v-model="examensForm.examens[index].instructions" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-right">
                <button class="btn btn-primary mr-2" type="button" @click="addExamen">+ Ajouter un examen</button>
            </div>

            <div class="form-group">
                <label for="notes_supplementaires">Notes supplémentaires</label>
                <textarea id="notes_supplementaires"
                    v-model="examensForm.prescription.notes_supplementaires"></textarea>
            </div>

            <div class="text-right">
                <button class="btn btn-primary" type="submit">Enregistrer</button>
            </div>
        </form>
    </section>
</template>
<style scoped>
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
    padding-bottom: 10px;
}

.medoc-list {
    max-height: 40vh;
    overflow-y: auto;
}

.custom-datalist-container {
    position: relative;
}

.custom-datalist {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--gh-sidebar-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    list-style: none;
    padding: 0;
    margin: 5px 0 0 0;
    max-height: 150px;
    overflow-y: auto;
    z-index: 1000;
}

.custom-datalist li {
    padding: 10px;
    cursor: pointer;
}

.custom-datalist li:hover {
    background-color: var(--gh-ni-bg);
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--gh-text-color-secondary);
}

.empty-icon {
    font-size: 3em;
    margin-bottom: 15px;
    color: var(--gh-text-color-secondary);
}
</style>
