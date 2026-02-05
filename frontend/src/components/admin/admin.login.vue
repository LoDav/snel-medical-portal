<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { login, setAuthData, logout } from '../../utils/auth'; // Ensure these utils exist/are importable
// Placeholder imports if utils not found or to simplify
import { login, setAuthData } from '@/utils/auth';
import Loading from '../ui-components/animate_Components/Loading.vue';

const router = useRouter();

const userData = {
    useName: ref(''),
    passWord: ref('')
}
const successMessage = ref(null)
const errorMessage = ref(null)
const isLoading = ref(false)

const onLogin = async () => {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true;

    try {
        const result = await login({
            identifiant_connexion: userData.useName.value,
            mot_de_passe: userData.passWord.value
        });

        if (result.error) {
            errorMessage.value = result.error
            isLoading.value = false
            return
        }

        if (result.token) {
            setAuthData(result.token, result.user);
            successMessage.value = 'Connexion réussie ! Redirection...'

            setTimeout(() => {
                router.push('/admin/tableau-de-bord'); // Adjust route as needed
            }, 1000);
        }

    } catch (error) {
        console.log('error', error)
        errorMessage.value = 'Erreur de connexion.';
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="container-center">
        <div class="login-container animate__animated animate__fadeIn">
            <form action="" @submit.prevent="onLogin" class="p-4 border rounded shadow">
                <h1 class="text-center mb-4 text-primary">Connexion Admin</h1>
                <br>

                <div v-if="errorMessage" class="error-message text-danger mb-3 animate__animated animate__shakeY">
                    {{ errorMessage }}
                </div>

                <div v-if="successMessage"
                    class="success-message text-success mb-3 animate__animated animate__fadeInDown">
                    {{ successMessage }}
                </div>

                <div class="form-group mb-3">
                    <label for="identifiant">Nom d'utilisateur</label>
                    <input type="text" id="identifiant" v-model="userData.useName.value" required :disabled="isLoading"
                        class="form-control">
                </div>
                <div class="form-group mb-3">
                    <label for="mot_de_passe">Mot de passe</label>
                    <input type="password" id="mot_de_passe" v-model="userData.passWord.value" required
                        :disabled="isLoading" class="form-control">
                </div>
                <br>
                <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
                    <span v-if="isLoading">Connexion en cours...</span>
                    <span v-else>Se connecter</span>
                </button>

                <footer class="mt-5 text-center text-muted">
                    © Copyright 2025 Snel S.A.
                </footer>
            </form>
        </div>
    </div>
</template>

<style scoped>
.container-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-shadow: var(--pico-card-box-shadow);
}

.login-container {
    width: 400px;
}
</style>
