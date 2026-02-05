const express = require("express");
const router = express.Router();
const dispensationsController = require("../controllers/dispensations.controller");
const { protect } = require('../middlewares/auth.middleware');


router.get("/patient/:patientId", protect, dispensationsController.findByPatient);
router.get("/medicament/:medicamentId", protect, dispensationsController.findByMedicament);
router.get("/top-monthly", protect, dispensationsController.getTopDispensedMedicaments);


router.post("/", protect, dispensationsController.create);
router.get("/", protect, dispensationsController.getAll);
router.get("/:id", protect, dispensationsController.findById);
router.put("/:id", protect, dispensationsController.update);
router.delete("/:id", protect, dispensationsController.delete);


module.exports = router;