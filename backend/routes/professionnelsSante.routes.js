const express = require('express');
const router = express.Router();
const controller = require('../controllers/professionnelsSante.controller');
const { protect } = require('../middlewares/auth.middleware');

// Auth
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/professionnels/:id_professional', protect, controller.getProfessionalById); // Nouvelle route pour récupérer un professionnel par son ID

// Protégées
router.get('/users', protect, controller.getAll);
router.get('/medecins', protect, controller.getAllMedecins); // Nouvelle route pour récupérer uniquement les médecins
router.get('/online/count', protect, controller.countOnlineProfessionals); // Nouvelle route pour compter les professionnels en ligne
router.get('/online/infirmier/count', protect, controller.countOnlineInfirmiers); // Nouvelle route pour compter les infirmiers en ligne
router.get('/online/medecins', protect, controller.getOnlineMedecins); // Nouvelle route pour récupérer les médecins en ligne
router.get('/online/infirmier', protect, controller.getOnlineInfirmiers); // Nouvelle route pour récupérer les infirmiers en ligne
router.get('/online', protect, controller.getAllOnlineProfessionals); // Nouvelle route pour récupérer tous les professionnels en ligne
router.get('/centre/:idProfessionnel', protect, controller.getCentre); // Nouvelle route pour récupérer le centre d'un professionnel
router.put('/set-online-status/:idProfessionnel', protect, controller.updateOnlineStatus); // Nouvelle route pour mettre à jour le statut en ligne d'un professionnel

module.exports = router;
