const express = require("express");
const router = express.Router();
const medicamentCategoriesController = require("../controllers/medicamentCategories.controller");
const { protect } = require('../middlewares/auth.middleware');

router.get("/search", protect, medicamentCategoriesController.searchByName);
router.get("/catalogue-grouped", protect, medicamentCategoriesController.getCatalogueGrouped);

router.post("/", protect, medicamentCategoriesController.create);
router.get("/", protect, medicamentCategoriesController.getAll);
router.get("/:id", protect, medicamentCategoriesController.findById);
router.put("/:id", protect, medicamentCategoriesController.update);
router.delete("/:id", protect, medicamentCategoriesController.delete);

module.exports = router;