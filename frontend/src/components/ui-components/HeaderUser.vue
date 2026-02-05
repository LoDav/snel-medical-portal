<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo, logout } from '@/utils/auth';

const router = useRouter();
const profileMenuRef = ref(null);
const showProfileDropdown = ref(false);
const userInfo = ref(getUserInfo());

// Mettre à jour les initiales uniquement si userInfo n'est pas null
if (userInfo.value) {
    userInfo.value.initials = (userInfo.value.nom ? userInfo.value.nom[0] : '') + (userInfo.value.prenoms ? userInfo.value.prenoms[0] : '');
}

function toggleProfileDropdown() {
    showProfileDropdown.value = !showProfileDropdown.value;
}

function disconnect() {
    router.push('/logout');
}

const handleClickOutside = (event) => {
    if (profileMenuRef.value && !profileMenuRef.value.contains(event.target)) {
        showProfileDropdown.value = false;
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
    <div class="profile-menu" ref="profileMenuRef">
        <button class="profile-btn" id="profile-toggle" :class="{ 'open': showProfileDropdown }" @click="toggleProfileDropdown">
            <span class="profile-icon">{{ userInfo?.initials }}</span>
            <span id="profile-name">{{ userInfo?.nom }} {{ userInfo?.prenoms }}</span>
            <i class="fa fa-chevron-down chevron-down"></i>
        </button>
        <div class="profile-dropdown" :class="{ 'open': showProfileDropdown }"  v-if="showProfileDropdown && userInfo" id="profile-dropdown">
            <div class="profile-info">
                <strong><i class="fa fa-user-md" aria-hidden="true"></i> {{ userInfo.nom }} {{ userInfo.prenoms }}</strong>
                <p>{{ userInfo.type_professionnel }}</p>
                <!-- <p>ID : #{{ userInfo.id_professionnel }}</p> -->
            </div>
            <a href="#" class="profile-dropdown-link" @click.prevent="router.push('/profile-settings')"><i class="fa fa-user"></i> Paramètres du profil</a>
            <a href="#" @click.prevent="disconnect" class="profile-dropdown-link"><i class="fa fa-sign-out"></i> Se déconnecter</a>
        </div>
    </div>
</template>
<style scoped>
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

.profile-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 3px 10px var(--gh-shadow);
    padding: 10px;
    margin-top: 8px;
    width: 200px;
    display: none;
    flex-direction: column;
    animation: fadeIn 0.2s ease-out;
}

.profile-dropdown.open {
    display: flex;
}

.profile-info {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    margin-bottom: 10px;
}

.profile-info p {
    margin: 0;
    font-size: 14px;
}

.profile-info strong {
    display: block;
    font-weight: 600;
}

.profile-dropdown-link {
    text-decoration: none;
    color: var(--gh-text-color);
    padding: 8px 10px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.profile-dropdown-link:hover {
    background-color: var(--gh-navbar-link-hover);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
