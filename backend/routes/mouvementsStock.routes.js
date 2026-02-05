const express = require("express");
const router = express.Router();
const mouvementsStockController = require("../controllers/mouvementsStock.controller");

// Routes pour les mouvements de stock
router.post("/", mouvementsStockController.create);
router.get("/", mouvementsStockController.getAll);
router.get("/medicament/:medicamentId", mouvementsStockController.getByMedicament);
router.get("/centre/:centreId", mouvementsStockController.getByCentre);
router.get("/weekly", mouvementsStockController.getWeeklyMovements);
router.get("/monthly-incoming-lots", mouvementsStockController.getMonthlyIncomingLots);
router.get("/monthly-receptions", mouvementsStockController.getMonthlyReceptions);
router.get("/today-exits-by-medicament", mouvementsStockController.getTodayExitsByMedicament);
router.get("/today-total-exits", mouvementsStockController.getTodayTotalExits);
router.get("/recent", mouvementsStockController.getRecentMovements);
router.get("/detailed", mouvementsStockController.getDetailedMovements);
router.get("/:id", mouvementsStockController.findById);
router.delete("/:id", mouvementsStockController.delete);

module.exports = router;