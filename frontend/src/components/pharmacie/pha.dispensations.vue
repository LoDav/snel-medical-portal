<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

import { getAllDetailedPrescriptions } from '../../utils/lignePrescription.js';
import { getUserInfo } from '@/utils/auth';
import DispensationModal from './pha.components/DispensationModal.vue';
import DispensationHistoryModal from './pha.components/DispensationHistoryModal.vue';

const router = useRouter();
const selectedPrescriptionId = ref(null);
const prescriptions = ref([]);
const dataLoaded = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const showDispensationModal = ref(false);
const selectedMedicament = ref(null);
const selectedLignePrescriptionId = ref('');
const showDispensationHistoryModal = ref(false);
const quantite_prescrite = ref(0)
const activeTab = ref('pending');
const searchCriteria = ref('name'); // 'name', 'prescriptionId', 'patientId'

const loadPrescriptions = async () => {
    try {
        const data = await getAllDetailedPrescriptions();
        dataLoaded.value = data;
        console.log('Données reçues:', data);
        // console.log('json string:', JSON.stringify(data));

        // Transformer les données pour correspondre à la structure attendue
        // Grouper par patient et prendre la prescription la plus récente pour éviter les doublons
        const patientMap = new Map();
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                const patient = item.patient_prescriptions_json;
                if (patient && patient.prescriptions && Array.isArray(patient.prescriptions)) {
                    const patientKey = patient.id_patient;
                    const patientName = `${patient.prenoms_patient} ${patient.nom_patient}`;

                    // Trouver la prescription la plus récente pour ce patient
                    let latestPrescription = null;
                    patient.prescriptions.forEach(prescription => {
                        if (!latestPrescription ||
                            new Date(prescription.date_prescription) > new Date(latestPrescription.date_prescription)) {
                            latestPrescription = prescription;
                        }
                    });

                    if (latestPrescription) {
                        // Grouper les médicaments par prescription
                        const prescriptionsGrouped = patient.prescriptions.map(prescription => ({
                            id: prescription.id_prescription,
                            date: new Date(prescription.date_prescription).toISOString().split('T')[0],
                            statut: prescription.statut_prescription === 'Active' ? 'en attente' : prescription.statut_prescription.toLowerCase(),
                            prescripteur: prescription.prescripteur ? {
                                nom: prescription.prescripteur.nom,
                                prenoms: prescription.prescripteur.prenoms,
                                specialite: prescription.prescripteur.specialite,
                                id_professionnel: prescription.prescripteur.id_professionnel
                            } : null,
                            medicaments: prescription.medicaments && Array.isArray(prescription.medicaments) ?
                                prescription.medicaments.map(med => ({
                                    name: med.nom,
                                    dosage: med.dosage,
                                    quantity: med.quantite_prescrite || med.posologie,
                                    id_medicament: med.id_medicament,
                                    id_ligne: med.id_ligne || med.id_ligne_prescription,
                                    status : med.statut,
                                    posologie: med.posologie,
                                    forme: med.forme,
                                    unite_vente: med.unite_vente
                                })) : []
                        }));

                        // Trier les prescriptions par date du plus récent au plus ancien
                        prescriptionsGrouped.sort((a, b) => new Date(b.date) - new Date(a.date));

                        patientMap.set(patientKey, {
                            id: latestPrescription.id_prescription,
                            patientId: patient.id_patient,
                            name: patientName,
                            status: latestPrescription.statut_prescription === 'Active' ? 'en attente' : latestPrescription.statut_prescription.toLowerCase(),
                            date: new Date(latestPrescription.date_prescription).toISOString().split('T')[0],
                            prescriptions: prescriptionsGrouped
                        });
                    }
                }
            });
        }
        prescriptions.value = Array.from(patientMap.values());
        console.log('Prescriptions transformées:', prescriptions.value);

    } catch (error) {
        console.error('Erreur lors du chargement des prescriptions:', error);
    } finally {
        loading.value = false;
    }
};

const switchTab = (tab) =>{
    activeTab.value = tab
    // filteredPrescriptions.value = []
}

onMounted(async () => {
    await loadPrescriptions();
    // Sélectionner automatiquement le premier élément si disponible
    if (filteredPrescriptions.value.length > 0) {
        selectPrescription(filteredPrescriptions.value[0].id);
    }
});

const statusText = {
    'en attente': 'En attente',
    'préparée': 'Préparée',
    'dispensée': 'Dispensée'
};



const selectedPrescription = computed(() => {
    return prescriptions.value.find(p => p.id === selectedPrescriptionId.value);
});

