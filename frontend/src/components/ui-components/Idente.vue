
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showDropdown = ref(false);
const selectedOption = ref('Par nom');
const searchInputPlaceholder = ref('Rechercher par nom...');
const searchCriteria = ref('nom'); // 'nom' ou 'matricule'
const dropdownBtnRef = ref(null);
const dropdownMenuRef = ref(null);

/**
 * Bascule la visibilité du menu déroulant de recherche.
 */
const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
    console.log(showDropdown.value);
};

/**
 * Gère la sélection d'une option dans le menu déroulant.
 * Met à jour l'option sélectionnée, le placeholder du champ de recherche et le critère de recherche.
 * @param {string} option - Le texte de l'option sélectionnée.
 * @param {string} criteria - Le critère de recherche ('nom' ou 'matricule').
 */
const selectOption = (option, criteria) => {
    selectedOption.value = option;
    searchCriteria.value = criteria;
    searchInputPlaceholder.value = `Rechercher par ${criteria}...`;
    showDropdown.value = false;
};

/**
 * Gère les clics en dehors du menu déroulant pour le fermer.
 * @param {Event} event - L'événement de clic.
 */
const handleClickOutside = (event) => {
    if (dropdownBtnRef.value && !dropdownBtnRef.value.contains(event.target) &&
        dropdownMenuRef.value && !dropdownMenuRef.value.contains(event.target)) {
        showDropdown.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            <h2>Identification des Agents et ayants droits</h2>
        </div>
        
        <div class="search-container">
            <!-- Dropdown pour choisir le critère de recherche -->
            <div class="search-dropdown">
                <div class="search-dropdown-btn" id="dropdownBtn" @click="toggleDropdown" ref="dropdownBtnRef">
                    <span id="selectedOption">{{ selectedOption }}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="custom-dropdown-menu" :class="{ 'active': showDropdown }" id="dropdownMenu" ref="dropdownMenuRef">
                    <div class="dropdown-item" data-value="nom" @click="selectOption('Par nom', 'nom')">Par nom</div>
                    <div class="dropdown-item" data-value="matricule" @click="selectOption('Par matricule', 'matricule')">Par matricule</div>
                </div>
            </div>

            <!-- Champ de texte pour la recherche -->
            <input type="text" id="searchInput" class="search-input" :placeholder="searchInputPlaceholder">

            <!-- Bouton de recherche -->
            <button class="search-button" id="searchBtn">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </div>
</template>
<style scoped>
.container {
    width: 100%;
    /* max-width: 800px; */
    padding: 20px;
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    border: 1px solid var(--gh-border-color);
    box-shadow: 0 4px 12px var(--gh-shadow);
}

h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
}

/* Conteneur de la barre de recherche */
.search-container {
    display: flex;
    align-items: center;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    overflow: hidden;
    background-color: var(--gh-input-bg);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-container:focus-within {
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.25);
}

/* Menu déroulant (dropdown) */
.search-dropdown {
    position: relative;
    z-index: 1000; /* Assure que le dropdown est au-dessus des autres éléments */
}

.search-dropdown-btn {
    background-color: var(--gh-input-bg);
    color: var(--gh-text-color);
    padding: 10px 15px;
    border-right: 1px solid var(--gh-border-color);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
}

/* Styles pour le dropdown */
.custom-dropdown-menu {
    position: absolute;
    top: 100%;
    left: -1px;
    /* Align with the left border of the search container */
    z-index: 100;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-top: none;
    border-radius: 0 0 6px 6px;
    width: calc(100% + 2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    /*display: none; Le menu est caché par défaut */
    flex-direction: column; /* Ajouté pour s'assurer que les éléments sont empilés verticalement */
}

.custom-dropdown-menu.active {
    display: flex; /* Utiliser flex pour correspondre à flex-direction: column */
    animation: fadeIn 0.2s ease-out;
}

.dropdown-item {
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background-color: var(--gh-primary-blue);
    color: #fff;
}

/* Champ de texte de recherche */
.search-input {
    flex-grow: 1;
    padding: 10px;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--gh-text-color);
    background-color: var(--gh-input-bg);
}

/* Bouton de recherche */
.search-button {
    padding: 10px 15px;
    background-color: var(--gh-input-bg);
    color: var(--gh-text-color);
    border: none;
    cursor: pointer;
}

.search-button:hover {
    background-color: #e6edf4;
}

body.dark-mode .search-button:hover {
    background-color: #24292e;
}

.theme-toggle-button {
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid var(--gh-border-color);
    cursor: pointer;
    background-color: var(--gh-card-bg);
    color: var(--gh-text-color);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
