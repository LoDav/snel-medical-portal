const express = require('express');
const router = express.Router();
const controller = require('../controllers/constantesVitales.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/patient/:id_patient', protect, controller.getByPatientId);
router.get('/consultation/:id_consultation', protect, controller.getByConsultationId);
router.get('/professionnel/:id_professionnel', protect, controller.getByProfessionnelId);

router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;