const filteredPrescriptions = computed(() => {
    // Filtrer seulement les prescriptions qui ont des médicaments (ni null ni tableau vide)
    let prescriptionsWithMedicaments = prescriptions.value.filter(p =>
        p.prescriptions && p.prescriptions.some(prescription =>
            prescription.medicaments && Array.isArray(prescription.medicaments) && prescription.medicaments.length > 0
        )
    );

    // Appliquer la recherche
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        prescriptionsWithMedicaments = prescriptionsWithMedicaments.filter(p => {
            switch (searchCriteria.value) {
                case 'name':
                    return p.name.toLowerCase().includes(query);
                case 'prescriptionId':
                    return p.id.toString().toLowerCase().includes(query);
                case 'patientId':
                    return p.patientId.toLowerCase().includes(query);
                default:
                    return true;
            }
        });
    }

    if (activeTab.value === 'pending') {
        // Prescriptions en attente : au moins un médicament non délivré
        return prescriptionsWithMedicaments.filter(p =>
            p.prescriptions.some(prescription =>
                prescription.medicaments && prescription.medicaments.some(med => med.status !== 'DÉLIVRÉE')
            )
        );
    } else if (activeTab.value === 'processed') {
        // Prescriptions traitées : tous les médicaments délivrés
        return prescriptionsWithMedicaments.filter(p =>
            p.prescriptions.every(prescription =>
                prescription.medicaments && prescription.medicaments.every(med => med.status === 'DÉLIVRÉE')
            )
        );
    }
    return prescriptionsWithMedicaments;
});

const pendingCount = computed(() => {
    const prescriptionsWithMedicaments = prescriptions.value.filter(p =>
        p.prescriptions && p.prescriptions.some(prescription =>
            prescription.medicaments && Array.isArray(prescription.medicaments) && prescription.medicaments.length > 0
        )
    );
    return prescriptionsWithMedicaments.filter(p =>
        p.prescriptions.some(prescription =>
            prescription.medicaments && prescription.medicaments.some(med => med.status !== 'DÉLIVRÉE')
        )
    ).length;
});

const processedCount = computed(() => {
    const prescriptionsWithMedicaments = prescriptions.value.filter(p =>
        p.prescriptions && p.prescriptions.some(prescription =>
            prescription.medicaments && Array.isArray(prescription.medicaments) && prescription.medicaments.length > 0
        )
    );
    return prescriptionsWithMedicaments.filter(p =>
        p.prescriptions.every(prescription =>
            prescription.medicaments && prescription.medicaments.every(med => med.status === 'DÉLIVRÉE')
        )
    ).length;
});

const selectPrescription = (prescriptionId) => {
    selectedPrescriptionId.value = prescriptionId;
};

const preparePrescription = (prescriptionId) => {
    // Trouver la prescription spécifique dans selectedPrescription.prescriptions
    const prescription = selectedPrescription.value?.prescriptions?.find(p => p.id === prescriptionId);
    if (prescription) {
        prescription.statut = 'préparée';
        console.log(`Prescription ${prescriptionId} préparée.`);
    }
};

const dispensePrescription = (prescriptionId) => {
    // Trouver la prescription spécifique dans selectedPrescription.prescriptions
    const prescription = selectedPrescription.value?.prescriptions?.find(p => p.id === prescriptionId);
    if (prescription) {
        prescription.statut = 'dispensée';
        console.log(`Prescription ${prescriptionId} dispensée.`);
    }
};

const openDispensationModal = (medicament, lignePrescriptionId,Qte) => {
    selectedMedicament.value = medicament;
    selectedLignePrescriptionId.value = lignePrescriptionId;
    quantite_prescrite.value = Qte
    showDispensationModal.value = true;
};

const closeDispensationModal = () => {
    showDispensationModal.value = false;
    selectedMedicament.value = null;
    selectedLignePrescriptionId.value = '';
};

const openDispensationHistoryModal = () => {
    showDispensationHistoryModal.value = true;
};

const closeDispensationHistoryModal = () => {
    showDispensationHistoryModal.value = false;
};

const handleDispensationCreated = (result) => {
    console.log('Dispensation créée:', result);
    // Recharger les prescriptions ou mettre à jour l'état local
    loadPrescriptions();
};

