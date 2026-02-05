<script setup>
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';
</script>
<template>
    <div class="navbar_">
        <div style="font-weight: 500;">{{ new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
        }) }}</div>
        <div style="display: flex; gap: 20px; align-items: center;">
            <ThemeSwitcher />
            <header-user />
        </div>
    </div>
</template>
<style scoped>
.navbar_ {
    padding: 12px 30px;
    background-color: var(--gh-header-bg);
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    margin: 0;
    justify-content: space-between;
    align-items: center;
}
</style>