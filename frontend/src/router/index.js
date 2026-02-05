import { createRouter, createWebHistory } from 'vue-router'

import loginForm from '@/components/loginForm.vue'
import logout from '@/components/logout.vue'




/**
 * secretaire routes
 */
import secDashoard from '@/components/secretaire/sec.dashoard.vue'
import secPatients from '@/components/secretaire/sec.patients.vue'
import secFactures from '@/components/secretaire/sec.factures.vue'
import secIdentification from '@/components/secretaire/sec.identification.vue'
import secRendezvous from '@/components/secretaire/sec.rendezvous.vue' // Importation du nouveau composant
const secretaireRoutes = [
  { path: 'tableau-de-bord', component: secDashoard },
  { path: 'patients', component: secPatients },
  { path: 'factures', component: secFactures },
  { path: 'rendezvous', component: secRendezvous }, // Ajout de la route pour les rendez-vous
  { path: '', redirect: 'tableau-de-bord' }, // Redirection par défaut vers le tableau de bord
  { path: 'identification-create', component: secIdentification }
]

/**
 * infirmier routes
 */
import infDashboard from '@/components/infirmier/inf.dashboard.vue'
import infConstante from '@/components/infirmier/inf.constante.vue'
import infPatient from '@/components/infirmier/inf.patient.vue'
const infirmierRoutes = [
  { path: 'tableau-de-bord', component: infDashboard },
  { path: 'constentes', component: infConstante },
  { path: 'patients', component: infPatient }, // À adapter si une page patients spécifique est nécessaire
]

/**
 * medecin routes
 */
import medDashboard from '@/components/medecin/med.dashboard.vue'
import medConsultation from '@/components/medecin/med.consultation.vue'
import medPatient from '@/components/medecin/med.patient.vue'
import medRendezvous from '@/components/medecin/med.rendezvous.vue'
const medRoutes = [
  { path: 'tableau-de-bord', component: medDashboard },
  { path: 'consultation', component: medConsultation },
  { path: 'patients', component: medPatient },
  { path: 'rendezvous', component: medRendezvous },
]

/**
 * laborantin routes
 */
import labDashboard from '@/components/laborantin/lab.dashboard.vue'
import labExamination from '@/components/laborantin/lab.examination.vue'
import PatientCreationForm from '@/components/secretaire/sec.identification.vue'
import ProfileSettings from '@/components/ui-components/ProfileSettings.vue' // Importation du nouveau composant
const laborantinRoutes = [
  { path: 'tableau-de-bord', component: labDashboard },
  { path: 'examens', component: labExamination },
]

/**
 * pharmacie routes
 */
import phaDashboard from '@/components/pharmacie/pha.dashboard.vue'
import phaMedicament from '@/components/pharmacie/pha.medicament.vue'
import phaStock from '@/components/pharmacie/pha.stock.vue'
import phaDispensation from '@/components/pharmacie/pha.dispensations.vue'
import phaMouvement from '@/components/pharmacie/pha.mouvements.vue'
import phaInventaire from '@/components/pharmacie/pha.inventaire.vue'
const pharmacieRoutes = [
  { path: 'tableau-de-bord', component: phaDashboard },
  { path: 'medicaments', component: phaMedicament },
  { path: 'stocks', component: phaStock },
  { path: 'dispensations', component: phaDispensation },
  { path: 'mouvements', component: phaMouvement },
  { path: 'inventaire', component: phaInventaire },
  // {path:'', redirect:'tableau-de-bord'},
]

/**
 * admin routes
 */
import adminLogin from '@/components/admin/admin.login.vue'
import adminDashboard from '@/components/admin/admin.dashboard.vue'
const adminRoutes = [
  { path: 'tableau-de-bord', component: adminDashboard },
  { path: '', component: adminLogin }, // La racine /admin mène au login
]

const routes = [
  {
    path: '/',
    component: loginForm
  },
  {
    path: '/profile-settings', // Nouvelle route pour les paramètres du profil
    component: ProfileSettings
  },
  {
    path: '/logout',
    component: logout
  },
  {
    path: '/secretaire',
    children: secretaireRoutes
  },
  {
    path: '/infirmier',
    children: infirmierRoutes
  },
  {
    path: '/medecin',
    children: medRoutes
  },
  {
    path: '/laborantin',
    children: laborantinRoutes
  },
  {
    path: '/pharmacie',
    children: pharmacieRoutes
  },
  {
    path: '/admin',
    children: adminRoutes
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
