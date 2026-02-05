const express = require("express");
const router = express.Router();
const dispositifsMedicauxController = require("../controllers/dispositifsMedicaux.controller");
const { protect } = require('../middlewares/auth.middleware');

router.get("/search", protect, dispositifsMedicauxController.searchByName);

router.post("/", protect, dispositifsMedicauxController.create);
router.get("/", protect, dispositifsMedicauxController.getAll);
router.get("/:id", protect, dispositifsMedicauxController.findById);
router.put("/:id", protect, dispositifsMedicauxController.update);
router.delete("/:id", protect, dispositifsMedicauxController.delete);

module.exports = router;