<script setup>
const props = defineProps({
    text: String,
    icon: String,
    active: { type: Boolean, default: false },
    to: String, // Ajout de la propriété "to" pour le chemin de la route
});
</script>

<template>
    <li class="nav-item">
            <router-link :to="props.to" class="nav-link" :class="{ active: props.active }">
                <i :class="`fa fa-${props.icon}`"></i> {{ props.text }}
            </router-link>

    </li>
</template>

<style scoped>
.nav-link {
    color: inherit;
    text-decoration: none;
}

.nav-link.active {
    font-weight: bold;
    color: white;
}
</style>