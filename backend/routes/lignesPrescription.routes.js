const express = require("express");
const router = express.Router();
const lignesPrescriptionController = require("../controllers/lignesPrescription.controller");
const { protect } = require('../middlewares/auth.middleware');


router.get("/prescription/:prescriptionId", protect, lignesPrescriptionController.findByPrescription);
router.get("/patient/:patientId", protect, lignesPrescriptionController.getPrescriptionsByPatient);
router.get("/patient/detailed/:patientId", protect, lignesPrescriptionController.getDetailedPrescriptionsByPatient);
router.get("/detailed/all", protect, lignesPrescriptionController.getAllDetailedPrescriptions);
router.get("/prescribed/count", protect, lignesPrescriptionController.getPrescribedLinesCount);

router.post("/", protect, lignesPrescriptionController.create);
router.get("/", protect, lignesPrescriptionController.getAll);
router.get("/:id", protect, lignesPrescriptionController.findById);
router.put("/:id", protect, lignesPrescriptionController.update);
router.delete("/:id", protect, lignesPrescriptionController.delete);

module.exports = router;