const getSearchPlaceholder = () => {
    switch (searchCriteria.value) {
        case 'name':
            return 'Rechercher par nom de patient...';
        case 'prescriptionId':
            return 'Rechercher par ID de prescription...';
        case 'patientId':
            return 'Rechercher par ID de patient...';
        default:
            return 'Rechercher...';
    }
};
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord" />
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" />
                <!-- <DashboardLink text="Mouvements" icon="exchange" to="/pharmacie/mouvements" /> -->
                <DashboardLink text="Prescriptions" icon="plus-square" to="/pharmacie/dispensations" :active="true" />
                <!-- <DashboardLink text="Inventaire" icon="list" to="/pharmacie/inventaire" /> -->
            </ul>
            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>
                <div class="ml-3">
                    <HeaderUser />
                </div>
            </div>
        </div>
    </nav>

    <div class="main-wrapper animate__animated animate__fadeIn">
        <div class="container">
            <div class="header">
                <h1>Gestion des Dispensations</h1>
                <button class="btn" @click="openDispensationHistoryModal"><i class="fa fa-history"></i> Historique des Sorties</button>
            </div>

            <div class="main-content">
                <!-- Panneau de la barre latérale pour les ordonnances -->
                <div class="sidebar">
                    <h2>Liste des ordonnances</h2>

                    <!-- Tabs pour filtrer les prescriptions -->
                    <div class="prescription-tabs">
                        <button
                            :class="['tab-button', { active: activeTab === 'pending' }]"
                            @click="switchTab('pending')">
                            En attente
                        </button>
                        <button
                            :class="['tab-button', { active: activeTab === 'processed' }]"
                            @click="switchTab('processed')">
                            Traitées
                        </button>
                    </div>

                    <div class="search-box">
                        <div class="search-controls">
                            <input class="w-10" type="search" :placeholder="getSearchPlaceholder()" v-model="searchQuery" />
                            <select v-model="searchCriteria" class="search-select">
                                <option value="name">Nom du patient</option>
                                <option value="prescriptionId">ID Prescription</option>
                                <option value="patientId">ID Patient</option>
                            </select>
                        </div>
                    </div>
                    <div v-if="loading" class="text-center py-4">
                        <i class="fas fa-spinner fa-spin"></i> Chargement des ordonnances...
                    </div>
                    <ul class="list-ordonnances" id="prescription-list">
                        <li v-for="prescription in filteredPrescriptions" :key="prescription.id" class="list-item" :class="{ active: selectedPrescriptionId === prescription.id }" @click="selectPrescription(prescription.id)">
                            <div>
                                <h3>{{ prescription.name }}</h3>
                                <p>Ordonnance #{{ prescription.id }}</p>
                                <!-- <span class="order-status" :class="prescription.status">{{ statusText[prescription.status] }}</span> -->
                            </div>
                        </li>
                        <li v-if="!loading && filteredPrescriptions.length === 0" class="text-center py-4">
                            Aucune ordonnance trouvée.
                        </li>
                    </ul>
                </div>

                <!-- Panneau principal pour les détails de l'ordonnance -->
                <div class="main-panel" id="main-panel">
                    <!-- <pre>{{ dataLoaded }}</pre> -->
                    <!-- <pre>{{ prescriptions }}</pre> -->
                    <!-- <pre>{{ selectedPrescription }}</pre> -->
                    <div v-if="!selectedPrescription" id="welcome-message" class="text-center py-16 text-gray-500">
                        <i class="fas fa-prescription-bottle-alt text-4xl mb-4"></i>
                        <p>Sélectionnez une ordonnance pour voir les détails et la dispenser.</p>
                    </div>

                    <div v-else id="prescription-details-container">
                        <div class="section-header">
                            <h2>Liste des prescriptions de <span id="patient-name">{{ selectedPrescription.name }}</span></h2>
                            <small class="text-muted">Patient ID: {{ selectedPrescription.id }}</small>
                        </div>
                        

                        <div v-for="prescription in selectedPrescription.prescriptions" :key="prescription.id" class="prescription-section" v-show="prescription.medicaments && prescription.medicaments.length > 0">
                            <div class="section-header">
                                <h3>Prescription du {{ prescription.date }} - prescripteur:
                                    <span v-if="prescription.prescripteur" class="prescripteur-info">
                                        (Dr. {{ prescription.prescripteur.prenoms }} {{ prescription.prescripteur.nom }} - {{ prescription.prescripteur.specialite }})
                                    </span>
                                </h3>
                            </div>
                            <div>
                                <ul class="medication-list">
                                    <li v-for="med in prescription.medicaments" :key="med.name" class="medication-list-item">
                                        <div>
                                            <span><strong>{{ med.name }}</strong> - {{ med.forme }} - {{ med.dosage }}</span>
                                            <br>
                                            <span><strong>Posologie:</strong> {{ med.posologie }}</span>
                                            <br>
                                            <span>Quantité : {{ med.quantity }}  {{ med.unite_vente || 'n/a' }}</span>
                                        </div>
                                        <button
                                            :disabled="med.status === 'DÉLIVRÉE'"
                                            type="button"
                                            class="btn btn-sm btn-success dispense-btn"
                                            @click="openDispensationModal(med, med.id_ligne || med.id_ligne_prescription, med.quantity)"
                                            style="margin-left: auto; padding: 4px 8px; font-size: 12px;"
                                        >
                                            <i class="fa fa-check"></i>{{ med.status === 'DÉLIVRÉE' ? ' Déjà délivré' : ' Dispenser' }}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <!-- <div class="action-buttons">
                                <button v-if="prescription.statut === 'en attente'" type="button" class="btn btn-primary" @click="preparePrescription(prescription.id)"><i class="fa fa-archive"></i> Préparer</button>
                                <button v-if="prescription.statut === 'préparée'" type="button" class="btn btn-success" @click="dispensePrescription(prescription.id)"><i class="fa fa-check"></i> Dispenser</button>
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de dispensation -->
    <DispensationModal
        v-if="selectedMedicament"
        :show="showDispensationModal"
        :medicament="selectedMedicament"
        :patient-id="selectedPrescription?.patientId"
        :patient-name="selectedPrescription?.name"
        :quantite="quantite_prescrite"
        :ligne-prescription-id="selectedLignePrescriptionId"
        @close="closeDispensationModal"
        @dispensation-created="handleDispensationCreated"
    />

    <!-- Modal d'historique des dispensations -->
    <DispensationHistoryModal
        :show="showDispensationHistoryModal"
        @close="closeDispensationHistoryModal"
    />
