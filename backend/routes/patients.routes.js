const express = require('express');
const router = express.Router();
const controller = require('../controllers/patients.controller');
const { protect } = require('../middlewares/auth.middleware'); // Auth JWT déjà créé

// Nouvelle route
router.get('/full/:id', protect, controller.getFull);
router.get('/getLikebyname/:name', protect, controller.searchPatientsByName);
router.get('/getLikebyid/:id', protect, controller.searchPatientsByIdLike);
router.get('/today', protect, controller.getPatientsToday);
router.get('/countToday', protect, controller.countPatientsToday);
router.get('/countAll', protect, controller.countAllPatients);


// Routes protégées par JWT
router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;
