const express = require('express');
const router = express.Router();
const controller = require('../controllers/examensMedicaux.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/patient/:id_patient', protect, controller.getByPatientId);
router.get('/consultation/:id_consultation', protect, controller.getByConsultationId);
router.get('/prescription/:id_prescription_examen', protect, controller.getExamenDetailsByPrescriptionId);

// Nouvelle route pour compter les examens d'aujourd'hui pour le professionnel connecté
router.get('/count/aujourdhui', protect, controller.getCountExamensAujourdhui);

// Nouvelle route pour récupérer les examens avec infos patient pour le professionnel connecté
router.get('/professionnel', protect, controller.getExamensByProfessionnel);

router.post('/', protect, upload.single('fichier_resultat'), controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;
