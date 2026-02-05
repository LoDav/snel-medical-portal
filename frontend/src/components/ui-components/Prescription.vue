<script setup>
import { ref, onMounted, computed } from 'vue';
import { getUserInfo } from '@/utils/auth';

import { createPrescriptionWithLines, getPrescriptionsByConsultation,deletePrescription } from '@/utils/prescription';
import { getExpiringMedicaments } from "@/utils/stockMedicament";
import { getAllMedicaments } from "@/utils/medicament";
import { scrollToSection } from '../tools';
import PrintPrescription from './PrintPrescription.vue';

const props = defineProps({
    consultation: Object,
    disabled: {
        type: Boolean,
        default: false
    }
})

const userDate = getUserInfo();
const showPrescriptionForm = ref(false);
const prescriptions = ref([]);
const showPrintView = ref(false);
const selectedPrescriptionForPrint = ref(null);
const expiringMedicaments = ref([]);

// Ouvrir la vue d'impression pour une prescription spécifique
const openPrintView = (prescription) => {
    selectedPrescriptionForPrint.value = {
        ...prescription,
        nom_patient: props.consultation.patient_info.nom,
        prenom_patient: props.consultation.patient_info.prenoms,
        nom_professionnel: `${props.consultation.professionnel_info.prenoms} ${props.consultation.professionnel_info.nom}`,
        specialite_professionnel: props.consultation.professionnel_info.specialite,
        nom_centre: props.consultation.centre_info.nom_centre
    };
    showPrintView.value = true;
};

// Formulaire de prescription
const prescriptionForm = ref({
    id_consultation: '',
    id_professionnel: userDate.id_professionnel,
    date_prescription: '',
    statut_prescription: 'Active',
    notes_supplementaires: '',
    lignes: [
        {
            id_medicament: '',
            nom_medicament: '',
            dosage_medicament: '',
            forme_medicament: '',
            description_medicament: '',
            posologie: '',
            quantite_prescrite: 1,
            duree_traitement_jours: 1,
            notes_specifiques: ''
        }
    ]
});

// Ajouter une ligne au formulaire de prescription
const addLigne = (id) => {
    prescriptionForm.value.lignes.push(
        {
            id_medicament: '',
            nom_medicament: '',
            dosage_medicament: '',
            forme_medicament: '',
            description_medicament: '',
            posologie: '',
            quantite_prescrite: 1,
            duree_traitement_jours: 1,
            notes_specifiques: ''
        }
    );

    setTimeout(() => {
        scrollToSection('ligne-'+(id+1));
        console.log("ligne-"+(id));

    }, 100);
};
//retirer une ligne du formulaire de prescription
const removeLigne = (index) => {
    if (prescriptionForm.value.lignes.length > 1) {
        prescriptionForm.value.lignes.splice(index, 1);
    }
};


const showDatalist = ref(false);
const activeLigneIndex = ref(0);

const filteredMedicaments = computed(() => {
    const currentLigne = prescriptionForm.value.lignes[activeLigneIndex.value];
    if (!currentLigne || !currentLigne.nom_medicament) {
        return medicaments.value;
    }
    const searchTerm = currentLigne.nom_medicament.toLowerCase();
    return medicaments.value.filter(medicament =>
        (medicament.nom_commercial && medicament.nom_commercial.toLowerCase().includes(searchTerm)) ||
        (medicament.description && medicament.description.toLowerCase().includes(searchTerm))
    );
});

const selectMedicament = (medicament, index) => {
    prescriptionForm.value.lignes[index].id_medicament = medicament.id_medicament;
    prescriptionForm.value.lignes[index].nom_medicament = medicament.nom_commercial;
    prescriptionForm.value.lignes[index].forme_medicament = medicament.forme_pharmaceutique;
    prescriptionForm.value.lignes[index].description_medicament = medicament.description;
    prescriptionForm.value.lignes[index].dosage_medicament = medicament.dosage;
    showDatalist.value = false;
};

const hideDatalist = () => {
    setTimeout(() => {
        showDatalist.value = false;
    }, 200); // Delay to allow click event on list item
};

const hasPrescriptions = computed(() => {
    return prescriptions.value.some(p => p.lignes && p.lignes.length > 0);
});

const fetchPrescriptions = async () => {
    try {
        prescriptions.value = await getPrescriptionsByConsultation(props.consultation.id_consultation);
    } catch (error) {
        console.log("error get prescriptions by consultation");
        console.error(error);
    }
}

