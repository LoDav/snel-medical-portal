<script setup>
/**
 * Theme Switcher Component
 * ce composant permet de changer le thème de l'application
 * author:@Necromastery for SNEL S.A
 * version: 1.0.0
 * date: 2025-09-09
 * 
 */
import { ref, onMounted } from 'vue';

const currentTheme = ref('light'); // Thème par défaut
const showOptions = ref(false); // Pour contrôler l'affichage du menu déroulant

const themes = [
    { name: 'Light', value: 'light' },
    // { name: 'Dark', value: 'dark' },
    { name: 'VSCode Dark', value: 'vscode-dark' },
    { name: 'Black Lobelia', value: 'gemini-dark' },
    { name: 'Dark Accent Green', value: 'dark-accent-green' },
    // { name: 'Light Accent Green', value: 'light-accent-green' },
    // { name: 'Light Violet', value: 'light-violet' },
    // { name: 'Corporate', value: 'corporate' },
    { name: 'Nature & Health', value: 'nature-health' },
    { name: 'Medical', value: 'medical' },
    { name: 'Medical Green', value: 'medical-green' },
];

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme.value = theme;
    showOptions.value = false; // Fermer le menu après sélection
};

const toggleOptions = () => {
    showOptions.value = !showOptions.value;
};

// Fermer le menu si l'utilisateur clique en dehors
const handleClickOutside = (event) => {
    const themeSelectorContainer = document.querySelector('.theme-selector-container');
    if (themeSelectorContainer && !themeSelectorContainer.contains(event.target)) {
        showOptions.value = false;
    }
};

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(currentTheme.value);
    }
    document.addEventListener('click', handleClickOutside);
});
</script>

<template>
        <div class="theme-selector-container">
            <button class="theme-selector-button" :class="{ 'open': showOptions }" @click="toggleOptions" aria-haspopup="listbox" :aria-expanded="showOptions">
                <i class="fa fa-sun-o theme-icon light-mode-icon mr-1"></i>
                <span>{{ themes.find(t => t.value === currentTheme)?.name || 'Clair' }}</span>
                <i class="fa fa-chevron-down chevron-down"></i>
            </button>
            <ul class="theme-options" :class="{ 'show': showOptions }" role="listbox">
                <li v-for="theme in themes" :key="theme.value" class="theme-options-item" :data-value="theme.value" role="option" @click="applyTheme(theme.value)">
                    {{ theme.name }}
                </li>
            </ul>
        </div>
    
</template>

<style scoped>
/* Styles du sélecteur de thème stylisé */
.theme-selector-container {
    position: relative;
    display: inline-block;
    font-family: inherit;
}

.theme-selector-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 2rem;
    border: 1px solid var(--gh-border-color);
    background-color: var(--gh-input-bg);
    color: var(--gh-text-color);
    cursor: pointer;
    font-size: 14px;
    min-width: 120px;
    transition: background-color 0.3s, border-color 0.3s;
}

.theme-selector-button:hover {
    background-color: var(--gh-navbar-link-hover);
}

.theme-selector-button .chevron-down {
    margin-left: 8px;
    transition: transform 0.2s ease;
}

.theme-selector-button.open .chevron-down {
    transform: rotate(180deg);
}

.theme-options {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 3px 6px var(--gh-shadow);
    margin-top: 8px;
    z-index: 999;
    overflow: hidden;
    list-style: none;
    padding: 0;
    min-width: 120px;
    display: none;
    animation: fadeIn 0.2s ease-out;
}

.theme-options.show {
    display: block;
}

.theme-options-item {
    padding: 10px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 14px;
}

.theme-options-item:hover {
    background-color: var(--gh-navbar-link-hover);
}

/* Animation pour l'apparition du menu */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
