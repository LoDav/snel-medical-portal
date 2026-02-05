<script setup>
/**
 * Sidebar component with search and tab functionality.
 * ce composant permet de faire une barre latérale avec une recherche et des onglets.
 * author: @Necronemesis for SNEL S.A
 * version: 1.0.8
 * date: 2025-09-01
 */

import { ref, computed, onMounted, watch } from 'vue';

/**
 * @typedef {Object} SidebarItem
 * @property {Object} patient_info - Informations sur le patient.
 * @property {string} patient_info.nom - Nom du patient.
 * @property {string} patient_info.post_nom - Post-nom du patient.
 * @property {string} patient_info.prenoms - Prénoms du patient.
 * @property {string} patient_info.id_patient - ID du patient.
 * @property {string} [date_consultation] - Date de la consultation (pour les consultations).
 * @property {string} [date_demande] - Date de la demande (pour les examens).
 * @property {string} [id_consultation] - ID de la consultation.
 * @property {string} [id_examen] - ID de l'examen.
 */

/**
 * Définition des propriétés (props) acceptées par le composant.
 * @property {string} title - Le titre affiché en haut de la barre latérale.
 * @property {Array<Array<SidebarItem>>} items - Une liste de listes d'éléments à afficher, chaque sous-liste correspondant à un onglet.
 * @property {Array<string>} tabs - Une liste de noms d'onglets pour la navigation.
 */
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        default: () => []
    },
    tabs: {
        type: Array,
        default: () => []
    },
    preselected: {
        type: String,
        default: null
    },
    initialTab: {
        type: String,
        default: null
    }
});

/**
 * Définition des événements (emits) que le composant peut émettre.
 * @event item-clicked - Émis lorsqu'un élément de la liste est cliqué.
 * @event tab-changed - Émis lorsqu'un onglet est changé.
 * @event getdata - Émis lorsqu'un élément est cliqué, pour récupérer ses données.
 */
const emit = defineEmits(['item-clicked', 'tab-changed', 'getdata']);

/**
 * Variable réactive pour l'onglet actuellement actif.
 * Initialisé avec initialTab si fourni, sinon le premier onglet si des onglets sont fournis, sinon null.
 * @type {import('vue').Ref<string|null>}
 */
const activeTab = ref(props.initialTab || (props.tabs.length > 0 ? props.tabs[0] : null));

/**
 * Variable réactive pour l'ID de l'élément actuellement sélectionné dans la liste.
 * Utilisé pour appliquer une classe 'active' à l'élément sélectionné.
 * @type {import('vue').Ref<string|null>}
 */
const selectedId = ref(null);

/**
 * Variable réactive pour le terme de recherche saisi par l'utilisateur.
 * @type {import('vue').Ref<string>}
 */
const searchTerm = ref('');

/**
 * Variable réactive pour le filtre de date ('all' ou 'today').
 * @type {import('vue').Ref<string>}
 */
const filterDate = ref('all'); // 'all' ou 'today'

/**
 * Fonction utilitaire pour formater une chaîne de date en un format lisible par l'utilisateur.
 * @param {string} dateString - La chaîne de date à formater.
 * @returns {string} La date formatée ou 'N/A' si la chaîne est vide.
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Propriété calculée qui filtre et trie les éléments de la liste.
 * Les éléments sont filtrés par l'onglet actif, le terme de recherche et le filtre de date.
 * Ils sont ensuite triés par date (du plus récent au plus ancien).
 * @returns {Array<SidebarItem>} La liste des éléments filtrés et triés.
 */