</template>



<style scoped>
.main-content {
    display: flex;
    flex-grow: 1;
    min-height: 600px;
}

.sidebar {
    width: 300px;
    background-color: var(--gh-sidebar-bg);
    border-right: 1px solid var(--gh-sidebar-border);
    padding: 20px;
    flex-shrink: 0;
    overflow-y: auto;
}

.main-panel {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
}

.section-header {
    font-size: 18px;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--gh-border-color);
    display: block;
    justify-content: space-between;
    align-items: center;
}

.section-header h2, .section-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.profile-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 10px 0;
}

.info-card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 15px;
    font-size: 14px;
}

.info-card strong {
    display: block;
    margin-bottom: 5px;
    color: var(--gh-text-color);
}

.medication-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.medication-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--gh-border-color);
}

.dispense-btn {
    margin-left: auto;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
}

.medication-list-item:last-child {
    border-bottom: none;
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

/* Style pour la liste des ordonnances */
.list-ordonnances {
    list-style: none;
    padding: 0;
    margin: 0;
}

.list-ordonnances .list-item {
    padding: 12px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 5px;
    transition: background-color 0.2s ease;
}

.list-ordonnances .list-item:hover {
    background-color: rgba(3, 102, 214, 0.1);
}

.list-ordonnances .list-item.active {
    background-color: var(--gh-primary-blue);
    color: #fff;
    font-weight: 600;
}

.list-ordonnances .list-item h3 {
    margin: 0;
    font-size: 16px;
}

.list-ordonnances .list-item p {
    margin: 0;
    font-size: 12px;
    color: #586069;
    line-height: 1.4;
}

.list-ordonnances .list-item.active p {
    color: rgba(255, 255, 255, 0.8);
}

.order-status {
    font-size: 0.9em;
    font-style: italic;
    color: var(--gh-text-color-secondary, #586069);
    margin-top: 5px;
}

.order-status.pending {
    color: var(--gh-danger-red);
}

.order-status.prepared {
    color: var(--gh-primary-blue);
}

.order-status.dispensed {
    color: var(--gh-success-green);
}

.list-ordonnances .list-item.active .order-status {
    color: rgba(255, 255, 255, 0.8);
}

.prescription-section {
    margin-bottom: 30px;
}

.prescription-section .section-header h3 {
    font-size: 16px;
    color: var(--gh-text-color-secondary);
}

.prescripteur-info {
    font-size: 14px;
    color: var(--gh-primary-blue);
    font-weight: 500;
    margin-left: 10px;
}

.prescription-tabs {
    display: flex;
    border-bottom: 1px solid var(--gh-border-color);
    margin-bottom: 15px;
    overflow-x: auto;
}

.tab-button {
    background-color: transparent;
    border: none;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gh-text-color);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex: 1;
    text-align: center;
}

.tab-button.active {
    color: var(--gh-primary-blue);
    border-color: var(--gh-primary-blue);
    font-weight: 600;
}

.tab-button:hover {
    color: var(--gh-primary-blue);
    border-color: var(--gh-primary-blue-hover);
    opacity: 1.8;
}

.search-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.search-select {
    padding: 8px 12px;
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    background-color: var(--gh-card-bg);
    color: var(--gh-text-color);
    font-size: 14px;
    min-width: 140px;
}

.search-select:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
}
</style>
