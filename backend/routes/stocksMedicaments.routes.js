const express = require("express");
const router = express.Router();
const stocksMedicamentsController = require("../controllers/stocksMedicaments.controller");
const { protect } = require('../middlewares/auth.middleware');

router.get("/medicament/:medicamentId/centre/:centreId", protect, stocksMedicamentsController.findByMedicamentAndCentre);
router.get("/medicament/:medicamentId", protect, stocksMedicamentsController.findStockWithMedicamentById);
router.get("/dispositif/:dispositifId", protect, stocksMedicamentsController.findStockWithDispositifById);
router.get("/low-stock", protect, stocksMedicamentsController.getLowStockMedicaments);
router.get("/expiring", protect, stocksMedicamentsController.getExpiringMedicaments);
router.put("/update-expired", protect, stocksMedicamentsController.updateExpiredStatus);

router.post("/", protect, stocksMedicamentsController.create);
router.get("/", protect, stocksMedicamentsController.getAll);
router.get("/:id", protect, stocksMedicamentsController.findById);
router.put("/:id", protect, stocksMedicamentsController.update);
router.delete("/:id", protect, stocksMedicamentsController.delete);


module.exports = router;