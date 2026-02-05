<script setup>
/**
 * Page d'Identification et Création Patient
 * Permet de scanner/rechercher un agent SNEL et d'initier une consultation.
 * Basé sur le design de Indeification.html
 */

import { onMounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { getUserInfo } from '@/utils/auth';

// API Utils
import { getAgentAndAyantsByMatricule, getAgentAndAyantsByName } from '@/utils/agent_snel';
import { initConsultation } from '@/utils/consultation';
import { getPatientsToday, getPatients, createPatient, searchPatientsByName, searchPatientsByIdLike } from '@/utils/patient';

// Components
import sidebar from '../ui-components_02/sidebar.vue';
import navbar from '../ui-components_02/navbar.vue';
import PatientTable from '../ui-components_02/PatientTable.vue';
import PatientDossier from '../ui-components_02/PatientDossier.vue';
import CreateExternalPatient from '../ui-components_02/CreateExternalPatient.vue';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const userInfo = getUserInfo();

// State
const currentTab = ref(route.query.tab === 'list' ? 'list' : 'scan');
const searchQuery = ref('');
const searchResult = ref(null); // { agent: {}, ayantsDroits: [] }
const recentPatients = ref([]);
const allPatients = ref([]);
const patientSearchQuery = ref('');
const isLoading = ref(false);
const isSearching = ref(false);
const previewPhotoUrl = ref(null);

//show
const toggleComponent = ref('patientTable');


// Dossier Patient
const selectedPatientId = ref(null);
const isDossierOpen = ref(false);

const openPatientDossier = (patient) => {
    selectedPatientId.value = patient.id_patient;
    isDossierOpen.value = true;
};

const closePatientDossier = () => {
    isDossierOpen.value = false;
    selectedPatientId.value = null;
};

const openPreview = (url) => {
    if (url) previewPhotoUrl.value = url;
};

const closePreview = () => {
    previewPhotoUrl.value = null;
};

const sidebarData = [
    {
        id: 1,
        name: 'Tableau de bord',
        icon: 'fa fa-home',
        path: '/secretaire/tableau-de-bord',
        active: false
    },
    {
        id: 2,
        name: 'Rendez-vous',
        icon: 'fa fa-calendar-plus-o',
        path: '/secretaire/rendezvous',
        active: false
    },
    {
        id: 3,
        name: 'Identification et creation',
        icon: 'fa fa-id-card',
        path: '/secretaire/identification-create',
        active: true
    }
];

// Methods
const fetchRecentPatients = async () => {
    try {
        recentPatients.value = await getPatientsToday();
    } catch (error) {
        console.error("Erreur chargement patients récents:", error);
    }
};

const fetchAllPatients = async () => {
    isLoading.value = true;
    try {
        const data = await getPatients();
        allPatients.value = data || [];
    } catch (error) {
        console.error("Erreur chargement patients:", error);
        toast.error("Erreur lors du chargement de la liste des patients.");
    } finally {
        isLoading.value = false;
    }
};

const filteredPatients = computed(() => {
    if (!patientSearchQuery.value) return allPatients.value;
    const q = patientSearchQuery.value.toLowerCase();
    return allPatients.value.filter(p =>
        (p.nom && p.nom.toLowerCase().includes(q)) ||
        (p.prenoms && p.prenoms.toLowerCase().includes(q)) ||
        (p.id_patient && p.id_patient.toString().includes(q))
    );
});



watch(() => currentTab.value, (newTab) => {
    if (newTab === 'list') {
        fetchAllPatients();
    }
    // Update URL without reloading
    router.replace({ query: { ...route.query, tab: newTab } });
});

const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        toast.warning("Veuillez saisir un matricule ou un nom.");
        return;
    }

    isSearching.value = true;
    searchResult.value = null;

    try {
        let result = null;

        // Try matricule first
        try {
            result = await getAgentAndAyantsByMatricule(searchQuery.value);
        } catch (e) {
            // Ignore error, try name next
        }

        // If not found by matricule, try by name
        if (!result) {
            try {
                result = await getAgentAndAyantsByName(searchQuery.value);
            } catch (e) {
                // Ignore error
            }
        }

        if (result && result.matricule_snel) {
            // Map the flat backend response to the nested structure used by the template
            searchResult.value = {
                agent: {
                    id_agent_snel: result.id_agent_snel,
                    id_patient: result.id_patient,
                    matricule_snel: result.matricule_snel,
                    nom: result.agent_nom, // Mapped from backend alias
                    prenoms: result.agent_prenoms, // Mapped from backend alias
                    post_nom: result.agent_post_nom,
                    date_naissance: result.agent_date_naissance,
                    sexe: result.agent_sexe,
                    adresse: result.agent_adresse,
                    service: result.service_snel,
                    departement: result.departement_snel,
                    statut: result.statut_agent,
                    telephone: result.agent_telephone,
                    email: result.agent_email,
                    photo: result.photo_identification,
                    is_patient: result.is_agent_patient_exist, // Mapped from backend
                    is_in_triage: result.is_in_triage // Might be added in future, for now it allows reactivity
                },
                ayantsDroits: result.ayants_droit ? result.ayants_droit.map(ad => ({
                    ...ad,
                    photo: ad.photo_identification,
                    is_patient: ad.is_ayant_droit_patient_exist,
                    id_patient: ad.id_patient
                })) : []
            };
            toast.success("Agent trouvé !");
        } else {
            toast.error("Aucun agent trouvé avec ce critère.");
        }

    } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la recherche.");
    } finally {
        isSearching.value = false;
    }
};

