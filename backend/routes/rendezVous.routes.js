const express = require('express');
const router = express.Router();
const controller = require('../controllers/rendezVous.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/patient/:id_patient', protect, controller.getByPatientId);
router.get('/professionnel/:id_professionnel', protect, controller.getByProfessionnelId);
router.get('/centre/:id_centre', protect, controller.getByCentreId);
router.get('/recent', protect, controller.getRecent);
router.get('/professionnel/:id_professionnel/count', protect, controller.countByProfessionnelId);
router.get('/professionnel/:id_professionnel/today/count', protect, controller.countTodayByProfessionnelId);
router.get('/today/count', protect, controller.countTodayRendezVous);
router.get('/arrived-today', protect, controller.getArrivedToday);
router.get('/status/:status', protect, controller.getByStatus);
router.get('/professionnel/:id_professionnel/status/:status/today', protect, controller.getByStatusToday);
router.get('/professionnel/:id_professionnel/today-with-patient', protect, controller.getTodayWithPatientByProfessionnelId);
router.get('/today-with-details', protect, controller.getTodayWithDetails);
router.get('/period-with-details', protect, controller.getByPeriodWithDetails);

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.put('/:id/statut', protect, controller.updateStatut);
router.delete('/:id', protect, controller.delete);
router.post('/', protect, controller.create);

module.exports = router;
