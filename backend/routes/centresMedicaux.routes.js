const express = require('express');
const router = express.Router();
const controller = require('../controllers/centresMedicaux.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, controller.create);
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;
