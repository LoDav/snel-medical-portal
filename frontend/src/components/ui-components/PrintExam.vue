<script setup>
import { getUserInfo } from '@/utils/auth';
import { ref} from 'vue';


const props = defineProps({
    prescription: {
        type: Object,
        required: true
    },
    patient: {
        type: Object,
        required: true
    },
});

/*
* Informations du professionnel de santé
* Ces informations devraient idéalement provenir de la prop prescription
* si elles sont incluses dans l'objet prescription.
* Sinon, on peut les obtenir via une fonction utilitaire ou un store.
* Ici, on utilise une fonction utilitaire pour obtenir les infos de l'utilisateur connecté.
*/
const professionnel = ref(getUserInfo())

const print = () => {
    window.print();
};

</script>

<template>
    <div class="print-exam-container">
        <div id="printable-exam" class="exam-sheet">
            <!-- En-tête -->
            <header>
                <div class="mr-2" >
                    <img src="/logo1.png" alt="Logo SNEL" style="height: 40px;">
                </div>
            </header>
            <br>
            <header class="exam-header">
                <div class="doctor-info">
                    <div>
                        <h3>Dr. {{ professionnel.prenoms }} {{ professionnel.nom }}</h3>
                        <p>{{ professionnel.type_professionnel }} - {{ professionnel.specialite || 'N/A' }}</p>
                        <p>{{ prescription.centre.nom_centre }}</p> <!-- À adapter si l'info du centre est disponible -->
                    </div>
                    
                </div>
                <div class="patient-info">
                    <p><strong>Patient:</strong> {{ patient.prenoms }} {{ patient.nom }}</p>
                    <p><strong>Date de prescription:</strong> {{ new Date(prescription.date_prescription).toLocaleDateString() }}</p>
                </div>
            </header>

            <hr>

            <!-- Corps du bon d'analyse -->
            <main class="exam-body">
                <h3>Demande d'Analyse</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Type d'examen</th>
                            <th>Nom de l'examen</th>
                            <th>Instructions</th>
                            <th>Priorité</th>
                            <th>Statut</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="(exam, index) in prescription.examens" :key="index">
                            <td>{{ exam.type_examen }}</td>
                            <td>{{ exam.nom_examen }}</td>
                            <td>{{ exam.instructions || 'N/A' }}</td>
                            <td>{{ exam.priorite }}</td>
                            <td>{{ exam.statut_examen }}</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="prescription.notes_supplementaires" class="notes">
                    <h4>Notes supplémentaires du prescripteur:</h4>
                    <p>{{ prescription.notes_supplementaires }}</p>
                </div>
            </main>

            <!-- Pied de page -->
            <footer class="exam-footer">
                <p>Signature du demandeur</p>
            </footer>
        </div>

        <div class="print-actions">
            <button @click="print" class="btn btn-primary">Imprimer</button>
        </div>
    </div>
</template>

<style scoped>
.exam-sheet {
    background: white;
    padding: 2rem;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    color: black;
    border: 1px solid #ccc;
    width: 148mm; /* A5 width */
    min-height: 210mm; /* A5 height */
    margin: auto;
    box-shadow: 0 0 5px rgba(0,0,0,0.1);
}

.exam-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
}

.doctor-info h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #0056b3;
}

.doctor-info p, .patient-info p {
    margin: 0.2rem 0;
    font-size: 0.9rem;
}

.patient-info {
    text-align: right;
    font-size: 0.9rem;
}
.exam-body h3 {
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
}

.exam-body table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.exam-body th, .exam-body td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
    font-size: 0.9rem;
}

.exam-body th {
    background-color: #f2f2f2;
    font-weight: bold;
}

.notes {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px dashed #ccc;
    background-color: #f9f9f9;
}

.notes h4 {
    margin-top: 0;
    color: #555;
}

.exam-footer {
    margin-top: 5rem;
    text-align: right;
    font-size: 0.9rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;
}

.print-actions {
    text-align: center;
    margin-top: 1.5rem;
}

@media print {
    body * {
        visibility: hidden;
    }
    .print-exam-container, .print-exam-container * {
        visibility: visible;
    }
    .exam-sheet {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        border: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
    }
    .print-actions {
        display: none;
    }
}
</style>
