<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { getOnlineMedecins } from '@/utils/professionnel';

const onlineMedecins = ref([]);
const showDropdown = ref(true);
const dropdownRef = ref(null);
let intervalId = null;

const fetchOnlineMedecins = async () => {
    try {
        onlineMedecins.value = await getOnlineMedecins();
    } catch (error) {
        console.error("Erreur lors de la récupération des médecins en ligne:", error);
        onlineMedecins.value = [];
    }
};

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        showDropdown.value = false;
    }
};

onMounted(() => {
    fetchOnlineMedecins();
    intervalId = setInterval(fetchOnlineMedecins, 10000); // Rafraîchir toutes les 10 secondes
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
    document.removeEventListener('click', handleClickOutside);
});

const getInitials = (nom, prenoms) => {
    const firstInitial = nom ? nom[0] : '';
    const secondInitial = prenoms ? prenoms[0] : '';
    return (firstInitial + secondInitial).toUpperCase();
};
</script>

<template>
    <div class="profile-menu" ref="dropdownRef">
        <button class="profile-btn" @click="toggleDropdown" :class="{ 'open': showDropdown }">
            <span class="profile-icon">
                <i class="fas fa-user-md"></i>
            </span>
            <span>Médecins en ligne</span>
            <i class="fas fa-chevron-down chevron-down"></i>
        </button>
        <div class="profile-dropdown open " :class="{ 'open': showDropdown }" v-if="showDropdown">
            <div class="dropdown-header">Utilisateurs connectés</div>
            <div v-if="onlineMedecins.length > 0">
                <div class="dropdown-item" v-for="medecin in onlineMedecins" :key="medecin.id_professionnel">
                    <img :src="`https://placehold.co/24x24/28a745/ffffff?text=${getInitials(medecin.nom, medecin.prenoms)}`" alt="Avatar de l'utilisateur" class="item-avatar">
                    <span class="item-name">Dr. {{ medecin.prenoms }} {{ medecin.nom }}</span>
                    <i class="fas fa-circle item-status-icon"></i>
                </div>
            </div>
            <div v-else class="dropdown-item">
                <span class="item-name">Aucun médecin en ligne</span>
            </div>
            <!-- <hr class="divider">
            <a href="#" class="dropdown-link">Paramètres</a>
            <a href="#" class="dropdown-link">Se déconnecter</a> -->
        </div>
    </div>
</template>

<style scoped>
/* Styles du bouton de profil */
.profile-menu {
    position: relative;
    z-index: 1000;
}

.profile-btn {
    background-color: var(--gh-input-bg);
    border: 1px solid var(--gh-border-color);
    padding: 6px 6px;
    border-radius: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--gh-text-color);
    transition: background-color 0.2s, border-color 0.2s;
}

.profile-btn .chevron-down {
    margin-left: 8px;
    margin-right: 4px;
    transition: transform 0.2s ease;
}

.profile-btn.open .chevron-down {
    transform: rotate(180deg);
}

.profile-btn:hover {
    background-color: var(--gh-navbar-link-hover);
}

.profile-icon {
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background-color: var(--gh-primary-blue);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 12px;
}

/* Menu déroulant */
.profile-dropdown {
    display: none;
    position: absolute;
    top: 100%; /* Ajusté pour être sous le bouton */
    right: -50px;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 3px 6px var(--gh-shadow);
    width: 250px;
    flex-direction: column;
    padding: 10px 0;
    z-index: 1000;
    margin-top: 8px; /* Espace entre le bouton et le dropdown */
    animation: fadeIn 0.2s ease-out;
}

.profile-dropdown.open {
    display: flex;
}

.dropdown-header {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #6a737d;
    border-bottom: 1px solid var(--gh-border-color);
    margin-bottom: 5px;
}

body.dark-mode .dropdown-header {
    color: #8b949e;
}

.dropdown-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 6px;
    margin: 0 5px;
}

.dropdown-item:hover {
    background-color: var(--gh-hover-bg);
}

.item-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 10px;
}

.item-name {
    flex-grow: 1;
}

.item-status-icon {
    font-size: 10px;
    color: #28a745; /* Vert pour le statut en ligne */
}

.divider {
    border: none;
    height: 1px;
    background-color: var(--gh-border-color);
    margin: 5px 0;
}

.dropdown-link {
    padding: 8px 16px;
    font-size: 14px;
    color: var(--gh-primary-blue);
    text-decoration: none;
    transition: background-color 0.2s;
    display: block;
    margin: 0 5px;
    border-radius: 6px;
}

.dropdown-link:hover {
    background-color: var(--gh-hover-bg);
    text-decoration: underline;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
