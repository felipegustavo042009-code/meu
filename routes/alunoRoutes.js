const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");

router.post("/connect", alunoController.connectAluno);
router.get("/sala/:sala_id", alunoController.getAlunosConectados);
router.get("/:id", alunoController.getAlunoById);
router.put("/:id", alunoController.updateAluno);
router.put("/:id/disconnect", alunoController.disconnectAluno);
router.put("/:id/presenca", alunoController.confirmarPresenca);
router.put("/:id/mao", alunoController.levantarMao);

module.exports = router;
