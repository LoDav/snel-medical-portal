<script setup>
/**
 * @file CustomAlertModal.vue
 * @author David MUKOKO <@necronemesis>
 * Component modal personnalisé pour afficher des alertes
 */

import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Alerte'
    },
    message: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'info', // 'success', 'error', 'warning', 'info'
        validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    }
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};

const alertIcon = computed(() => {
    switch (props.type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-triangle';
        case 'warning':
            return 'fa-exclamation-circle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
});

const alertColor = computed(() => {
    switch (props.type) {
        case 'success':
            return '#28a745';
        case 'error':
            return '#dc3545';
        case 'warning':
            return '#ffc107';
        case 'info':
        default:
            return '#17a2b8';
    }
});
</script>

<template>
    <div v-if="show" class="modal-overlay animate__animated animate__fadeIn">
        <div class="modal-content">
            <div class="modal-header">
                <h2>{{ title }}</h2>
                <button class="modal-close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert-content">
                    <i :class="`fa ${alertIcon} alert-icon`" :style="{ color: alertColor }"></i>
                    <p class="alert-message">{{ message }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    /* Assurez-vous qu'il est au-dessus de tout */
}

.modal-content {
    background-color: var(--gh-card-bg);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    max-height: 80%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
}

.modal-header h2 {
    margin: 0;
    font-size: 1.2em;
    color: var(--gh-text-color);
}

.modal-close-btn {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--gh-text-color-secondary);
}

.modal-close-btn:hover {
    color: var(--gh-danger-red);
}

.modal-body {
    padding: 20px;
    flex-grow: 1;
}

.alert-content {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
}

.alert-icon {
    font-size: 24px;
    margin-right: 15px;
    flex-shrink: 0;
}

.alert-message {
    margin: 0;
    font-size: 16px;
    color: var(--gh-text-color);
    line-height: 1.5;
}
</style>