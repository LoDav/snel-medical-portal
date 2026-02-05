<script setup>
// Importations des modules nécessaires de Vue et Vue Router
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
// Importation des fonctions d'authentification
import { login, setAuthData, logout, getUserInfo } from '../utils/auth';
// import Button from 'primevue/button'; // Commenté car non utilisé

// Importation de la fonction pour mettre à jour le statut en ligne
import { updateOnlineStatus } from '../utils/professionnel'

import Loading from './ui-components/animate_Components/Loading.vue';

// Initialisation du routeur de Vue
const router = useRouter();

// Déclaration des variables réactives pour les données du formulaire
const userData = {
    useName: ref(''), // Nom d'utilisateur
    passWord: ref('') // Mot de passe
}
const successMessage = ref(null) // Message de succès
const errorMessage = ref(null) // Message d'erreur
const isLoading = ref(false) // Indicateur de chargement pour le bouton de connexion
const showPassword = ref(false) // Indicateur pour afficher/masquer le mot de passe

const loading = ref(true)


/**
 * @brief Fonction pour nettoyer les champs du formulaire après connexion ou échec.
 */
const clearForm = () => {
    userData.useName.value = ''
    userData.passWord.value = ''
}

/**
 * @brief Bascule la visibilité du mot de passe.
 */
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

/**
 * @brief Stocke le token d'authentification et les informations utilisateur.
 * @param {string} token - Le token JWT reçu après connexion.
 * @param {object} userInfo - Les informations de l'utilisateur connecté.
 */
const storeToken = (token, userInfo) => {
    setAuthData(token, userInfo);
    console.log('Token et données utilisateur stockés avec succès');
}

/**
 * @brief Gère la soumission du formulaire de connexion.
 * Effectue l'appel à l'API de connexion et gère la redirection.
 */
const onLogin = async () => {
    errorMessage.value = '' // Réinitialise le message d'erreur
    successMessage.value = '' // Réinitialise le message de succès
    isLoading.value = undefined; // Active l'indicateur de chargement

    try {
        // Appel de la fonction de connexion avec les identifiants de l'utilisateur
        const result = await login({
            identifiant_connexion: userData.useName.value,
            mot_de_passe: userData.passWord.value
        });

        // Gestion des erreurs de connexion
        if (result.error) {
            errorMessage.value = result.error
            isLoading.value = false // Désactive l'indicateur de chargement en cas d'erreur
            return // Arrête l'exécution si une erreur est présente
        }

        // Si la connexion est réussie (token reçu)
        if (result.token) {
            // Stocker le token et les informations utilisateur
            storeToken(result.token, result.user);

            successMessage.value = 'Connexion réussie ! Redirection...'
            // Nettoyer le formulaire
            clearForm();

            // Mettre à jour le statut en ligne du professionnel
            await setProfessionalOnlineStatus(result.user);

            // Rediriger l'utilisateur en fonction de son type de professionnel après un délai
            setTimeout(() => {
                const typeProfessionnel = result.user?.type_professionnel;
                switch (typeProfessionnel) {
                    case 'Médecin':
                        router.push('/medecin/tableau-de-bord');
                        break;
                    case 'Infirmier':
                        router.push('/infirmier/tableau-de-bord');
                        break;
                    case 'Pharmacien':
                        router.push('/pharmacie/tableau-de-bord');
                        break;
                    case 'Secrétaire Médical':
                        router.push('/secretaire/tableau-de-bord');
                        break;
                    case 'Infirmier de Laboratoire':
                        router.push('/laborantin/tableau-de-bord');
                        break;
                    case 'Administrateur Centre':
                        router.push('/admin');
                        break;
                    default:
                        router.push('/dashboard'); // Redirection par défaut
                }
            }, 1500); // Délai de 1.5 secondes avant redirection
        }

    } catch (error) {
        console.log('error', error)
        // Gestion des erreurs HTTP spécifiques
        if (error.message == 'Erreur HTTP: 500') {
            errorMessage.value = 'Erreur interne au serveur.';
        } else if (error.message == 'Erreur HTTP: 401') { // Correction de la condition
            errorMessage.value = 'Erreur de connexion. Veuillez réessayer.';
        } else {
            errorMessage.value = 'Erreur Fatal.'; // Erreur générique
        }
    } finally {
        isLoading.value = false; // Désactive l'indicateur de chargement après l'opération
    }
}

/**
 * @brief Met à jour le statut en ligne du professionnel.
 * @param {object} userInfo - Les informations de l'utilisateur connecté.
 */
