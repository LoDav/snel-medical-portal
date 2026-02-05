<script setup>
import { ref } from 'vue';
import { getUserInfo } from '@/utils/auth';
const props = defineProps({
    sidebarData: {
        type: Array,
        required: true
    }
})

</script>
<template>

    <aside class="sidebar">
        <div class="logo">
            <!-- <img src="@/assets/logo.png" alt="Logo"> -->
            <span>MediApp</span>
        </div>
        <ul class="nav-links">
            <li v-for="item in sidebarData" :key="item.id">
                <router-link :to="item.path" active-class="active" :class="{ active: item.active }">
                    <i :class="item.icon"></i>
                    <span>{{ item.name }}</span>
                </router-link>
            </li>
        </ul>
        <div
            style="padding: 20px; font-size: 12px; color: var(--gh-text-color-secondary); border-top: 1px solid var(--gh-border-color);">
            <i class="fa fa-user-circle"></i> {{ getUserInfo().nom }} {{ getUserInfo().prenoms }} (Session active)
        </div>
    </aside>

</template>
<style scoped>
.sidebar {
    width: 240px;
    background-color: var(--gh-header-bg);
    border-right: 1px solid var(--gh-border-color);
    display: flex;
    flex-direction: column;
    padding: 20px 0;
}

.logo {
    padding: 0 20px 30px;
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-primary-blue);
    display: flex;
    align-items: center;
    gap: 10px;
}

.nav-links {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
}

.nav-links a {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    color: var(--gh-text-color-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s;
}

.nav-links a:hover {
    background-color: var(--gh-navbar-link-hover);
    color: var(--gh-text-color);
    border-left: 3px solid var(--gh-primary-blue);
}

.nav-links a.active {
    background-color: var(--gh-sidebar-active-bg);
    color: var(--gh-primary-blue);
    border-left: 3px solid var(--gh-primary-blue);
}

.nav-links i {
    width: 20px;
    margin-right: 12px;
    font-size: 16px;
}
</style>