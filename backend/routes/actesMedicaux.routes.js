const express = require("express");
const router = express.Router();
const actesMedicauxController = require("../controllers/actesMedicaux.controller");
const { protect } = require('../middlewares/auth.middleware');

router.post("/", protect, actesMedicauxController.create);
router.get("/", protect, actesMedicauxController.getAll);
router.get("/:id", protect, actesMedicauxController.findById);
router.put("/:id", protect, actesMedicauxController.update);
router.delete("/:id", protect, actesMedicauxController.delete);
router.get("/patient/:patientId", protect, actesMedicauxController.findByPatient);
router.get("/consultation/:consultationId", protect, actesMedicauxController.findByConsultation);

module.exports = router;