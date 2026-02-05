<template>
    <div class="resultat-detail-container">
        <div class="main-report-card">
            <!-- En-tête du rapport -->
            <div class="card-title-header">
                <h2><i class="fa fa-stethoscope"></i> Resultats d'Examens Détaillé</h2>
            </div>

            <!-- Métadonnées générales (Patient, Professionnel) -->
            <div class="metadata-grid">
                <div class="metadata-item">
                    <strong>Patient</strong>
                    <span>{{ patientInfo }}</span>
                </div>
                <div class="metadata-item">
                    <strong>Date de Naissance</strong>
                    <span>{{ formatDate(patient.date_naissance) }}</span>
                </div>
                <div class="metadata-item">
                    <strong>Professionnel (Demandeur)</strong>
                    <span>{{ professionnelInfo }}</span>
                </div>
                <div class="metadata-item">
                    <strong>Spécialité</strong>
                    <span>{{ specialite }}</span>
                </div>
            </div>

            <!-- Conteneur des résultats d'examens individuels -->
            <div class="exam-results-container">
                <div v-for="examen in examens" :key="examen.id_prescription_examen" class="exam-result-item">
                    <h3>
                        <span><i class="fa fa-flask"></i> {{ examen.nom_examen }} ({{ examen.type_examen }})</span>
                        <span class="status" :class="{ 'completed': examen.statut_examen === 'Réalisé', 'danger': examen.statut_examen === 'Demandé' }">{{ examen.statut_examen }}</span>
                    </h3>

                    <!-- Métadonnées de l'examen -->
                    <div class="metadata-grid exam-metadata-grid">
                        <div class="metadata-item">
                            <strong>Date de l'Examen</strong>
                            <span>{{ formatDate(examen.resultat_examen[0]?.date_examen) }}</span>
                        </div>
                        <div class="metadata-item">
                            <strong>Date de la Demande</strong>
                            <span>{{ formatDate(examen.date_demande) }}</span>
                        </div>
                        <div class="metadata-item">
                            <strong>Instructions</strong>
                            <span>{{ examen.instructions || 'Aucune' }}</span>
                        </div>
                        <div class="metadata-item">
                            <strong>Priorité</strong>
                            <span>{{ examen.priorite }}</span>
                        </div>
                    </div>

                    <template v-if="examen.resultat_examen && examen.resultat_examen.length > 0">
                        <!-- Section Résultats Bruts -->
                        <div class="report-section">
                            <h4><i class="fa fa-bar-chart"></i> Résultats bruts</h4>
                            <div class="report-content">
                                {{ examen.resultat_examen[0].resultats || 'Résultats en attente' }}
                            </div>
                        </div>

                        <!-- Section Compte-rendu et Interprétation -->
                        <div class="report-section">
                            <h4><i class="fa fa-comments-o"></i> Compte-rendu & Interprétation</h4>
                            <div class="compte-rendu-content">
                                {{ examen.resultat_examen[0].compte_rendu || 'Compte-rendu en attente' }}
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="report-section">
                            <h4><i class="fa fa-info-circle"></i> Résultats</h4>
                            <div class="report-content">
                                Résultats non disponibles pour cet examen.
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Actions -->
            <!-- <div class="text-right" style="margin-top: 30px;">
                <button class="btn btn-primary" @click="imprimerRapport">
                    <i class="fa fa-print"></i> Imprimer le rapport
                </button>
            </div> -->
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    prescription: {
        type: Object,
        required: true
    },
    patient: {
        type: Object,
        required: true
    }
});

const examens = computed(() => props.prescription.examens || []);

const patientInfo = computed(() => {
    if (props.patient.prenoms && props.patient.nom) {
        return `${props.patient.prenoms} ${props.patient.nom} `;
    }
    return 'Informations patient non disponibles';
});

const firstResult = computed(() => props.prescription.examens?.[0]?.resultat_examen?.[0]);

const professionnelInfo = computed(() => {
    if (firstResult.value && firstResult.value.prenoms_professionnel && firstResult.value.nom_professionnel) {
        return `${firstResult.value.prenoms_professionnel} ${firstResult.value.nom_professionnel}`;
    }
    if (props.prescription.prenoms_professionnel && props.prescription.nom_professionnel) {
        return `${props.prescription.prenoms_professionnel} ${props.prescription.nom_professionnel}`;
    }
    return 'Informations professionnel non disponibles';
});