const filteredAndSortedItems = computed(() => {
    // Vérifie si un onglet est actif et si des éléments existent pour cet onglet.
    if (!activeTab.value || !props.items[props.tabs.indexOf(activeTab.value)]) {
        return [];
    }

    // Récupère les éléments de l'onglet actif.
    let currentTabItems = props.items[props.tabs.indexOf(activeTab.value)];

    // S'assure que currentTabItems est un tableau avant de continuer.
    if (!Array.isArray(currentTabItems)) {
        return [];
    }

    // 1. Filtrer par terme de recherche (nom complet ou ID patient).
    if (searchTerm.value) {
        const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
        currentTabItems = currentTabItems.filter(item => {
            const patientInfo = item.patient_info;
            if (patientInfo) {
                const fullName = `${patientInfo.nom || ''} ${patientInfo.post_nom || ''} ${patientInfo.prenoms || ''}`.toLowerCase();
                const idPatient = patientInfo.id_patient ? patientInfo.id_patient.toLowerCase() : '';

                return fullName.includes(lowerCaseSearchTerm) ||
                    idPatient.includes(lowerCaseSearchTerm);
            }
            return false;
        });
    }

    // 2. Filtrer par date (uniquement les éléments d'aujourd'hui si filterDate est 'today').
    if (filterDate.value === 'today') {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD pour comparaison.
        currentTabItems = currentTabItems.filter(item => {
            // Utilise `date_demande` pour les examens et `date_consultation` pour les consultations.
            const itemDate = item.date_demande ? new Date(item.date_demande).toISOString().split('T')[0] :
                            item.date_consultation ? new Date(item.date_consultation).toISOString().split('T')[0] : null;
            console.log(item.date_consultation || item.date_demande, itemDate, today);

            return itemDate === today;
        });
    }

    // 3. Trier les éléments par date (du plus récent au plus ancien).
    return currentTabItems.sort((a, b) => {
        // Utilise `date_demande` ou `date_consultation` pour le tri.
        const dateA = new Date(a.date_demande || a.date_consultation);
        const dateB = new Date(b.date_demande || b.date_consultation);
        return dateB.getTime() - dateA.getTime(); // Tri descendant.
    });
});

/**
 * Gère le clic sur un élément de la liste et émet l'événement 'item-clicked'.
 * @param {SidebarItem} item - L'élément qui a été cliqué.
 */
// const handleClick = (item) => {
//     emit('item-clicked', item);
// };


watch(() => filteredAndSortedItems.value, () => {
     console.log('props', props.preselected);
    selectedId.value = props.preselected;
},{deep: true})


onMounted(() => {
    emit('tab-changed', activeTab.value);
})

</script>

<template>
    <div class="sidebar">
        <h2>{{ title }}</h2>

        <div class="search-box">
            <input type="search" placeholder="Rechercher par nom ou ID patient..." v-model="searchTerm">
        </div>
        <!-- Tabs (if enabled) -->
        <div class="tabs-container" v-if="props.tabs.length > 0">
            <button
                v-for="tab in props.tabs"
                :key="tab"
                class="tab-button"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab; selectedId = null; searchTerm = ''; filterDate = 'all'; $emit('tab-changed', tab)"
            >
                {{ tab }}
            </button>
        </div>

        <ul class="list scrollable-2" v-if="filteredAndSortedItems.length > 0">

            <li class="list-item" v-for="(item, index) in filteredAndSortedItems"
                :key="item.id_consultation || item.id_examen" @click="$emit('getdata', item);
                selectedId = item.id_consultation || item.id_examen || item.patient_info?.id_patient"
                :class="{active: selectedId === (item.id_consultation || item.id_examen || item.patient_info?.id_patient) }">
                <div>
                    <h3>{{ item.patient_info?.nom  }} {{ item.patient_info?.post_nom }} {{ item.patient_info?.prenoms }}</h3>
                    <p>ID Patient: {{ item.patient_info?.id_patient }}</p>
                    <p>Date : {{ formatDate(item.date_consultation || item.date_demande || item.date_rdv) }}</p>
                </div>
            </li>
        </ul>
        <div v-else class="text-muted text-center">
            Aucun résultat trouvé.
        </div>
    </div>
</template>

<style scoped>
.scrolling-2 {
    overflow-y: scroll;
    max-height: calc(100vh - 200px);
}
</style>
