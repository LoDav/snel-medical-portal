<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { logout, getUserInfo } from '../utils/auth';
import { updateOnlineStatus } from '../utils/professionnel';

const router = useRouter();
const loading = ref(true)
const userInfo = ref(null); // Initialiser userInfo comme une référence réactive

const handleReconnect = () => {
    logout();
    router.push('/');
};

onMounted(async () => {
    userInfo.value = getUserInfo(); // Récupérer les informations utilisateur après le montage
    console.log(userInfo.value);

    if (userInfo.value && userInfo.value.id_professionnel) {
        try {
            await updateOnlineStatus(userInfo.value.id_professionnel, 'Offline');
            console.log("update online status deconnexion");
            
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut en ligne :", error);
        }
    }else{
        console.log("pas de professionnel connecté");
        console.log(userInfo.value);
    }
    logout(); // S'assurer que la déconnexion est effectuée

    const intervalId = setInterval(() => {
        loading.value = false
        clearInterval(intervalId)
    }, 2500)

});
</script>

<template>
    <div class="logout-page animate__animated animate__fadeIn">
        <div class="banter-loader" v-if="loading">
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
            <div class="banter-loader__box"></div>
        </div>

        <div class="container animate__animated animate__bounceIn" v-else>
            <div class="icon-container">
                <i class="fa fa-check-circle"></i>
            </div>
            <h1>Déconnexion réussie !</h1>
            <p>Vous avez été déconnecté de votre compte. Vous pouvez fermer cette page ou vous reconnecter.</p>
            <a href="#" class="reconnect-link" @click.prevent="handleReconnect">Se reconnecter</a>
        </div>
    </div>


</template>

<style scoped>
/* From Uiverse.io by Nawsome */
.banter-loader {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 72px;
    height: 72px;
    margin-left: -36px;
    margin-top: -36px;
}

.banter-loader__box {
    float: left;
    position: relative;
    width: 20px;
    height: 20px;
    margin-right: 6px;
}

.banter-loader__box:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: var(--gh-primary-blue);
}

.banter-loader__box:nth-child(3n) {
    margin-right: 0;
    margin-bottom: 6px;
}

.banter-loader__box:nth-child(1):before,
.banter-loader__box:nth-child(4):before {
    margin-left: 26px;
}

.banter-loader__box:nth-child(3):before {
    margin-top: 52px;
}

.banter-loader__box:last-child {
    margin-bottom: 0;
}

