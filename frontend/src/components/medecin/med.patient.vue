<script setup>
import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';
import DossierMedical from '../ui-components/DossierMedical.vue';

</script>
<template>
    <nav>
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer-alt" to="/medecin/tableau-de-bord" />
                <DashboardLink text="Consutations" icon="user-md" to="/medecin/consultation" />
                <DashboardLink text="Patients" icon="users" to="/medecin/patients" :active="true" />
                <DashboardLink text="Rendez-vous" icon="calendar-plus-o" to="/medecin/rendezvous" />
            </ul>
            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>
                
                <div class="ml-3">
                    <header-user/>
                </div>
            </div>
        </div>
    </nav>

    <DossierMedical />
</template>