const express = require('express');
const router = express.Router();
const controller = require('../controllers/prescriptions.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/consultation/:id_consultation', protect, controller.getByConsultationId);// ya un truc a modif ici  les prescriptions/consultations id 
router.get('/professionnel/:id_professionnel', protect, controller.getByProfessionnelId);
router.post('/with-lines', protect, controller.createWithLines);
router.post('/with-exams', protect, controller.createWithExams); // Nouvelle route pour les prescriptions avec examens
router.get('/with-exams/:id_consultation', protect, controller.getPrescriptionsWithExamsByConsultationId); // Nouvelle route pour récupérer les prescriptions avec examens par ID de consultation
router.get('/with-all/:id_consultation', protect, controller.getPrescriptionsWithAllDetailsByConsultationId); // Nouvelle route pour récupérer les prescriptions avec tous les détails (examens et médicaments) par ID de consultation
router.get('/count-active-lines', protect, controller.countWithActiveLines); // Route pour compter les prescriptions avec lignes actives

router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;
