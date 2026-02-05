<script setup>
import { ref, onMounted } from 'vue';
import { getUserInfo } from '@/utils/auth'; // Assurez-vous que ce chemin est correct
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

const userInfo = ref(getUserInfo());

const profileForm = ref({
    name: userInfo.value ? `${userInfo.value.nom} ${userInfo.value.prenoms}` : '',
    email: userInfo.value ? userInfo.value.email : '',
});

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});

const updateProfile = () => {
    console.log('Mise à jour du profil:', profileForm.value);
    // Logique pour appeler l'API de mise à jour du profil
    alert('Profil mis à jour (fonctionnalité non implémentée)');
};

const changePassword = () => {
    console.log('Changement de mot de passe:', passwordForm.value);
    // Logique pour appeler l'API de changement de mot de passe
    alert('Mot de passe changé (fonctionnalité non implémentée)');
};

const deleteAccount = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
        console.log('Suppression du compte');
        // Logique pour appeler l'API de suppression de compte
        alert('Compte supprimé (fonctionnalité non implémentée)');
    }
};

onMounted(() => {
    // Vous pouvez charger des données supplémentaires ici si nécessaire
});
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
                <a href="#" class="navbar-brand">MediApp</a>
                <!-- <div class="navbar-nav">
                    <li  @click="$router.go(-1)">
                        <i class="fa fa-arrow-left"></i> Retour
                    </li>
                </div> -->

            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>

                <div class="ml-3">
                    <header-user />
                </div>
            </div>
        </div>

    </nav>

    <div class="container">
        <!-- Carte pour les paramètres du profil -->
        <div class="dashboard-card">
            <div class="card-header d-flex">
                <h2><i class="fa fa-user-circle"></i> Paramètres du profil</h2>
                <button class="btn"  @click="$router.go(-1)"> <i class="fa fa-arrow-left"></i> Retour</button>
            </div>
            <div class="card-body">
                <form @submit.prevent="updateProfile">
                    <!-- Section Informations de base -->
                    <div class="card-header" style="border-bottom: none;">
                        <h3><i class="fa fa-user"></i> Informations de base</h3>
                    </div>
                    <div class="form-group">
                        <label for="name">Nom et Prénom</label>
                        <input type="text" id="name" v-model="profileForm.name" placeholder="Votre nom complet"
                            required>
                    </div>
                    <div class="form-group">
                        <label for="email">Adresse e-mail</label>
                        <input type="email" id="email" v-model="profileForm.email" placeholder="votre.email@exemple.com"
                            required>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Enregistrer les
                            modifications</button>
                    </div>
                </form>

                <hr style="border: none; border-top: 1px solid var(--gh-border-color); margin: 20px 0;">

                <!-- Section Changement de mot de passe -->
                <form @submit.prevent="changePassword">
                    <div class="card-header" style="border-bottom: none;">
                        <h3><i class="fa fa-lock"></i> Modifier le mot de passe</h3>
                    </div>
                    <div class="form-group">
                        <label for="current-password">Mot de passe actuel</label>
                        <input type="password" id="current-password" v-model="passwordForm.currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">Nouveau mot de passe</label>
                        <input type="password" id="new-password" v-model="passwordForm.newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirmer le nouveau mot de passe</label>
                        <input type="password" id="confirm-password" v-model="passwordForm.confirmPassword" required>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Changer le mot de
                            passe</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Carte pour la gestion du compte -->
        <!-- <div class="dashboard-card">
            <div class="card-header">
                <h2><i class="fa fa-user-cog"></i> Gestion du compte</h2>
            </div>
            <div class="card-body">
                <p>Si vous souhaitez supprimer définitivement votre compte et toutes vos données, vous pouvez le faire
                    ci-dessous. Cette action est irréversible.</p>
                <div style="margin-top: 15px;">
                    <button @click="deleteAccount" class="btn btn-danger"><i class="fa fa-trash"></i> Supprimer le
                        compte</button>
                </div>
            </div>
        </div> -->
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    max-width: 900px;
    padding: 15px;
    margin:  1rem auto;
    overflow: auto;
}

.dashboard-card {
    background-color: var(--gh-bg-color);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 4px 12px var(--gh-shadow);
    padding: 20px;
    margin-bottom: 20px;
}

.card-header {
    border-bottom: 1px solid var(--gh-border-color);
    padding-bottom: 15px;
    margin-bottom: 15px;
}

.card-header h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-header h2 i {
    color: var(--gh-primary-blue);
}

.btn {
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background-color: var(--gh-primary-blue);
    color: #fff;
}

.btn-primary:hover {
    background-color: var(--gh-primary-blue-hover);
}

.btn-danger {
    background-color: var(--gh-danger-red);
    color: #fff;
}

.btn-danger:hover {
    background-color: #c82333;
}

/* Styles spécifiques au formulaire de profil */
.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    background-color: var(--gh-input-bg);
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.25);
}

.form-actions {
    margin-top: 20px;
    border-top: 1px solid var(--gh-border-color);
    padding-top: 20px;
}
</style>