@keyframes moveBox-1 {
    9.0909090909% {
        transform: translate(-26px, 0);
    }

    18.1818181818% {
        transform: translate(0px, 0);
    }

    27.2727272727% {
        transform: translate(0px, 0);
    }

    36.3636363636% {
        transform: translate(26px, 0);
    }

    45.4545454545% {
        transform: translate(26px, 26px);
    }

    54.5454545455% {
        transform: translate(26px, 26px);
    }

    63.6363636364% {
        transform: translate(26px, 26px);
    }

    72.7272727273% {
        transform: translate(26px, 0px);
    }

    81.8181818182% {
        transform: translate(0px, 0px);
    }

    90.9090909091% {
        transform: translate(-26px, 0px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(1) {
    animation: moveBox-1 4s infinite;
}

@keyframes moveBox-2 {
    9.0909090909% {
        transform: translate(0, 0);
    }

    18.1818181818% {
        transform: translate(26px, 0);
    }

    27.2727272727% {
        transform: translate(0px, 0);
    }

    36.3636363636% {
        transform: translate(26px, 0);
    }

    45.4545454545% {
        transform: translate(26px, 26px);
    }

    54.5454545455% {
        transform: translate(26px, 26px);
    }

    63.6363636364% {
        transform: translate(26px, 26px);
    }

    72.7272727273% {
        transform: translate(26px, 26px);
    }

    81.8181818182% {
        transform: translate(0px, 26px);
    }

    90.9090909091% {
        transform: translate(0px, 26px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(2) {
    animation: moveBox-2 4s infinite;
}

@keyframes moveBox-3 {
    9.0909090909% {
        transform: translate(-26px, 0);
    }

    18.1818181818% {
        transform: translate(-26px, 0);
    }

    27.2727272727% {
        transform: translate(0px, 0);
    }

    36.3636363636% {
        transform: translate(-26px, 0);
    }

    45.4545454545% {
        transform: translate(-26px, 0);
    }

    54.5454545455% {
        transform: translate(-26px, 0);
    }

    63.6363636364% {
        transform: translate(-26px, 0);
    }

    72.7272727273% {
        transform: translate(-26px, 0);
    }

    81.8181818182% {
        transform: translate(-26px, -26px);
    }

    90.9090909091% {
        transform: translate(0px, -26px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(3) {
    animation: moveBox-3 4s infinite;
}

@keyframes moveBox-4 {
    9.0909090909% {
        transform: translate(-26px, 0);
    }

    18.1818181818% {
        transform: translate(-26px, 0);
    }

    27.2727272727% {
        transform: translate(-26px, -26px);
    }

    36.3636363636% {
        transform: translate(0px, -26px);
    }

    45.4545454545% {
        transform: translate(0px, 0px);
    }

    54.5454545455% {
        transform: translate(0px, -26px);
    }

    63.6363636364% {
        transform: translate(0px, -26px);
    }

    72.7272727273% {
        transform: translate(0px, -26px);
    }

    81.8181818182% {
        transform: translate(-26px, -26px);
    }

    90.9090909091% {
        transform: translate(-26px, 0px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(4) {
    animation: moveBox-4 4s infinite;
}

@keyframes moveBox-5 {
    9.0909090909% {
        transform: translate(0, 0);
    }

    18.1818181818% {
        transform: translate(0, 0);
    }

    27.2727272727% {
        transform: translate(0, 0);
    }

    36.3636363636% {
        transform: translate(26px, 0);
    }

    45.4545454545% {
        transform: translate(26px, 0);
    }

    54.5454545455% {
        transform: translate(26px, 0);
    }

    63.6363636364% {
        transform: translate(26px, 0);
    }

    72.7272727273% {
        transform: translate(26px, 0);
    }

    81.8181818182% {
        transform: translate(26px, -26px);
    }

    90.9090909091% {
        transform: translate(0px, -26px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(5) {
    animation: moveBox-5 4s infinite;
}

@keyframes moveBox-6 {
    9.0909090909% {
        transform: translate(0, 0);
    }

    18.1818181818% {
        transform: translate(-26px, 0);
    }

    27.2727272727% {
        transform: translate(-26px, 0);
    }

    36.3636363636% {
        transform: translate(0px, 0);
    }

    45.4545454545% {
        transform: translate(0px, 0);
    }

    54.5454545455% {
        transform: translate(0px, 0);
    }

    63.6363636364% {
        transform: translate(0px, 0);
    }

    72.7272727273% {
        transform: translate(0px, 26px);
    }

    81.8181818182% {
        transform: translate(-26px, 26px);
    }

    90.9090909091% {
        transform: translate(-26px, 0px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(6) {
    animation: moveBox-6 4s infinite;
}

@keyframes moveBox-7 {
    9.0909090909% {
        transform: translate(26px, 0);
    }

    18.1818181818% {
        transform: translate(26px, 0);
    }

    27.2727272727% {
        transform: translate(26px, 0);
    }

    36.3636363636% {
        transform: translate(0px, 0);
    }

    45.4545454545% {
        transform: translate(0px, -26px);
    }

    54.5454545455% {
        transform: translate(26px, -26px);
    }

    63.6363636364% {
        transform: translate(0px, -26px);
    }

    72.7272727273% {
        transform: translate(0px, -26px);
    }

    81.8181818182% {
        transform: translate(0px, 0px);
    }

    90.9090909091% {
        transform: translate(26px, 0px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(7) {
    animation: moveBox-7 4s infinite;
}

@keyframes moveBox-8 {
    9.0909090909% {
        transform: translate(0, 0);
    }

    18.1818181818% {
        transform: translate(-26px, 0);
    }

    27.2727272727% {
        transform: translate(-26px, -26px);
    }

    36.3636363636% {
        transform: translate(0px, -26px);
    }

    45.4545454545% {
        transform: translate(0px, -26px);
    }

    54.5454545455% {
        transform: translate(0px, -26px);
    }

    63.6363636364% {
        transform: translate(0px, -26px);
    }

    72.7272727273% {
        transform: translate(0px, -26px);
    }

    81.8181818182% {
        transform: translate(26px, -26px);
    }

    90.9090909091% {
        transform: translate(26px, 0px);
    }

    100% {
        transform: translate(0px, 0px);
    }
}

.banter-loader__box:nth-child(8) {
    animation: moveBox-8 4s infinite;
}

@keyframes moveBox-9 {
    9.0909090909% {
        transform: translate(-26px, 0);
    }

    18.1818181818% {
        transform: translate(-26px, 0);
    }

    27.2727272727% {
        transform: translate(0px, 0);
    }

    36.3636363636% {
        transform: translate(-26px, 0);
    }

    45.4545454545% {
        transform: translate(0px, 0);
    }

    54.5454545455% {
        transform: translate(0px, 0);
    }

    63.6363636364% {
        transform: translate(-26px, 0);
    }

    72.7272727273% {
        transform: translate(-26px, 0);
    }

    81.8181818182% {
        transform: translate(-52px, 0);
    }

    90.9090909091% {
        transform: translate(-26px, 0);
    }

    100% {
        transform: translate(0px, 0);
    }
}

.banter-loader__box:nth-child(9) {
    animation: moveBox-9 4s infinite;
}

.logout-page {
    /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    margin: 0;
    padding: 20px;
    display: flex;
    
    align-items: center;
    /* min-height: 100vh; */
    /*text-align: center;
    transition: background-color 0.3s, color 0.3s; */
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    box-shadow: var(--pico-card-box-shadow);
}

/* Conteneur principal */
.container {
    max-width: 450px;
    max-height: 350px;
    padding: 40px;
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    border: 1px solid var(--gh-border-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Icône de confirmation */
.icon-container {
    font-size: 60px;
    color: var(--gh-success-green);
    margin-bottom: 20px;
}

/* Titre et message */
h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 10px;
}

p {
    font-size: 16px;
    color: #6a737d;
    margin-bottom: 30px;
}

body.dark-mode p {
    color: #8b949e;
}

/* Lien de reconnexion */
.reconnect-link {
    display: inline-block;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    background-color: var(--gh-primary-blue);
    border: 1px solid var(--gh-primary-blue);
    border-radius: 6px;
    text-decoration: none;
    transition: background-color 0.2s, border-color 0.2s;
}

.reconnect-link:hover {
    background-color: var(--gh-primary-blue-hover);
    border-color: var(--gh-primary-blue-hover);
}
</style>
