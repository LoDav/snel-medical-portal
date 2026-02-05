<template>
    <div class="datalist-input-container">
        <input
            type="text"
            :id="id"
            :list="`${id}-datalist`"
            :value="modelValue"
            @input="updateValue($event.target.value)"
            @change="handleSelection"
            :placeholder="placeholder"
            :disabled="is_disabled"
            required
        />
        <datalist :id="`${id}-datalist`">
            <option v-for="option in normalizedOptions" :key="option.id" :value="option.name"></option>
        </datalist>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    id: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        default: ''
    },
    options: {
        type: Array,
        default: () => []
    },
    placeholder: {
        type: String,
        default: ''
    },
    is_disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'select']);

const normalizedOptions = computed(() => {
    if (!props.options) return [];
    return props.options.map((option, index) => {
        if (typeof option === 'string') {
            return { id: index, name: option };
        }
        return option;
    });
});

const updateValue = (value) => {
    emit('update:modelValue', value);
};

const handleSelection = (event) => {
    const selectedName = event.target.value;
    const selectedOption = normalizedOptions.value.find(option => option.name === selectedName);
    if (selectedOption) {
        emit('select', selectedOption);
    } else {
        emit('update:modelValue', selectedName);
    }
};
</script>

<style scoped>
.datalist-input-container {
    position: relative;
    width: 100%;
}

.datalist-input-container input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
}
</style>
