const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");

router.post("/", quizController.createQuiz);
router.get("/sala/:sala_id", quizController.getQuizzesBySala);
router.get("/sala/:sala_id/ativo", quizController.getQuizAtivo);
router.put("/:id/desativar", quizController.desativarQuiz);
router.post("/responder", quizController.responderQuiz);
router.get("/:quiz_id/respostas", quizController.getRespostasQuiz);

module.exports = router;
