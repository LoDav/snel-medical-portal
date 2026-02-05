<script setup>
import { ref, defineProps, defineEmits } from 'vue';

import { getUserInfo } from '@/utils/auth';
import { createPrelevementExamen } from '@/utils/prelevementsExamens';

// import api from '@/utils/api'; // Assurez-vous que le chemin est correct
const props = defineProps({
    id_patient: {
        type: String,
        required: true
    },
    id_prescription_examen: {
        type: String,
        required: true
    },
    id:{
        type:Number,
        required:true
    }
})
const emit = defineEmits(['refresh-prelevement-table', 'close']);

let userData = getUserInfo()


const prelevement = ref({
    id_prescription_examen: '',
    id_patient: '',
    id_technicien: userData.id_professionnel,
    id_centre: userData.id_centre,
    type_prelevement: '',
    site_prelevement: '',
    volume_quantite: '',
    numero_tube: '',
    date_heure_prelevement: '' || null,
    date_heure_reception_labo: '' || null,
    conditions_conservation: '' || null,
    transport: '' || null,
    observations: '' || null,
    difficultes: '' || null,
    antiseptique_utilise: '',
    statut_prelevement: 'Réalisé' // Valeur par défaut
});

const submitForm = async () => {
    prelevement.value.id_prescription_examen = props.id_prescription_examen;
    prelevement.value.id_patient = props.id_patient;
    prelevement.value.date_heure_prelevement = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);

    console.log(prelevement.value);

    try {
        await createPrelevementExamen(prelevement.value);
        console.log("Prélèvement enregistré avec successe");
        alert("Prélèvement enregistré avec successe");
        emit('refresh-prelevement-table')

        prelevement.value = {
            id_prescription_examen: '',
            id_patient: '',
            id_technicien: userData.id_professionnel,
            id_centre: userData.id_centre,
            type_prelevement: '',
            site_prelevement: '',
            volume_quantite: '',
            numero_tube: '',
            date_heure_prelevement: '' || null,
            date_heure_reception_labo: '' || null,
            conditions_conservation: '' || null,
            transport: '' || null,
            observations: '' || null,
            difficultes: '' || null,
            antiseptique_utilise: '',
            statut_prelevement: 'Réalisé' // Valeur par défaut
        }
    } catch (error) {
        console.error("Une erreur s'est produite lors de l'enregistrement du prélèvement:", error);
        alert("Une erreur s'est produite lors de l'enregistrement du prélèvement.");
    }
};
</script>

<template>
    <hr>
    <section class="animate__animated animate__fadeIn mb-3"  :id="`prelevent-${id}`">
        <h4>Saisie des Prélèvements d'examens</h4>
        <form @submit.prevent="submitForm">

            <div class="d-flex">
                <div class="form-group w-100 mr-3">
                    <!-- <label for="type_prelevement">Type de Prélèvement:</label>
                    <input type="text" id="type_prelevement" v-model="prelevement.type_prelevement" required
                        placeholder="Ex: 'Sang','Urine','Selles','Salive','LCR','Ponction','Biopsie','Autre'" /> -->
                    <label for="type_prelevement">Type de Prélèvement:</label>
                    <select name="type_prelvement" id="type_prelvement" v-model="prelevement.type_prelevement">
                        <option value="" selected disabled hidden>Sélectionnez un type de prélèvement</option>
                        <option value="Sang">Sang</option>
                        <option value="Urine">Urine</option>
                        <option value="Selles">Selles</option>
                        <option value="Salive">Salive</option>
                        <option value="LCR">LCR</option>
                        <option value="Ponction">Ponction</option>
                        <option value="Biopsie">Biopsie</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                <div class="form-group w-100 mr-3">
                    <label for="site_prelevement">Site de Prélèvement:</label>
                    <input type="text" id="site_prelevement" v-model="prelevement.site_prelevement"
                        placeholder="Site anatomique (ex: Veine cubitale, Urines matinales)" />
                </div>

                <div class="form-group w-100">
                    <label for="volume_quantite">Volume/Quantité:</label>
                    <input type="text" id="volume_quantite" v-model="prelevement.volume_quantite"
                        placeholder="Volume ou quantité prélevée (ex: 5 ml, 1 tube)" />
                </div>
            </div>

            <div class="form-group">
                <label for="numero_tube">Numéro de Tube:</label>
                <input type="text" id="numero_tube" v-model="prelevement.numero_tube"
                    placeholder="Numéro du tube/container" />
            </div>

            <div class="form-group">
                <label for="conditions_conservation">Conditions de Conservation:</label>
                <textarea id="conditions_conservation" v-model="prelevement.conditions_conservation"
                    placeholder="Ex: À 4°C, Congelé, Ambient"></textarea>
            </div>

            <div class="form-group w-100">
                <label for="transport">Transport:</label>
                <input type="text" id="transport" v-model="prelevement.transport"
                    placeholder="Mode de transport (facultatif)" />
            </div>

            <div class="form-group">
                <label for="antiseptique_utilise">Antiseptique Utilisé:</label>
                <input type="text" id="antiseptique_utilise" v-model="prelevement.antiseptique_utilise"
                    placeholder="Antiseptique utilisé" />
            </div>

            <div class="d-flex align-items-center">
                <div class="form-group w-100 mr-3">
                    <label for="difficultes">Difficultés(facultatif) :</label>
                    <textarea id="difficultes" v-model="prelevement.difficultes"></textarea>
                </div>

                <div class="form-group w-100">
                    <label for="observations">Observations (facultatif) :</label>
                    <textarea id="observations" v-model="prelevement.observations"
                        placeholder="Observations supplémentaires sur le prélèvement"></textarea>
                </div>
            </div>



            <div class="text-right">
                <button class="btn btn-primary mr-1" type="submit">Créer Prélèvement</button>
                <button class="btn btn-secondary" type="button" @click="emit('close')">Annuler</button>
            </div>

        </form>
    </section>
    <hr>
</template>

<style scoped></style>
