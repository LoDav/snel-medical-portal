<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    antecedents: {
        type: Array,
        default: () => []
    }
});
</script>

<template>
    <div class="dossier-section">
        <div class="dossier-section-header">
            Antécédents
            <slot name="header-actions"></slot>
        </div>
        <div>
            <div v-if="antecedents.length != 0">
                <ul>
                    <li v-for="data, id in antecedents" :key="id">
                        <span>{{ data.description }}</span>
                        <span class="ml-3" :class="{
                            'status completed': data.gravite == 'Légère',
                            'status pending': data.gravite == 'Modérée',
                            'status danger': data.gravite == 'Sévère'
                        }">{{
                                            data.gravite }}</span>
                    </li>
                </ul>
            </div>
            <div v-else>
                Aucune Antécédents connue
            </div>
        </div>
        <slot name="after-table"></slot>
    </div>
</template>

<style scoped>
.dossier-section {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
}

.dossier-section-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dossier-section > ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.dossier-section > li {
    padding: 8px 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
    font-size: 14px;
    /* display: flex;
    justify-content: space-between;
    align-items: flex-start; */
}

.data-view {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.data-table th,
.data-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.data-table th {
    background-color: var(--gh-bg-color);
    font-weight: 600;
    color: var(--gh-text-color-light);
}

.data-table tbody tr:hover {
    background-color: var(--gh-hover-bg);
}

.status {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
}

.status.completed {
    background-color: #e6ffe6;
    color: #008000;
}

.status.pending {
    background-color: #fff3e0;
    color: #ff9800;
}

.status.danger {
    background-color: #ffe6e6;
    color: #ff0000;
}
</style>
