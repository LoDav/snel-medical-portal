<script setup>
// import { defineProps } from 'vue';

const props = defineProps({
    prescription: {
        type: Object,
        required: true
    }
});

const print = () => {
    window.print();
};

</script>

<template>
    <div class="print-prescription-container">
        <div id="printable-prescription" class="prescription-sheet">
            <!-- En-tête -->
            <header class="prescription-header">
                <div class="doctor-info d-flex">
                    <div class="mr-2">
                        <img src="/logo1.png" alt="Logo SNEL" style="height: 60px;">
                    </div>
                    <div class="doctor-details">
                        <span style="font-size: large;
                                    margin: 0;
                                    font-size: 1.2rem;
                                    color: #0056b3;
                                    font-weight: bold;">
                                    Dr {{ prescription.nom_professionnel || 'N/A' }}
                        </span><br>

                        <span>{{ prescription.specialite_professionnel || 'Médecine Générale' }}</span><br>
                        <span>{{ prescription.nom_centre || 'Centre Médical SNEL' }}</span>
                        <!-- <h3>Dr. </h3> -->
                        <!-- <p></p>
                        <p></p> -->
                    </div>
                    <!-- Ces informations devront être passées dans la prop prescription -->

                </div>
                <div class="patient-info">
                    <p><strong>Patient:</strong> {{ prescription.nom_patient }} {{ prescription.prenom_patient }}</p>
                    <p><strong>Date:</strong> {{ new Date(prescription.date_prescription).toLocaleDateString() }}</p>
                </div>
            </header>

            <hr>

            <!-- Corps de l'ordonnance -->
            <main class="prescription-body">
                <h3>Ordonnance Médicale</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Médicament</th>
                            <th>Posologie</th>
                            <th>Quantité</th>
                            <th>Durée</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(ligne, index) in prescription.lignes" :key="index">
                            <td>{{ ligne.nom_medicament }} {{ ligne.dosage_medicament }} {{ ligne.forme_medicament }}</td>
                            <td>{{ ligne.posologie }}</td>
                            <td>{{ ligne.quantite_prescrite }}</td>
                            <td>{{ ligne.duree_traitement_jours }} jours</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="prescription.notes_supplementaires" class="notes">
                    <h4>Notes supplémentaires:</h4>
                    <p>{{ prescription.notes_supplementaires }}</p>
                </div>
            </main>

            <!-- Pied de page -->
            <footer class="prescription-footer">
                <p>Signature du médecin</p>
            </footer>
        </div>

        <div class="print-actions">
            <button @click="print" class="btn btn-primary">Imprimer</button>
        </div>
    </div>
</template>

<style scoped>
.prescription-sheet {
    background: white;
    padding: 2rem;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    color: black;
    border: 1px solid #ccc;
    width: 148mm;
    /* A5 width */
    min-height: 210mm;
    /* A5 height */
    margin: auto;
}

.prescription-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.prescription-body table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.prescription-body th,
.prescription-body td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

.prescription-footer {
    margin-top: 5rem;
    text-align: right;
}

.print-actions {
    text-align: center;
    margin-top: 1rem;
}

.doctor-details {
    margin: 0;
    padding: 0;
    font-size: 0.9rem;
}

@media print {
    body * {
        visibility: hidden;
        border: none;
        box-shadow: none;
        display: none;
    }

    .prescription-sheet {
        border: none;
        box-shadow: none;
    }

    .print-prescription-container,
    .print-prescription-container * {
        visibility: visible;
    }

    #printable-prescription {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        border: none;
        margin: 0;
        padding: 0;
    }

    .print-actions {
        display: none;
    }
}
</style>
