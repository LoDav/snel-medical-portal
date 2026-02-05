<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from 'vue';

const files = ref([]);
const labelText = ref('Cliquez pour sélectionner un fichier ou glissez-déposez-le ici');
const fileInputContainer = ref(null);
const fileInput = ref(null);

const props = defineProps({
    titre: {
        type: String
    }
});

const emit = defineEmits(['file-selected']);


// --- Gestion des événements de glisser-déposer ---
const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputContainer.value.classList.add('drag-over');
};

const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputContainer.value.classList.remove('drag-over');
};

const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputContainer.value.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
};

// --- Gestion de la sélection de fichiers ---
const handleFileChange = (e) => {
    handleFiles(e.target.files);
};

// --- Fonction pour gérer les fichiers sélectionnés ---
const handleFiles = (selectedFiles) => {
    if (selectedFiles.length > 0) {
        files.value = [selectedFiles[0]]; // Ne prend que le premier fichier
        labelText.value = `Fichier prêt pour l'envoi`;
        emit('file-selected', files.value[0]); // Émet le fichier sélectionné
    } else {
        resetInput();
    }
};

// --- Fonction pour retirer le fichier ---
const removeFile = () => {
    resetInput();
};

// --- Fonction pour réinitialiser le composant ---
const resetInput = () => {
    files.value = [];
    if (fileInput.value) {
        fileInput.value.value = ''; // Réinitialise la valeur de l'input natif
    }
    labelText.value = `Cliquez pour sélectionner un fichier ou glissez-déposez-le ici`;
    emit('file-selected', null); // Émet null quand le fichier est réinitialisé
};

onMounted(() => {
    fileInputContainer.value = document.getElementById('fileInputContainer');
    fileInput.value = document.getElementById('fileInput');

    if (fileInputContainer.value) {
        fileInputContainer.value.addEventListener('dragover', handleDragOver);
        fileInputContainer.value.addEventListener('dragleave', handleDragLeave);
        fileInputContainer.value.addEventListener('drop', handleDrop);
    }
});

onUnmounted(() => {
    if (fileInputContainer.value) {
        fileInputContainer.value.removeEventListener('dragover', handleDragOver);
        fileInputContainer.value.removeEventListener('dragleave', handleDragLeave);
        fileInputContainer.value.removeEventListener('drop', handleDrop);
    }
});
</script>
<template>
    <div class="container-file">
        <h2>{{ props.titre }}</h2>
        <!-- Conteneur pour le composant de fichier -->
        <div class="file-input-container" id="fileInputContainer">
            <input type="file" id="fileInput" @change="handleFileChange">
            <label for="fileInput" class="file-input-label">
                <i class="fas fa-cloud-upload-alt"></i>
                <span id="labelText">{{ labelText }}</span>
            </label>
        </div>

        <!-- Informations sur les fichiers et bouton de réinitialisation -->
        <div class="file-info" :class="{ 'visible': files.length > 0 }" id="fileInfo">
            <p>Fichiers sélectionnés :</p>
            <ul id="fileList" class="file-list">
                <li v-if="files.length > 0">
                    <span>{{ files[0].name }}</span>
                    <i class="fas fa-times-circle" title="Supprimer ce fichier" @click="removeFile()"></i>
                </li>
            </ul>
            <!-- <button class="reset-button mt-2" id="resetButton" @click.prevent="resetInput">Réinitialiser</button> -->
        </div>
    </div>
</template>



<style scoped>
/* Variables pour les thèmes existants de MediApp */

/* Styles pour les autres thèmes (ajoutez-les ici si nécessaire pour les tests) */

/* body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    margin: 0;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    transition: background-color 0.3s, color 0.3s;
    box-sizing: border-box;
} */

.container-file {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    box-shadow: 0 3px 6px var(--gh-shadow);
    width: 100%;
    max-width: 768px; 
    min-width: 20vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

h2 {
    margin: 0;
    padding: 0;
    font-size: 24px;
    font-weight: 600;
}

/* Styles pour le composant de sélection de fichiers */
.file-input-container {
    border: 2px dashed var(--gh-border-color);
    border-radius: 6px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.3s, background-color 0.3s;
    position: relative;
}

.file-input-container:hover, .file-input-container.drag-over {
    border-color: var(--gh-primary-blue);
    background-color: var(--gh-input-bg);
}

.file-input-container input[type="file"] {
    display: none; /* Cache l'input natif */
}

.file-input-label {
    display: block;
    font-size: 16px;
    font-weight: 500;
    color: var(--gh-text-color);
    cursor: pointer;
}

.file-input-label i {
    font-size: 32px;
    color: var(--gh-primary-blue);
    margin-bottom: 8px;
    display: block;
}

.file-info {
    margin-top: 12px;
    font-size: 14px;
    color: var(--gh-text-color);
    display: none; /* Masqué par défaut */
}

.file-info.visible {
    display: block;
}

.file-list {
    list-style: none;
    padding: 0;
    margin: 8px 0 0 0;
    text-align: left;
}

.file-list li {
    background-color: var(--gh-sidebar-bg);
    border: 1px solid var(--gh-border-color);
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    word-break: break-all;
}

.file-list li:last-child {
    margin-bottom: 0;
}

.file-list i {
    cursor: pointer;
    color: var(--gh-danger-red);
    margin-left: 12px;
}

/* Bouton de réinitialisation */
.reset-button {
    margin-top: 12px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gh-text-color);
    background-color: transparent;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s, border-color 0.3s;
}

.reset-button:hover {
    background-color: var(--gh-navbar-link-hover);
}
</style>