const resetScan = () => {
    searchResult.value = null;
    searchQuery.value = '';
    // Optional: focus input
};

const handleCreatePatient = async (person, type) => {
    if (!person) return;

    // Map Person (Agent/AyantDroit) to Patient Model
    // We don't generate ID here, backend handles it (or we let backend generate uuid)
    // Actually controller uses ShortUniqueId if id_patient not provided.

    const patientData = {
        nom: person.nom,
        prenoms: person.prenoms,
        post_nom: person.post_nom || '',
        date_naissance: person.date_naissance ? new Date(person.date_naissance).toISOString().split('T')[0] : null,
        sexe: person.sexe,
        telephone: person.telephone,
        email: person.email,
        adresse: person.adresse,
        type_patient: type === 'Agent' ? 'Agent' : 'AyantDroit',
        id_agent_snel: type === 'Agent' ? person.id_agent_snel : null,
        // If AyantDroit, we might need to pass id_ayant_droit.
        // Controller expects 'id_ayant_droit'.
        id_ayant_droit: type === 'AyantDroit' ? person.id_ayant_droit : null
    };

    try {
        const response = await createPatient(patientData);
        toast.success(`Patient ${person.nom} créé avec succès !`);

        // Refresh Current Search Result to update "is_patient" status
        // We can either reload the search or manually update local state
        if (type === 'Agent' && searchResult.value.agent) {
            searchResult.value.agent.is_patient = true;
            searchResult.value.agent.id_patient = response.id_patient;
        } else if (type === 'AyantDroit') {
            const ad = searchResult.value.ayantsDroits.find(a => a.id_ayant_droit === person.id_ayant_droit);
            if (ad) {
                ad.is_patient = true;
                ad.id_patient = response.id_patient;
            }
        }

        await fetchRecentPatients(); // Refresh list on right
    } catch (error) {
        console.error("Erreur création patient:", error);
        toast.error("Erreur lors de la création du patient.");
    }
};