const handleDeletePrescription = async (prescription) => {
    try {
        if(!confirm("Etes-vous sure de vouloir supprimer cette prescription ?")) return;
        await deletePrescription(prescription.id_prescription);
        fetchPrescriptions();
    } catch (error) {
        console.error(error);
    }
}

const handleSavePrescription = async () => {
    if (!props.consultation.id_consultation) {
        alert("Veuillez d'abord sélectionner une consultation.");
        return;
    }

    // Filtrer les lignes vides
    const lignesValides = prescriptionForm.value.lignes.filter(l => l.posologie);
    if (lignesValides.length === 0) {
        alert("Veuillez ajouter au moins un médicament avec sa posologie.");
        return;
    }

    const dataToSend = {
        prescription: prescriptionForm.value,
        lignes: lignesValides
    };

    prescriptionForm.value.id_consultation = props.consultation.id_consultation;
    prescriptionForm.value.date_prescription = new Date().toISOString();
    
    console.log("prescriptionForm.value", prescriptionForm.value);
    

    try {
        await createPrescriptionWithLines(dataToSend);
        fetchPrescriptions();
        alert("Prescription enregistrée avec succès !");
        showPrescriptionForm.value = false;

    } catch (error) {
        console.error(error);
        alert("Une erreur est survenue. Veuillez réessayer.");
    }
}

function getExped() {
    getExpiringMedicaments().then((data) => {
        console.log("expiring medicaments", data);
        expiringMedicaments.value = data;
    });
}


const medicaments = ref([]);

onMounted(async () => {
    try {
        medicaments.value = await getAllMedicaments();
    } catch (error) {
        console.log("error get medicaments");
        console.error(error);
    }

    fetchPrescriptions();
    getExped();

    // try {
    //     prescriptions.value = await getPrescriptionsByConsultation(props.consultation.id_consultation);
    //     console.log("prescriptions", prescriptions.value);
    // } catch (error) {
    //     console.log("error get prescriptions by consultation");
    //     console.error(error);
    // }
});

