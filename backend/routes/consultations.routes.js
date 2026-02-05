/**
 * code backend/routes/consultations.routes.js
 * Routes pour la gestion des consultations médicales
 * Auteur: @lorddavid alias @ôkami
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/consultations.controller');
const { protect } = require('../middlewares/auth.middleware');

// Routes protégées JWT dans ce fichier
// Routes d'initialisation et de comptage spécifiques
router.post('/init', protect, controller.initConsultation); // Nouvelle route pour initialiser une consultation
router.post('/init-rdv', protect, controller.initConsultationRdv); // Nouvelle route pour initialiser une consultation avec type Rendez-vous
router.get('/count-today', protect, controller.countConsultationsToday); // Nouvelle route pour compter les consultations aujourd'hui
router.get('/count-en-attente-constantes', protect, controller.countConsultationsEnAttentePriseConstantes); // Nouvelle route pour compter les consultations en attente de prise des constantes
router.get('/count-en-attente-consultation', protect, controller.countConsultationsEnAttenteConsultation); // Nouvelle route pour compter les consultations en attente de consultation
router.get('/count-en-attente-consultation/today', protect, controller.countConsultationsEnAttenteConsultationToday); // Nouvelle route pour compter les consultations en attente de consultation aujourd'hui
router.get('/professionnel/:idProfessionnel/count-en-cours', protect, controller.countConsultationsEnCours); // Nouvelle route pour compter les consultations en cours par professionnel

// Routes spécifiques aux statuts
router.get('/en-attente-constantes/today', protect, controller.getConsultationsEnAttentePriseConstantesToday);
router.get('/en-attente-constantes', protect, controller.getConsultationsEnAttentePriseConstantes); // Nouvelle route pour les consultations en attente de prise des constantes
router.get('/en-attente-consultation', protect, controller.getConsultationsEnAttenteConsultation); // Nouvelle route pour les consultations en attente de consultation

// Routes spécifiques aux patients
router.get('/patient/:idPatient/today', protect, controller.getConsultationsForPatientToday); // Nouvelle route pour les consultations d'un patient pour aujourd'hui
router.get('/patient/:idPatient/last', protect, controller.getLastConsultationByPatientId); // Nouvelle route pour la dernière consultation d'un patient
router.get('/patient/:idPatient/terminees', protect, controller.getConsultationsTermineesByPatientId); // Nouvelle route pour les consultations terminées d'un patient
router.get('/patient/:idPatient', protect, controller.getConsultationsByPatientId);

// Routes spécifiques aux professionnels (les plus spécifiques en premier)
router.get('/professionnel/:idProfessionnel/en-attente-consultation/today', protect, controller.getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday); // Nouvelle route pour les consultations en attente de consultation par professionnel pour aujourd'hui
router.get('/professionnel/:idProfessionnel/en-attente-consultation', protect, controller.getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation); // Nouvelle route pour les consultations en attente de consultation par professionnel
router.get('/professionnel/:idProfessionnel/count-en-attente-consultation', protect, controller.countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation); // Nouvelle route pour compter les consultations en attente de consultation par professionnel
router.get('/professionnel/:idProfessionnel/en-cours', protect, controller.getConsultationsEnCours);
router.get('/professionnel/:idProfessionnel/terminees', protect, controller.getConsultationsTerminees);
router.get('/professionnel/:idProfessionnel/stats', protect, controller.getStatsConsultations);
router.get('/professionnel/:idProfessionnel/weekly-completed-stats', protect, controller.getWeeklyCompletedConsultationsStats); // Nouvelle route pour les statistiques hebdomadaires des consultations terminées par professionnel
router.get('/professionnel/:idProfessionnel/patients/today/count', protect, controller.countDistinctPatientsTodayByProfessionnelId); // Nouvelle route pour compter les patients distincts reçus aujourd'hui par professionnel
router.get('/professionnel/:idProfessionnel', protect, controller.getConsultationsByProfessionnelId); // Route générique pour les consultations par professionnel

// Nouvelle route pour les consultations récentes
router.get('/recent', protect, controller.getRecentConsultations);
router.get('/today', protect, controller.getTodayConsultations);
router.get('/all-with-details', protect, controller.getAllWithDetails);

// Routes de consultation complète et de mise à jour de statut/triage
router.get('/full/:id', protect, controller.getFull); // Nouvelle route pour consultation complète
router.put('/:id/triage', protect, controller.updateTriageConsultation); // Nouvelle route pour la mise à jour du triage
router.put('/:id/status', protect, controller.updateConsultationStatus); // Nouvelle route pour mettre à jour le statut d'une consultation
router.put('/:id/previous-consultation', protect, controller.updatePreviousConsultation); // Nouvelle route pour mettre à jour la consultation précédente
router.put('/:id/type-consultation', protect, controller.updateTypeConsultation); // Nouvelle route pour mettre à jour le type de consultation

// Routes CRUD génériques (sauf getById)
router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

// Route générique pour récupérer une consultation par ID (DOIT ÊTRE LA DERNIÈRE)
router.get('/:id', protect, controller.getById);

module.exports = router;
