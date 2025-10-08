const express = require("express");
const router = express.Router();
const perguntaAlunoController = require("../controllers/perguntaAlunoController");

router.post("/", perguntaAlunoController.createPerguntaAluno);
router.get("/sala/:sala_id", perguntaAlunoController.getPerguntasBySala);
router.put("/:id", perguntaAlunoController.updatePerguntaAluno);
router.put("/:id/responder", perguntaAlunoController.marcarRespondida);

module.exports = router;
