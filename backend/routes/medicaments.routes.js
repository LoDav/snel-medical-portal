const express = require("express");
const router = express.Router();
const medicamentsController = require("../controllers/medicaments.controller");
const { protect } = require('../middlewares/auth.middleware');


router.get("/search", protect, medicamentsController.searchByName);
router.get("/stock-status-summary", protect, medicamentsController.getStockStatusSummary);
router.get("/with-stock", protect, medicamentsController.getAllWithStock);

router.post("/", protect, medicamentsController.create);
router.get("/", protect, medicamentsController.getAll);
router.get("/:id", protect, medicamentsController.findById);
router.put("/:id", protect, medicamentsController.update);
router.delete("/:id", protect, medicamentsController.delete);


module.exports = router;