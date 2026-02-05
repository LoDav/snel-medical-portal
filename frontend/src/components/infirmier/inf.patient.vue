<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from '../ui-components_02/sidebar.vue';
import Navbar from '../ui-components_02/navbar.vue';
import PatientTable from '../ui-components_02/PatientTable.vue';
import PatientDossier from '../ui-components_02/PatientDossier.vue';
import { getPatients } from '@/utils/patient';
import { useToast } from 'vue-toastification';
import { getUserInfo } from '@/utils/auth';
import { initConsultation } from '@/utils/consultation';

const toast = useToast();
const userInfo = getUserInfo();

const sidebarData = ref([
    { id: 1, name: 'Tableau de bord', path: '/infirmier/tableau-de-bord', icon: 'fa fa-tachometer-alt', active: false },
    { id: 2, name: 'Constantes', path: '/infirmier/constentes', icon: 'fa fa-thermometer-half', active: false },
    { id: 3, name: 'Patients', path: '/infirmier/patients', icon: 'fa fa-users', active: true },
]);

const patients = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);
const isDossierOpen = ref(false);
const selectedPatientId = ref(null);

const fetchPatients = async () => {
    isLoading.value = true;
    try {
        const response = await getPatients();
        patients.value = response;
    } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
    } finally {
        isLoading.value = false;
    }
};

const filteredPatients = computed(() => {
    if (!searchQuery.value) return patients.value;
    const q = searchQuery.value.toLowerCase();
    return patients.value.filter(p => {
        const fullName = `${p.nom} ${p.prenoms} ${p.post_nom || ''}`.toLowerCase();
        return fullName.includes(q) ||
            p.id_patient.toString().includes(q) ||
            (p.matricule_snel && p.matricule_snel.toLowerCase().includes(q));
    });
});

const handleViewPatient = (patient) => {
    selectedPatientId.value = patient.id_patient;
    isDossierOpen.value = true;
};

const handleTriagePatient = async (patient) => {
    if (!patient || !patient.id_patient) return;

    try {
        const consultationData = {
            id_patient: patient.id_patient,
            id_centre: userInfo?.id_centre || 1
        };
        await initConsultation(consultationData);
        toast.success(`Patient ${patient.nom} envoyé au triage !`);
        patient.is_in_triage = 1;
    } catch (error) {
        console.error("Erreur envoi triage:", error);
        toast.error("Erreur lors de l'envoi au triage.");
    }
};

onMounted(() => {
    fetchPatients();
});
</script>

<template>
    <div class="app-layout">
        <Sidebar :sidebarData="sidebarData" />

        <div class="main-content">
            <Navbar />

            <div class="page-container animate-in">
                <header class="page-header">
                    <div class="header-left">
                        <h1>Gestion des Patients</h1>
                        <p class="subtitle">Consultez et gérez les dossiers médicaux des patients</p>
                    </div>
                    <div class="header-right">
                        <div class="search-wrapper">
                            <i class="fa fa-search search-icon"></i>
                            <input v-model="searchQuery" type="text" class="search-input"
                                placeholder="Rechercher par nom, ID...">
                        </div>
                    </div>
                </header>

                <div class="table-section">
                    <PatientTable :patients="filteredPatients" :isLoading="isLoading" @view="handleViewPatient"
                        @triage="handleTriagePatient" />
                </div>
            </div>
        </div>

        <PatientDossier v-if="isDossierOpen" :isOpen="isDossierOpen" :patientId="selectedPatientId"
            @close="isDossierOpen = false" />
    </div>
</template>

<style scoped>
.app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: var(--gh-bg-color);
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.page-container {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.page-header {
    margin-bottom: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-header h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
}

.subtitle {
    color: var(--gh-text-color-secondary);
    margin: 5px 0 0;
    font-size: 14px;
}

.table-section {
    margin-top: 20px;
}

/* Search Input Styles */
.search-wrapper {
    position: relative;
    width: 100%;
    max-width: 700px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gh-text-color-secondary);
    font-size: 14px;
}

.search-input {
    /* width: 100%; */
    padding: 10px 15px 10px 35px;
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    color: var(--gh-text-color);
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.15);
}

/* Transitions pour le modal if needed or handle it inside the component */

/* Animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeIn 0.4s ease forwards;
}
</style>