</script>
<template>
    <div v-if="showPrintView">
        <button class="btn btn-outline mb-3" @click="showPrintView = false">Retour</button>
        <PrintPrescription :prescription="selectedPrescriptionForPrint" />
    </div>
    <section v-else class="medication-list-item animate__animated animate__fadeIn">

        <div class="dossier-section-header">
            <h4>Prescriptions</h4>
            <button class="btn btn-primary" :disabled="disabled" @click="showPrescriptionForm = !showPrescriptionForm">nouvelle
                prescription</button>
        </div>
        <div v-if="showPrescriptionForm === false" class="animate__animated animate__fadeIn">
            <div v-if="hasPrescriptions">
                <div v-for="prescription in prescriptions" :key="prescription.id_prescription">
                    <div v-if="prescription?.lignes?.length > 0">
                        <span>Prescription n° <small style="font-weight: bold; text-transform: uppercase;"> {{
                            prescription.id_prescription }} </small></span><br>
                        <span>Date prescription : {{ new Date(prescription.date_prescription).toLocaleDateString()
                        }}</span>
                        <table class="data-table mb-3">
                            <thead>
                                <tr>
                                    <th>N°.</th>
                                    <th>Médicament</th>
                                    <th>Posologie</th>
                                    <th>Quantité prescrite</th>
                                    <th>Durée traitement (jours)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(ligne, index) in prescription.lignes" :key="index">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ ligne.nom_medicament }} {{ ligne.dosage_medicament }} {{ ligne.forme_medicament }}</td>
                                    <td>{{ ligne.posologie }}</td>
                                    <td>{{ ligne.quantite_prescrite }}</td>
                                    <td>{{ ligne.duree_traitement_jours }} jours</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="text-right">
                            <button class="btn btn-outline" @click="openPrintView(prescription)">Imprimer</button>
                            <button class="btn btn-danger ml-2" @click="handleDeletePrescription(prescription)">supprimer</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">
                <i class="fas fa-pills empty-icon"></i>
                <p>Aucune prescription de médicament pour cette consultation.</p>
                <small>Pour ajouter une prescription, cliquez sur le bouton "Nouvelle prescription".</small>
            </div>
        </div>

        <div v-if="showPrescriptionForm" class="animate__animated animate__fadeIn">

            <form @submit.prevent="handleSavePrescription">
                <h3>Nouvelle prescription</h3>

                <div class="medoc-list">

                    <div v-for="(ligne, index) in prescriptionForm.lignes" :key="index" class="medication-list-item">

                        <div class="dossier-section-header" :id="`ligne-${index}`">
                            <h4>Médicaments</h4>
                            <button v-if="prescriptionForm.lignes.length > 1" class="btn text-danger" type="button"
                                @click="removeLigne(index)">&times;</button>
                        </div>

                        <div class="form-group">
                            <label for="medicament" >Médicament #{{ index + 1 }}</label>
                            <div class="custom-datalist-container">
                                <input id="medicament" type="text" placeholder="Taper le nom du médicament"
                                    v-model="ligne.nom_medicament" @focus="activeLigneIndex = index; showDatalist = true"
                                    @blur="hideDatalist" autocomplete="off">
                                <ul v-if="showDatalist && activeLigneIndex === index && filteredMedicaments.length"
                                    class="custom-datalist animate__animated animate__fadeIn">
                                    <li v-for="medicament in filteredMedicaments" :key="medicament.id_medicament"
                                        @mousedown="selectMedicament(medicament, index)">
                                        <strong>{{ medicament.nom_commercial }}</strong> - {{ medicament.dosage }} - {{
                                            medicament.forme_pharmaceutique }} - <span 
                                                                                    class="status" 
                                                                                    :class="{ 'completed': expiringMedicaments.some(med => med.id_medicament === medicament.id_medicament) ,
                                                                                    'danger': !expiringMedicaments.some(med => med.id_medicament === medicament.id_medicament) }" >
                                                                                    {{ expiringMedicaments.some(med => med.id_medicament === medicament.id_medicament) ? 'Disponible' : 'Non disponible' }}</span>
                                        <br>
                                        {{ medicament.description }}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="d-flex-normal">
                            <div class="form-group w-100 mr-3">
                                <label :for="'posologie-' + index">Posologie</label>
                                <input :id="'posologie-' + index" placeholder="Ex: 1 comprimé matin et soir" type="text"
                                    list="posologieOptions"
                                    v-model="prescriptionForm.lignes[index].posologie">
                            </div>
                            <div class="form-group w-100">
                                <label for="quantite_prescrite">Quantité prescrite</label>
                                <input id="quantite_prescrite" type="number"
                                    v-model="prescriptionForm.lignes[index].quantite_prescrite">
                            </div>
                        </div>

                        <div class="d-flex-normal">
                            <div class="form-group w-100 mr-3">
                                <label for="duree_traitement_jours">Durée traitement (jours)</label>
                                <input id="duree_traitement_jours" type="number"
                                    v-model="prescriptionForm.lignes[index].duree_traitement_jours">
                            </div>
                            <div class="form-group w-100">
                                <label for="notes_specifiques">Notes spécifiques</label>
                                <input id="notes_specifiques" type="text"
                                    v-model="prescriptionForm.lignes[index].notes_specifiques">
                            </div>
                        </div>


                        <div class="text-right">
                            <button 
                                class="btn btn-primary mr-2" 
                                type="button" @click="addLigne(index)">
                                + Ajouter un médicament</button>
                        </div>

                    </div>

                    

                </div>

                

                <div class="form-group">
                    <label for="notes_supplementaires">Notes supplémentaires</label>
                    <textarea id="notes_supplementaires" v-model="prescriptionForm.notes_supplementaires"></textarea>
                </div>

                <div class="text-right">
                    <button class="btn btn-primary mr-2" type="submit">Enregistrer</button>
                </div>
            <datalist id="posologieOptions">
                <option value="1 comprimé matin et soir"></option>
                <option value="2 comprimés soir"></option>
                <option value="1 comprimé tous les 8 heures"></option>
            </datalist>
            </form>
        </div>
    </section>
</template>
<style scoped>
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
    max-height: 80vh;
    overflow-y: auto;
    max-height: 150px;
    z-index: 1000;
}

.custom-datalist li {
    padding: 10px;
    cursor: pointer;
}

.custom-datalist li:hover {
    background-color: var(--gh-ni-bg);
}

.medication-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.medication-list-item {
    overflow: auto;
    /* max-width: 100vh; */
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
    max-width: 100vh;
    display: grid;
    gap: 10px 10px;
    /* overflow-x: auto; */
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
