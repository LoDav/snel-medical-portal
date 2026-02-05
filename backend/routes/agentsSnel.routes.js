const express = require('express');
const router = express.Router();
const controller = require('../controllers/agentsSnel.controller');
const { protect } = require('../middlewares/auth.middleware');

// Routes protégées JWT
router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);
router.get('/matricule/:matricule', protect, controller.getAgentAndAyantsByMatricule);
router.get('/nom/:nom', protect, controller.getAgentAndAyantsByName);

module.exports = router;
