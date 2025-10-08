const express = require("express");
const router = express.Router();
const participacaoController = require("../controllers/participacaoController");

router.post("/", participacaoController.createAtividade);
router.get("/sala/:sala_id", participacaoController.getAtividadesBySala);
router.delete("/:id", participacaoController.deleteAtividade);

module.exports = router;
