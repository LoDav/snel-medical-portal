<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    patients: {
        type: Array,
        default: () => []
    },
    tabs: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['patient-clicked', 'tab-changed']);



const activeTab = ref(props.tabs.length > 0 ? props.tabs[0] : null);
const selectedId = ref(null);
const searchTerm = ref('');
const patientsData = ref([]); // Cette ref n'est pas utilisée, peut être supprimée si non nécessaire


defineExpose({
    selectedId
});

// Fonction utilitaire pour formater la date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Filtrer et trier les patients en fonction du terme de recherche et de la tab active
const filteredAndSortedPatients = computed(() => {
    let currentPatients = [];
    const tabIndex = props.tabs.indexOf(activeTab.value);

    if (tabIndex !== -1 && props.patients[tabIndex]) {
        currentPatients = props.patients[tabIndex];
    }

    if (!Array.isArray(currentPatients)) {
        return [];
    }

    // 1. Filtrer par terme de recherche
    if (searchTerm.value) {
        const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
        currentPatients = currentPatients.filter(patient => {
            const fullName = `${patient.nom || ''} ${patient.post_nom || ''} ${patient.prenoms || ''}`.toLowerCase();
            const idPatient = patient.id_patient ? patient.id_patient.toLowerCase() : '';

            return fullName.includes(lowerCaseSearchTerm) || 
                idPatient.includes(lowerCaseSearchTerm);
        });
    }

    // 2. Trier par date de création (du plus récent au plus ancien)
    return currentPatients.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime(); // Tri descendant
    });
});

const handleClick = (patient) => {
    emit('patient-clicked', patient);
};

</script>

<template>
    <div class="sidebar">
        <h2>{{ title }}</h2>

        <div class="search-box">
            <input type="search" placeholder="Rechercher par nom ou ID patient..." v-model="searchTerm">
        </div>

        <!-- Tabs -->
        <div class="tabs-container" v-if="props.tabs.length > 0">
            <button
                v-for="tab in props.tabs"
                :key="tab"
                class="tab-button"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab; searchTerm = ''; selectedId = null; emit('tab-changed', tab)"
            >
                {{ tab }}
            </button>
        </div>

        <ul class="list scrollable-2" v-if="filteredAndSortedPatients.length > 0">
            <li class="list-item" 
                v-for="patient in filteredAndSortedPatients" 
                :key="patient.id_patient" 
                @click="handleClick(patient); selectedId = patient.id_patient" 
                :class="{active: selectedId === patient.id_patient }">
                <div>
                    <h3>{{ patient.nom }} {{ patient.post_nom }} {{ patient.prenoms }}</h3>
                    <p>ID Patient: {{ patient.id_patient }} - type : {{ patient.type_patient }}</p>
                    <!-- <p>type : {{ patient.type_patient }}</p> -->
                    <p>Date de création : {{ formatDate(patient.created_at) }}</p>
                </div>
            </li>
        </ul>
        <div v-else class="text-muted text-center">
            Aucun patient trouvé pour cette catégorie.
        </div>
    </div>
</template>

<style scoped>
.sidebar {
    width: 300px;
    background-color: var(--gh-sidebar-bg);
    border-right: 1px solid var(--gh-border-color);
    padding: 20px
}
/* Basic Sidebar Styling */
.trie_btn {
    background-color: var(--gh-border-color);
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    margin-right: 10px;
}
.trie_btn.active {
    background-color: var(--accent-green); /* Couleur d'accentuation pour le bouton actif */
    color: white;
}

.tabs-container {
    display: flex;
    justify-content: space-around;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 5px;
}

.tab-button {
    background-color: transparent;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    color: var(--gh-text-color-secondary);
    transition: color 0.2s, border-bottom-color 0.2s;
    border-bottom: 2px solid transparent;
}

.tab-button:hover {
    color: var(--gh-text-color);
}

.tab-button.active {
    color: var(--gh-primary-blue);
    font-weight: bold;
    border-bottom-color: var(--gh-primary-blue);
}
</style>
