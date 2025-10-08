const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");

router.post("/", materialController.createMaterial);
router.get("/sala/:sala_id", materialController.getMateriaisBySala);
router.delete("/:id", materialController.deleteMaterial);

module.exports = router;