const specialite = computed(() => {
    if (firstResult.value && firstResult.value.specialite) {
        return firstResult.value.specialite;
    }
    return props.prescription.specialite || 'Non spécifiée';
});

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(' à ', ' - ');
};

const getStatusClass = (statut) => {
    const baseClass = 'status-badge status-';
    if (!statut) return baseClass + 'default';
    return baseClass + statut.toLowerCase().replace(/[ -]/g, '_');
};

const imprimerRapport = () => {
    window.print();
};
</script>

<style scoped>
/* Variables pour les couleurs GitHub Light */
/* :root {
  --gh-bg-color: #ffffff;
  --gh-text-color: #24292e;
  --gh-border-color: #e1e4e8;
  --gh-header-bg: #f6f8fa;
  --gh-primary-blue: #0366d6;
  --gh-primary-blue-hover: #005cc5;
  --gh-success-green: #28a745;
  --gh-danger-red: #d73a49;
  --gh-input-bg: #fafbfc;
  --gh-shadow: rgba(27, 31, 35, 0.04);
  --gh-warning-yellow: #e6c200;
  --gh-sidebar-bg: #f8f9fa;
  --gh-text-color-secondary: #586069;
  --gh-ni-bg: #e9ecef;
} */

.resultat-detail-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: var(--gh-header-bg);
    color: var(--gh-text-color);
    /* padding: 20px; */
}

.main-report-card {
    background-color: var(--gh-bg-color);
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--gh-shadow);
    padding: 30px;
    /* width: 100%; */
    max-width: 900px;
    margin: 0 auto;
}

.card-title-header {
    padding-bottom: 15px;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--gh-primary-blue);
}

.card-title-header h2 {
    font-size: 24px;
    /* font-weight: 700; */
    margin: 0;
    display: block;
    /* display: flex;
    align-items: center; */
    /* gap: 10px; */
    /* color: var(--gh-text-color); */
}

.card-title-header h2 i {
    color: var(--gh-primary-blue);
}

.metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
    padding: 15px;
    background-color: var(--gh-input-bg);
    border-radius: 6px;
    border: 1px solid var(--gh-border-color);
}

.metadata-item {
    font-size: 14px;
    line-height: 1.5;
}

.metadata-item strong {
    display: block;
    font-weight: 600;
    color: var(--gh-text-color-secondary);
    margin-bottom: 4px;
    text-transform: uppercase;
    font-size: 12px;
}

.exam-metadata-grid {
    margin-bottom: 0;
    padding: 10px;
    background-color: var(--gh-card-bg);
}

/* Styles pour chaque examen individuel */
.exam-result-item {
    border: 1px solid var(--gh-primary-blue-light-border);
    border-radius: 6px;
    margin-bottom: 25px;
    padding: 20px;
    background-color: var(--gh-primary-blue-lighter-bg);
}

.exam-result-item:last-child {
    margin-bottom: 0;
}

.exam-result-item h3 {
    font-size: 18px;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 15px;
    border-bottom: 1px dashed var(--gh-primary-blue-light-border);
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.exam-result-item h3 span:first-child {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--gh-primary-blue);
}

.report-section {
    margin-top: 20px;
    margin-bottom: 20px;
    border-left: 4px solid var(--gh-primary-blue-light-border);
    padding-left: 20px;
}

.report-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--gh-text-color-secondary);
}

.report-content {
    background-color: var(--gh-card-bg);
    padding: 15px;
    border: 1px dashed var(--gh-border-color);
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 14px;
}

.compte-rendu-content {
    background-color: var(--gh-navbar-link-hover);
    padding: 15px;
    border-left: 3px solid var(--gh-success-green);
    border-radius: 4px;
    line-height: 1.6;
    font-size: 15px;
}

.status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 2em;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-left: 10px;
}

.status-realise {
    background-color: var(--gh-success-green);
    color: #fff;
}

.status-en_attente {
    background-color: var(--gh-warning-yellow);
    color: #000;
}

.status-default {
    background-color: var(--gh-border-color);
    color: var(--gh-text-color);
}

.text-right {
    text-align: right;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background-color: var(--gh-primary-blue);
    color: white;
}

.btn-primary:hover {
    background-color: var(--gh-primary-blue-hover);
}

/* Responsive */
@media (max-width: 768px) {
    .metadata-grid {
        grid-template-columns: 1fr;
    }

    .main-report-card {
        padding: 15px;
    }

    .exam-result-item {
        padding: 15px;
    }
}
</style>