const setProfessionalOnlineStatus = async (userInfo) => {
    if (userInfo && userInfo.id_professionnel) {
        try {
            await updateOnlineStatus(userInfo.id_professionnel, 'Online');
            console.log("update online status");
        } catch (error) {
            console.log(userInfo);
            console.log("error update online status", error);
        }
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) {
//         document.documentElement.setAttribute('data-theme', savedTheme);
//     }
// });

onMounted(async () => { // Ajout de 'async' ici
    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    logout();
    loading.value = true;
    // Simuler un chargement de 4 secondes
    setTimeout(() => {
        loading.value = false
    }, 4000)
})
</script>

<template>
    <!-- Conteneur principal centré pour la page de connexion -->
    <div class="container-center">
        <!-- Conteneur du formulaire de connexion -->

        <div v-if="loading" class="loading-container">
            <div class="loader"></div>
            <Loading :words="['Login','Authentcation','Routing','Components','Ready']" />
        </div>
        

        <div class="login-container animate__animated animate__fadeIn" v-else>
            <!-- Formulaire de connexion -->
            <form action="" @submit.prevent="onLogin" class="p-4 border rounded shadow">
                <!-- <div class="text-center logo-container">
                    <img src="/logo1fade.png" alt="Logo" class="logo btn-rounded">
                </div> -->
                <h1 class="text-center mb-4 text-primary">Connexion</h1>
                <br>

                <!-- Message d'erreur affiché en cas d'échec de connexion -->
                <div v-if="errorMessage" class="error-message text-danger mb-3 animate__animated animate__shakeY">
                    {{ errorMessage }}
                </div>

                <!-- Message de succès affiché après une connexion réussie -->
                <div v-if="successMessage"
                    class="success-message text-success mb-3 animate__animated animate__fadeInDown">
                    {{ successMessage }}
                </div>

                <!-- Champ pour le nom d'utilisateur -->
                <div class="form-group mb-3">
                    <label for="identifiant">Nom d'utilisateur</label>
                    <input type="text" id="identifiant" v-model="userData.useName.value" required :disabled="isLoading"
                        class="form-control">
                </div>
                <!-- Champ pour le mot de passe -->
                <div class="form-group mb-3 position-relative">
                    <label for="mot_de_passe">Mot de passe</label>
                    <div class="password-input-wrapper">
                        <input :type="showPassword ? 'text' : 'password'" id="mot_de_passe" v-model="userData.passWord.value" required
                            :disabled="isLoading" class="form-control pe-5">
                        <button type="button" class="password-toggle-btn" @click="togglePasswordVisibility"
                            :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                            <!-- Eye icon (visible) -->
                            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <!-- Eye slash icon (hidden) -->
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <br>
                <!-- Bouton de soumission du formulaire, désactivé pendant le chargement -->
                <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
                    <span v-if="isLoading">Connexion en cours...</span>
                    <span v-else>Se connecter</span>
                </button>

                <!-- Pied de page de l'application -->
                <footer class="mt-5 text-center text-muted">
                    © Copyright 2025 Snel S.A.
                </footer>
            </form>
        </div>

    </div>
</template>


<style scoped>
/* Styles spécifiques au composant de connexion */
.container-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-shadow: var(--pico-card-box-shadow);
    /* background-color: var(--gh-bg-color); */
    /* Couleur de fond */
}

.password-input-wrapper {
    position: relative;
}

.password-toggle-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    color: #6c757d;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
}

.password-toggle-btn:hover {
    color: #495057;
}

.password-toggle-btn:focus {
    outline: none;
    color: #495057;
}

.password-toggle-btn svg {
    display: block;
}

.logo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
}

.logo-container>img {
    width: 80px;
    height: auto;
}

.login-container {
    width: 400px;
}

.loading-container{
    display: flex;
    /* flex-direction: column; */
    align-items: center;
    justify-content: center;
    height: 100vh;
}

/* HTML: <div class="loader"></div> */
/* .loader {
    width: 45px;
    aspect-ratio: .75;
    --c: no-repeat linear-gradient(var(--gh-primary-blue) 0 0);
    background:
        var(--c) 0% 50%,
        var(--c) 50% 50%,
        var(--c) 100% 50%;
    animation: l7 1s infinite linear alternate;
}

@keyframes l7 {
    0% {
        background-size: 20% 50%, 20% 50%, 20% 50%
    }

    20% {
        background-size: 20% 20%, 20% 50%, 20% 50%
    }

    40% {
        background-size: 20% 100%, 20% 20%, 20% 50%
    }

    60% {
        background-size: 20% 50%, 20% 100%, 20% 20%
    }

    80% {
        background-size: 20% 50%, 20% 50%, 20% 100%
    }

    100% {
        background-size: 20% 50%, 20% 50%, 20% 50%
    }
} */

/* HTML: <div class="loader"></div> */
.loader {
    width: 40px;
    height: 40px;
    position: relative;
    --c: no-repeat linear-gradient(var(--gh-primary-blue) 0 0);
    background:
        var(--c) center/100% 10px,
        var(--c) center/10px 100%;
}

.loader:before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        var(--c) 0 0,
        var(--c) 100% 0,
        var(--c) 0 100%,
        var(--c) 100% 100%;
    background-size: 15.5px 15.5px;
    animation: l16 1.5s infinite cubic-bezier(0.3, 1, 0, 1);
}

@keyframes l16 {
    33% {
        inset: -10px;
        transform: rotate(0deg)
    }

    66% {
        inset: -10px;
        transform: rotate(90deg)
    }

    100% {
        inset: 0;
        transform: rotate(90deg)
    }
}
</style>
