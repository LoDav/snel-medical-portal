const express = require("express");
const router = express.Router();
const ayantsDroitController = require("../controllers/ayantsDroit.controller");
const { protect } = require('../middlewares/auth.middleware');

router.get("/:id/agent-principal", protect, ayantsDroitController.getAgentByAyantDroitId);

router.post("/", protect, ayantsDroitController.create);
router.get("/", protect, ayantsDroitController.getAll);
router.get("/:id", protect, ayantsDroitController.findById);
router.put("/:id", protect, ayantsDroitController.update);
router.delete("/:id", protect, ayantsDroitController.delete);
router.get("/agent/:agentId", protect, ayantsDroitController.findByAgent);


module.exports = router;
