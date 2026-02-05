const express = require('express');
const router = express.Router();
const controller = require('../controllers/prelevementsExamens.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/prescription-examen/:id_prescription_examen', protect, controller.getByPrescriptionExamenId);
router.get('/patient/:id_patient', protect, controller.getByPatientId);
router.get('/technicien/:id_technicien', protect, controller.getByTechnicienId);
router.get('/centre/:id_centre', protect, controller.getByCentreId);

router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);



module.exports = router;