const sendToTriage = async (patient) => {
    if (!patient || !patient.id_patient) return;

    try {
        const consultationData = {
            id_patient: patient.id_patient,
            id_centre: userInfo.id_centre || 1
        };
        await initConsultation(consultationData);
        toast.success(`Patient ${patient.nom} envoyé au triage !`);

        // Mise à jour immédiate pour l'UI dans TOUTES les listes (side et main table)
        patient.is_in_triage = 1;

        // Synchroniser dans l'autre liste si présent
        const updateInList = (list) => {
            const index = list.value.findIndex(p => String(p.id_patient) === String(patient.id_patient));
            if (index !== -1) list.value[index].is_in_triage = 1;
        };
        updateInList(recentPatients);
        updateInList(allPatients);

        // Rafraichir la liste globale pour confirmer
        fetchRecentPatients();
    } catch (error) {
        console.error("Erreur envoi triage:", error);
        toast.error("Erreur lors de l'envoi au triage.");
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const calculateAge = (dateNaissance) => {
    if (!dateNaissance || dateNaissance === '0000-00-00') return 0;
    const birthDate = new Date(dateNaissance);
    if (isNaN(birthDate.getTime())) return 0;
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const checkEligibility = (ad) => {
    if (!ad.date_naissance) return { eligible: true, message: 'Éligible' };
    const age = calculateAge(ad.date_naissance);
    // Règle SNEL: Enfant de plus de 18 ans n'est plus éligible (sauf cas particuliers non gérés ici?)
    if (ad.lien_parente === 'Enfant' && age > 18) {
        return { eligible: false, message: 'Non éligible au soin' };
    }
    return { eligible: true, message: 'Éligible' };
};

const currentDate = computed(() => {
    // Return formatted date like "02 Février 2026"
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
});

const currentTime = ref('');
setInterval(() => {
    const now = new Date();
    currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}, 1000);

onMounted(() => {
    fetchRecentPatients();
    if (currentTab.value === 'list') fetchAllPatients();
    const now = new Date();
    currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
});

</script>

<template>
    <div class="body">
        <sidebar :sidebarData="sidebarData" />

        <div class="main">
            <navbar />

            <div class="main-content">
                <header class="topbar-context">
                    <h2 style="font-size: 16px; margin: 0;">Identification & Gestion Patient</h2>
                    <div style="font-size: 13px; color: var(--gh-text-color-secondary);">
                        <i class="fa fa-clock-o"></i> {{ currentDate }} | {{ currentTime }}
                    </div>
                </header>

                <!-- SYSTÈME D'ONGLETS -->
                <div class="tabs-header">
                    <button class="tab-btn" :class="{ active: currentTab === 'scan' }" @click="currentTab = 'scan'">
                        <i class="fa fa-qrcode"></i> Scan de Carte
                    </button>
                    <button class="tab-btn" :class="{ active: currentTab === 'list' }" @click="currentTab = 'list'">
                        <i class="fa fa-users"></i> Gestion des Patients
                    </button>
                </div>

                <div class="workspace">

                    <!-- ZONE D'IDENTIFICATION -->
                    <section v-if="currentTab === 'scan'" class="identification-zone">

                        <!-- SCAN QR CODE / SEARCH -->
                        <div v-if="!searchResult" class="scan-card animate-in">
                            <i class="fa fa-qrcode"></i>
                            <h3>Scanner la carte Ayant-droit / Agent</h3>
                            <p style="color: var(--gh-text-color-secondary);">Placez le code QR devant le lecteur ou
                                saisissez le matricule manuellement</p>

                            <div class="manual-input">
                                <input type="text" v-model="searchQuery" @keyup.enter="handleSearch"
                                    placeholder="Ex: AG-2024-008" autofocus>
                                <button class="btn btn-primary" @click="handleSearch" :disabled="isSearching">
                                    {{ isSearching ? 'Recherche...' : 'Identifier' }}
                                </button>
                            </div>
                        </div>

                        <!-- AFFICHAGE DES RÉSULTATS (Après Scan) -->
                        <div v-else class="results-container animate-in">
                            <div class="results-header">
                                <h3 style="margin:0;">Informations de l'Unité Familiale</h3>
                                <button class="btn btn-outline" @click="resetScan"><i class="fa fa-undo"></i> Nouveau
                                    Scan</button>
                            </div>

                            <!-- L'AGENT -->
                            <div v-if="searchResult.agent" class="agent-card">
                                <div class="agent-info-group">
                                    <div class="agent-avatar">
                                        <img v-if="searchResult.agent.photo" :src="searchResult.agent.photo" alt="Photo"
                                            style="width:100%; height:100%; border-radius:50%; object-fit:cover; cursor:pointer;"
                                            @click="openPreview(searchResult.agent.photo)">
                                        <i v-else class="fa fa-user"></i>
                                    </div>
                                    <div>
                                        <div class="badge-rel bg-primary-blue">Agent Titulaire</div>
                                        <div class="agent-name">{{ searchResult.agent.nom }} {{
                                            searchResult.agent.prenoms }}</div>
                                        <div class="agent-meta">Matricule: {{ searchResult.agent.matricule_snel }} •
                                            Service: {{ searchResult.agent.service || 'N/A' }}</div>

                                        <!-- Badge Déjà Patient -->
                                        <div v-if="searchResult.agent.is_patient" style="margin-top: 5px;">
                                            <span class="status completed">
                                                <i class="fa fa-check-circle"></i> Déjà Patient
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="card-actions" style="display: flex; gap: 10px;">
                                    <button v-if="!searchResult.agent.is_patient" class="btn btn-success"
                                        @click="handleCreatePatient(searchResult.agent, 'Agent')">
                                        <i class="fa fa-plus"></i> Créer Patient
                                    </button>
                                    <template v-else>
                                        <button class="btn btn-outline" disabled
                                            style="opacity: 0.7; cursor: not-allowed; flex: 1;">
                                            <i class="fa fa-check"></i> Enregistré
                                        </button>
                                        <button v-if="!searchResult.agent.is_in_triage" class="btn btn-primary"
                                            @click="sendToTriage(searchResult.agent)" style="flex: 1.5;">
                                            <i class="fa fa-share"></i> Envoyer au Triage
                                        </button>
                                        <button v-else class="btn btn-success" disabled
                                            style="opacity: 0.8; flex: 1.5;">
                                            <i class="fa fa-check-circle"></i> Déjà au Triage
                                        </button>
                                    </template>
                                </div>
                            </div>

                            <h4 v-if="searchResult.ayantsDroits && searchResult.ayantsDroits.length > 0"
                                style="margin-bottom: 15px; color: var(--gh-text-color-secondary);">Ayants-droits
                                rattachés</h4>

                            <!-- AYANTS DROITS -->
                            <div class="family-grid">
                                <div v-for="ad in searchResult.ayantsDroits" :key="ad.id_ayant_droit"
                                    class="member-card" :class="{ 'is-patient': ad.is_patient }">



                                    <div class="member-avatar-container"
                                        style="display:flex; justify-content:center; margin-bottom:10px;">
                                        <div class="member-avatar">
                                            <img v-if="ad.photo" :src="ad.photo" alt="Photo"
                                                style="width:100%; height:100%; object-fit:cover; cursor:pointer;"
                                                @click="openPreview(ad.photo)">
                                            <i v-else class="fa fa-user"></i>
                                        </div>
                                    </div>

                                    <span class="badge-rel">{{ ad.lien_parente }}</span>
                                    <div style="font-weight: 600;">{{ ad.nom }} {{ ad.prenoms }}</div>
                                    <div style="font-size: 12px; color: var(--gh-text-color-secondary);">
                                        Né(e) le {{ formatDate(ad.date_naissance) }} ({{ calculateAge(ad.date_naissance)
                                        }} ans)
                                    </div>

                                    <!-- Éligibilité / Statut -->
                                    <div style="margin-top: 5px;">
                                        <template v-if="ad.is_patient">
                                            <span class="status completed">
                                                <i class="fa fa-check-circle"></i> Déjà Patient
                                            </span>
                                        </template>
                                        <template v-else>
                                            <span v-if="!checkEligibility(ad).eligible" class="status danger">
                                                {{ checkEligibility(ad).message }}
                                            </span>
                                            <span v-else class="status completed" style="font-size: 10px;">
                                                Éligible
                                            </span>
                                        </template>
                                    </div>

                                    <div class="card-actions-ad"
                                        style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; width: 100%;">
                                        <button v-if="!ad.is_patient" class="btn btn-outline btn-sm"
                                            :disabled="!checkEligibility(ad).eligible"
                                            @click="handleCreatePatient(ad, 'AyantDroit')" style="width: 100%;">
                                            <i class="fa fa-user-plus"></i> Créer Patient
                                        </button>
                                        <template v-else>
                                            <button v-if="!ad.is_in_triage" class="btn btn-primary btn-sm"
                                                @click="sendToTriage(ad)" style="width: 100%;">
                                                <i class="fa fa-share"></i> Envoyer au Triage
                                            </button>
                                            <button v-else class="btn btn-success btn-sm" disabled
                                                style="opacity: 0.8; width: 100%;">
                                                <i class="fa fa-check-circle"></i> Au Triage
                                            </button>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- ONGLET GESTION DES PATIENTS -->
                    <section v-if="currentTab === 'list'" class="identification-zone management-zone animate-in">
                        <div class="management-controls" v-if="toggleComponent === 'patientTable'">
                            <div class="search-bar-list">
                                <i class="fa fa-search"></i>
                                <input type="text" v-model="patientSearchQuery"
                                    placeholder="Rechercher par nom, prénom ou ID...">
                            </div>
                            <button class="btn btn-primary" @click="toggleComponent = 'createExternPatient'">
                                <i class="fa fa-plus"></i> Nouveau Patient Manuel
                            </button>
                        </div>
                        
                        <div v-if="toggleComponent == 'patientTable'">
                            <PatientTable :patients="filteredPatients" :isLoading="isLoading" @triage="sendToTriage"
                            @view="openPatientDossier" />
                        </div>
                        <div v-else-if="toggleComponent == 'createExternPatient'">
                            <CreateExternalPatient @close="toggleComponent = 'patientTable'" @triage="sendToTriage" />
                        </div>
                        
                        
                    </section>

                    <!-- LISTE DES PATIENTS (Droite) - Masquée dans l'onglet Gestion Patient -->
                    <aside v-if="currentTab !== 'list'" class="patient-list-sidebar">
                        <div class="list-header">
                            <span>Patients du jour</span>
                            <span class="count-badge">{{ recentPatients.length }}</span>
                        </div>
                        <div class="recent-patients">
                            <div v-for="patient in recentPatients" :key="patient.id_patient" class="patient-item">
                                <div class="patient-info" @click="openPatientDossier(patient)"
                                    style="cursor: pointer; flex: 1;">
                                    <span class="name">{{ patient.nom }} {{ patient.prenoms }}</span>
                                    <span class="meta">Né(e): {{ formatDate(patient.date_naissance) }}</span>
                                </div>
                                <button v-if="!patient.is_in_triage" class="btn btn-sm btn-outline-primary"
                                    @click="sendToTriage(patient)" title="Envoyer au triage">
                                    <i class="fa fa-share"></i>
                                </button>
                                <button v-else class="btn btn-sm btn-success" disabled title="Déjà au triage">
                                    <i class="fa fa-check"></i>
                                </button>
                            </div>

                            <div v-if="recentPatients.length === 0"
                                style="padding: 20px; text-align: center; color: #aaa;">
                                Pas encore de patients aujourd'hui.
                            </div>
                        </div>
                        <div class="info-box">
                            <div class="info-alert">
                                <i class="fa fa-info-circle"></i> Les patients créés apparaissent ici avant d'être
                                envoyés au triage.
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    </div>

    <!-- IMAGE PREVIEW MODAL -->
    <div v-if="previewPhotoUrl" class="photo-modal" @click="closePreview">
        <span class="close-btn">&times;</span>
        <img class="modal-content" :src="previewPhotoUrl">
    </div>

    <!-- DOSSIER PATIENT MODAL -->
    <PatientDossier v-if="isDossierOpen" :isOpen="isDossierOpen" :patientId="selectedPatientId"
        @close="closePatientDossier" />
</template>

<style scoped>
/* Layout Global */
.body {
    display: flex;
    height: 100vh;
    background-color: var(--gh-bg-color);
    color: var(--gh-text-color);
    overflow: hidden;
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.topbar-context {
    padding: 15px 30px;
    background: var(--gh-bg-color);
    border-bottom: 1px solid var(--gh-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    box-sizing: border-box;
}

.workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* --- TABS SYSTEM --- */
.tabs-header {
    background: var(--gh-bg-color);
    border-bottom: 1px solid var(--gh-border-color);
    padding: 0 30px;
    display: flex;
    gap: 25px;
}

.tab-btn {
    padding: 12px 5px;
    font-size: 14px;
    color: var(--gh-text-color-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: 0.2s;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-weight: 500;
}

.tab-btn i {
    margin-right: 6px;
    font-size: 12px;
}

.tab-btn:hover {
    color: var(--gh-text-color);
}

.tab-btn.active {
    color: var(--gh-primary-blue);
    border-bottom-color: var(--gh-tab-accent);
    /* GitHub Style Accent */
    font-weight: 600;
}

/* --- IDENTIFICATION ZONE --- */
.identification-zone {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    background: var(--gh-bg-color);
}

.management-zone {
    max-width: 1200px;
    margin: 0 auto;
}

.management-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    gap: 20px;
}

.search-bar-list {
    position: relative;
    flex: 1;
    max-width: 400px;
}

.search-bar-list i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #ccc;
}

.search-bar-list input {
    width: 100%;
    padding: 10px 10px 10px 35px;
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    outline: none;
    font-size: 14px;
    background: var(--gh-input-bg);
    color: var(--gh-text-color);
}

.search-bar-list input:focus {
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.scan-card {
    background: var(--gh-card-bg);
    border: 2px dashed var(--gh-primary-blue);
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    margin-bottom: 30px;
    transition: all 0.3s;
    max-width: 600px;
    margin: 40px auto;
}

.scan-card i.fa-qrcode {
    font-size: 48px;
    color: var(--gh-primary-blue);
    margin-bottom: 15px;
}

.manual-input {
    max-width: 400px;
    margin: 20px auto 0;
    display: flex;
    gap: 10px;
}

.manual-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--gh-border-color);
    border-radius: var(--border-radius);
    font-size: 16px;
    text-align: center;
    font-weight: 600;
    outline: none;
    background: var(--gh-input-bg);
    color: var(--gh-text-color);
}

.manual-input input:focus {
    border-color: var(--gh-primary-blue);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
}

/* --- RESULTS AREA --- */
.results-container {
    max-width: 900px;
    margin: 0 auto;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.agent-card {
    background: var(--gh-primary-blue-lighter-bg);
    border: 1px solid var(--gh-primary-blue-light-border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.agent-info-group {
    display: flex;
    align-items: center;
    gap: 20px;
}

.agent-avatar {
    width: 100px;
    height: 100px;
    background: var(--gh-card-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: var(--gh-primary-blue);
    border: 1px solid var(--gh-primary-blue-light-border);
}

.badge-rel {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 700;
    padding: 2px 6px;
    background: var(--gh-badge-ayant-droit-bg);
    color: var(--gh-badge-ayant-droit-text);
    border-radius: 4px;
    align-self: flex-start;
    display: inline-block;
    margin-bottom: 4px;
}

.badge-rel.bg-primary-blue {
    background: var(--gh-primary-blue);
    color: white;
}

.agent-name {
    font-size: 18px;
    font-weight: 700;
}

.agent-meta {
    font-size: 13px;
    color: var(--gh-text-color-secondary);
}

.family-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.member-card {
    background: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
}

.member-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.member-card.is-patient {
    border-color: var(--gh-success-green);
}

.member-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--gh-header-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--gh-border-color);
}

.member-avatar i {
    font-size: 30px;
    color: var(--gh-text-color-secondary);
}

/* --- RIGHT SIDEBAR --- */
.patient-list-sidebar {
    width: 300px;
    background: var(--gh-bg-color);
    border-left: 1px solid var(--gh-border-color);
    display: flex;
    flex-direction: column;
}

.list-header {
    padding: 20px;
    border-bottom: 1px solid var(--gh-border-color);
    font-weight: 600;
    display: flex;
    justify-content: space-between;
}

.count-badge {
    background: var(--gh-sidebar-active-bg);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}

.recent-patients {
    flex: 1;
    overflow-y: auto;
}

.patient-item {
    padding: 15px 20px;
    border-bottom: 1px solid var(--gh-border-color);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.patient-info {
    display: flex;
    flex-direction: column;
}

.patient-item:hover {
    background: var(--gh-navbar-link-hover);
}

.patient-item .name {
    font-weight: 600;
    font-size: 14px;
    display: block;
    color: var(--gh-text-color);
}

.patient-item .meta {
    font-size: 12px;
    color: var(--gh-text-color-secondary);
}

.info-box {
    padding: 15px;
    border-top: 1px solid var(--gh-border-color);
}

.info-alert {
    background: var(--gh-sidebar-active-bg);
    padding: 10px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--gh-warning-orange);
    border: 1px solid var(--gh-warning-orange);
}

/* --- BUTTONS --- */
.btn {
    padding: 8px 16px;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--gh-border-color);
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--gh-primary-blue);
    color: white;
    border: none;
}

.btn-primary:hover {
    background: var(--gh-primary-blue-hover);
}

.btn-success {
    background: var(--gh-success-green);
    color: white;
    border: none;
}

.btn-success:hover {
    filter: brightness(1.1);
}

.btn-outline {
    background: var(--gh-bg-color);
    color: var(--gh-text-color);
}

.btn-outline:hover {
    background: var(--gh-navbar-link-hover);
}

.btn-sm {
    padding: 4px 10px;
    font-size: 12px;
}

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

/* Modal Styles */
.photo-modal {
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    margin: auto;
    display: block;
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 5px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    animation: zoom 0.3s;
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 35px;
    color: #f1f1f1;
    font-size: 40px;
    font-weight: bold;
    transition: 0.3s;
    cursor: pointer;
}

.close-btn:hover,
.close-btn:focus {
    color: #bbb;
    text-decoration: none;
    cursor: pointer;
}

@keyframes zoom {
    from {
        transform: scale(0)
    }

    to {
        transform: scale(1)
    }
}
</style>
