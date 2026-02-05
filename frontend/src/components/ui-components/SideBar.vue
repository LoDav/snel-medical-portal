<template>
    <!-- Conteneur principal de la barre latérale -->
    <div class="sidebar">
        <!-- Titre de la section des patients -->
        <h2>Liste des Patients</h2>
        <!-- Boîte de recherche pour filtrer les patients -->
        <div class="search-box">
            <!-- Champ de saisie pour la recherche de patients par nom ou ID -->
            <input type="search" placeholder="Rechercher par nom ou ID..." aria-label="Rechercher un patient"
                v-model="searchTerm" @keyup="fetchSuggestions" @focus="searchInputIsFocused = true" />

            <!-- Le bouton de recherche est commenté, la recherche se déclenche à la saisie -->
            <!-- <button class="btn">Rechercher</button> -->
        </div>
        <!-- Liste des patients, rendue défilable -->
        <ul class="list scrolling">
            <!-- Itération sur les données des patients si la liste n'est pas vide -->
            <li class="list-item" :class="{ active: selectedId === id }" v-for="data, id in datas"
                @click="$emit('getdata', data); selectedId = id" v-if="datas.length != 0">
                <!-- Informations du patient (nom, prénoms, type, groupe sanguin) -->
                <div>
                    <h3>{{ data.nom }} {{ data.post_nom }} {{ data.prenoms }}</h3>
                    <p>Date de naissance: {{ new Date(data.date_naissance).toLocaleDateString('fr-FR') }}</p>
                    <p>Type: {{ data.type_patient }}</p>
                </div>
                <!-- Bouton pour afficher plus de détails sur le patient -->
                <!-- <span class="btn-outline" style="font-size: 12px; padding: 4px 8px;">+Details</span> -->
            </li>
            <!-- Message affiché si aucun patient n'est trouvé -->
            <div v-else class="text-muted text-center">
                <h3>Aucun élement trouver</h3>
            </div>
        </ul>
    </div>
</template>

<style scoped>
.scrolling {
    overflow-y: scroll;
    max-height: calc(100vh - 300px);
}
</style>

<script setup>
/** 
 * Composant SideBar.vue
 * Description: Ce composant affiche une barre latérale avec une liste de patients et une fonctionnalité de recherche.
 * Il permet de rechercher des patients par nom ou ID, et de sélectionner un patient pour afficher ses détails. 
 */
// Importations des fonctions et modules nécessaires de Vue et de l'API
import { ref, onMounted, watch, onUnmounted } from 'vue' // ref pour les variables réactives, onMounted pour le cycle de vie, watch pour surveiller les changements, defineProps pour les props (non utilisées ici mais importées)
// import api from '../../utils/api'; // Module API pour les appels backend
import { getPatients, searchPatientsByName, searchPatientsByIdLike } from '@/utils/patient'

// Déclaration des variables réactives
const datas = ref([]) // Stocke la liste des patients
const searchTerm = ref('') // Stocke le terme de recherche saisi par l'utilisateur
const selectedId = ref(null) // Stocke l'ID du patient actuellement sélectionné dans la liste
let intervalId = null; // ID de l'intervalle pour le polling
let searchInputIsFocused = false; // Indique si le champ de recherche est focalisé

// Fonction asynchrone pour récupérer toutes les données des patients
const fetchData = async () => {
    if (searchTerm.value.trim() !== "") {
        return; // Ne pas rafraîchir les données si l'utilisateur est en train de taper
    }

    try {
        datas.value = await getPatients() // Appel à l'API pour obtenir tous les patients
        // console.log(datas) // Affiche les données dans la console (pour le débogage)
    } catch (error) {
        console.log(error); // Gère les erreurs lors de la récupération des données
    }
}



// Fonction asynchrone pour récupérer des suggestions de patients basées sur le terme de recherche
const fetchSuggestions = async () => {
    const trimmedSearchTerm = searchTerm.value.trim();
    if (trimmedSearchTerm === "") {
        await fetchData();
    } else {
        try {
            let results = [];
            // Tente de rechercher par ID en premier, car l'ID peut être alphanumérique
            results = await searchPatientsByIdLike(trimmedSearchTerm);

            // Si la recherche par ID ne donne aucun résultat, tente de rechercher par nom
            if (!results || results.length === 0) {
                results = await searchPatientsByName(trimmedSearchTerm);
            }

            datas.value = Array.isArray(results) ? results : [results];
        } catch (error) {
            datas.value = [];
            console.error(error);
        }
    }
}

// Hook de cycle de vie : exécuté lorsque le composant est monté
onMounted(() => {
    // Fetch initial data
    fetchData(); // Appelle fetchData pour charger les patients au démarrage du composant

     // Poll every 5 seconds (adjust as needed)
    intervalId = setInterval(fetchData, 5000);
})

// Hook de cycle de vie : exécuté lorsque le composant est Démonté
onUnmounted(() => {
    // Clear the interval when the component is unmounted
    clearInterval(intervalId);
});

// Surveille les changements de searchTerm
watch(searchTerm, (newValue) => {
    if (newValue.trim() === '') {
        fetchData(); // Recharge la liste des patients si le champ de recherche est vide
    }
});

</script>
