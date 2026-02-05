const express = require('express');
const router = express.Router();
const prescriptionsExamensController = require('../controllers/prescriptionsExamens.controller');



// Nouvelle route pour compter les demandes d'aujourd'hui
router.get('/count/demandes-aujourdhui', prescriptionsExamensController.getCountDemandesAujourdhui);

// Nouvelle route pour compter les examens réalisés d'aujourd'hui
router.get('/count/realises-aujourdhui', prescriptionsExamensController.getCountRealisesAujourdhui);

// Nouvelle route pour récupérer les prescriptions d'examens récentes (8 derniers jours)
router.get('/recent', prescriptionsExamensController.getRecentPrescriptionsExamens);

// Nouvelle route pour récupérer les prescriptions d'examens détaillées
router.get('/detailed', prescriptionsExamensController.getDetailedPrescriptionsExamens);

// Nouvelle route pour récupérer les prescriptions d'examens par ID de consultation
router.get('/by-consultation/:id_consultation', prescriptionsExamensController.getPrescriptionsWithExamsByConsultationId);

// Route pour changer le statut d'un examen prescrit
router.put('/:id/statut', prescriptionsExamensController.changeStatutExamen);

// Route pour créer une nouvelle prescription d'examen
router.post('/', prescriptionsExamensController.createPrescriptionExamen);

// Route pour récupérer toutes les prescriptions d'examens
router.get('/', prescriptionsExamensController.getAllPrescriptionsExamens);

// Route pour récupérer une prescription d'examen par son ID
router.get('/:id', prescriptionsExamensController.getPrescriptionExamenById);

// Route pour mettre à jour une prescription d'examen par son ID
router.put('/:id', prescriptionsExamensController.updatePrescriptionExamen);

// Route pour supprimer une prescription d'examen par son ID
router.delete('/:id', prescriptionsExamensController.deletePrescriptionExamen);





module.exports = router;
