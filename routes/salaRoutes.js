const express = require("express");
const router = express.Router();
const salaController = require("../controllers/salaController");

router.post("/", salaController.createSala);
router.get("/", salaController.getSalas);
router.get("/:id", salaController.getSalaById);
router.get("/codigo/:codigo", salaController.getSalaByCodigo);
router.get("/:sala_id/alunos", salaController.getAlunosConectados);
router.put("/:id", salaController.updateSala);
router.delete("/:id", salaController.deleteSala);

module.exports = router;
