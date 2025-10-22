import { QuizService } from './firebase-services.js';

const QuizState = {
    currentQuiz: null,
    studentAnswers: {},
    quizHistory: [],
    isQuizActive: false,
    unsubscribers: []
};

const QuizManager = {
    createQuiz: async (quizData) => {
        const codigoSala = RoomState.roomCode;
        if (!codigoSala) {
            showToast('Código da sala não encontrado', 'error');
            return null;
        }

        try {
            const quizId = await QuizService.createQuiz(
                codigoSala,
                quizData.question,
                quizData.options,
                quizData.correctAnswer,
                quizData.tempo || 60
            );

            showToast('Quiz enviado para os alunos!', 'success');
            return quizId;
        } catch (error) {
            showToast('Erro ao criar quiz: ' + error.message, 'error');
            console.error('Erro ao criar quiz:', error);
            return null;
        }
    },

    endQuiz: async () => {
        if (QuizState.currentQuiz) {
            try {
                await QuizService.closeQuiz(QuizState.currentQuiz.id);

                QuizState.quizHistory.push({
                    ...QuizState.currentQuiz,
                    endedAt: new Date(),
                    totalResponses: Object.keys(QuizState.currentQuiz.respostas || {}).length
                });

                QuizState.currentQuiz = null;
                QuizState.isQuizActive = false;

                QuizManager.updateTeacherQuizUI();
                showToast('Quiz encerrado!', 'info');
            } catch (error) {
                showToast('Erro ao encerrar quiz: ' + error.message, 'error');
                console.error('Erro ao encerrar quiz:', error);
            }
        }
    },

    getResults: () => {
        if (!QuizState.currentQuiz) return null;

        const respostas = QuizState.currentQuiz.respostas || {};
        const results = {
            quiz: QuizState.currentQuiz,
            totalStudents: Object.keys(respostas).length,
            correctAnswers: 0,
            incorrectAnswers: 0,
            responses: []
        };

        Object.entries(respostas).forEach(([studentId, resposta]) => {
            const isCorrect = resposta.resposta === QuizState.currentQuiz.respostaCorreta;
            if (isCorrect) results.correctAnswers++;
            else results.incorrectAnswers++;

            results.responses.push({
                studentName: resposta.nome,
                selectedOption: resposta.resposta,
                isCorrect: isCorrect,
                answeredAt: resposta.respondidoEm
            });
        });

        return results;
    },

    updateTeacherQuizUI: () => {
        const quizSection = document.getElementById('quiz-management-section');
        if (!quizSection) return;

        const quizContent = quizSection.querySelector('.section-content');
        if (!quizContent) return;

        if (QuizState.isQuizActive && QuizState.currentQuiz) {
            const respostas = QuizState.currentQuiz.respostas || {};
            quizContent.innerHTML = `
                <div class="active-quiz">
                    <div class="quiz-header">
                        <h3>Quiz Ativo</h3>
                        <div class="quiz-actions">
                            <button class="btn btn-secondary" onclick="viewQuizResults()">
                                <i class="fas fa-chart-bar"></i> Ver Resultados
                            </button>
                            <button class="btn btn-danger" onclick="endCurrentQuiz()">
                                <i class="fas fa-stop"></i> Encerrar Quiz
                            </button>
                        </div>
                    </div>
                    <div class="quiz-question">
                        <strong>Pergunta:</strong> ${QuizState.currentQuiz.pergunta}
                    </div>
                    <div class="quiz-options">
                        ${QuizState.currentQuiz.opcoes.map((option, index) => `
                            <div class="quiz-option-display ${index === QuizState.currentQuiz.respostaCorreta ? 'correct-option' : ''}">
                                ${String.fromCharCode(65 + index)}) ${option}
                                ${index === QuizState.currentQuiz.respostaCorreta ? '<i class="fas fa-check correct-icon"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="quiz-stats">
                        <div class="stat-item">
                            <span class="stat-number">${Object.keys(respostas).length}</span>
                            <span class="stat-label">Respostas</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            quizContent.innerHTML = `
                <div class="create-quiz-form">
                    <h3>Criar Novo Quiz</h3>
                    <form id="quiz-form">
                        <div class="form-group">
                            <label for="quiz-question">Pergunta:</label>
                            <textarea id="quiz-question" placeholder="Digite sua pergunta aqui..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Opções de Resposta:</label>
                            <div class="quiz-options-form">
                                <div class="option-input">
                                    <input type="text" id="option-0" placeholder="Opção A" required>
                                    <div class="certo-input">
                                        <input type="radio" name="correct-answer" value="0" required>
                                        <label>Correta</label>
                                    </div>
                                </div>
                                <div class="option-input">
                                    <input type="text" id="option-1" placeholder="Opção B" required>
                                    <div class="certo-input">
                                        <input type="radio" name="correct-answer" value="1" required>
                                        <label>Correta</label>
                                    </div>
                                </div>
                                <div class="option-input">
                                    <input type="text" id="option-2" placeholder="Opção C" required>
                                    <div class="certo-input">
                                        <input type="radio" name="correct-answer" value="2" required>
                                        <label>Correta</label>
                                    </div>
                                </div>
                                <div class="option-input">
                                    <input type="text" id="option-3" placeholder="Opção D" required>
                                    <div class="certo-input">
                                        <input type="radio" name="correct-answer" value="3" required>
                                        <label>Correta</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-primary" onclick="createQuizFromForm()">
                                <i class="fas fa-paper-plane"></i> Enviar Quiz
                            </button>
                        </div>
                    </form>
                </div>
            `;
        }
    },

    listenToActiveQuiz: () => {
        if (!RoomState.roomCode) {
            console.error('❌ RoomCode não disponível para listenToActiveQuiz');
            return;
        }

        console.log('🎯 Iniciando listener de quiz para sala:', RoomState.roomCode);

        // Limpar listener anterior se existir
        const existingIndex = QuizState.unsubscribers.findIndex(unsub =>
            unsub._name === 'studentActiveQuiz'
        );
        if (existingIndex !== -1) {
            QuizState.unsubscribers[existingIndex]();
            QuizState.unsubscribers.splice(existingIndex, 1);
        }

        const unsubscribe = QuizService.listenToActiveQuiz(RoomState.roomCode, (quiz) => {
            console.log('📡 Quiz recebido no listener:', quiz);

            if (quiz && quiz.ativo) {
                const respostas = quiz.respostas || {};
                const studentId = RoomState.studentId;

                console.log('✅ Quiz ativo encontrado. Aluno já respondeu?', !!respostas[studentId]);

                // Mostrar quiz apenas se o aluno ainda não respondeu
                if (studentId && !respostas[studentId]) {
                    console.log('🎮 Mostrando quiz para aluno');
                    StudentQuizManager.showQuiz(quiz);
                } else if (respostas[studentId]) {
                    console.log('📝 Aluno já respondeu este quiz');
                }
            } else {
                console.log('📭 Nenhum quiz ativo no momento');
                QuizState.currentQuiz = null;
            }
        });

        // Marcar este listener para identificação
        unsubscribe._name = 'studentActiveQuiz';
        QuizState.unsubscribers.push(unsubscribe);
    },

    init: async () => {
        if (RoomState.roomCode) {
            QuizManager.listenToActiveQuiz();
        }
    },

    cleanup: () => {
        QuizState.unsubscribers.forEach(unsub => unsub());
        QuizState.unsubscribers = [];
        QuizState.currentQuiz = null;
        QuizState.isQuizActive = false;
    }
};

const StudentQuizManager = {
    showQuiz: (quiz) => {
        const modal = document.getElementById('quiz-modal');
        if (!modal) {
            StudentQuizManager.createQuizModal();
        }

        const modalContent = document.querySelector('#quiz-modal .modal-body');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="quiz-question">${quiz.pergunta}</div>
                <div class="quiz-options">
                    ${quiz.opcoes.map((option, index) => `
                        <div class="quiz-option" onclick="selectQuizOption(${index})">
                            <input type="radio" name="quiz-answer" value="${index}" id="option-${index}">
                            <label for="option-${index}">${String.fromCharCode(65 + index)}) ${option}</label>
                        </div>
                    `).join('')}
                </div>
            `;

            const modalHeader = document.querySelector('#quiz-modal .modal-header h3');
            if (modalHeader) {
                modalHeader.textContent = 'Quiz';
            }

            document.getElementById('quiz-modal').style.display = 'flex';
        }

        QuizState.currentQuiz = quiz;
    },

    createQuizModal: () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'quiz-modal';
        modal.innerHTML = `
            <div class="modal-content quiz-modal-content">
                <div class="modal-header">
                    <h3>Quiz</h3>
                </div>
                <div class="modal-body">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="submitQuizAnswer()">
                        <i class="fas fa-check"></i> Responder
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    submitAnswer: async (selectedOption) => {
        const quiz = QuizState.currentQuiz;
        if (!quiz) return;

        const studentName = StudentManager.getName();
        const studentId = RoomState.studentId;

        if (!studentName || !studentId) {
            showToast('Informações do aluno não encontradas', 'error');
            return;
        }

        try {
            await QuizService.submitAnswer(quiz.id, studentId, studentName, selectedOption);

            const isCorrect = selectedOption === quiz.respostaCorreta;
            const feedbackMessage = isCorrect ?
                'Resposta correta! Parabéns!' :
                `Resposta incorreta. A resposta correta era: ${String.fromCharCode(65 + quiz.respostaCorreta)}) ${quiz.opcoes[quiz.respostaCorreta]}`;

            showToast(feedbackMessage, isCorrect ? 'success' : 'error');

            document.getElementById('quiz-modal').style.display = 'none';

            return true;
        } catch (error) {
            showToast('Erro ao enviar resposta: ' + error.message, 'error');
            console.error('Erro ao enviar resposta:', error);
            return false;
        }
    },

    listenToActiveQuiz: () => {
        if (!RoomState.roomCode) return;

        const unsubscribe = QuizService.listenToActiveQuiz(RoomState.roomCode, (quiz) => {
            if (quiz && quiz.ativo) {
                const respostas = quiz.respostas || {};
                const studentId = RoomState.studentId;

                if (studentId && !respostas[studentId]) {
                    StudentQuizManager.showQuiz(quiz);
                }
            }
        });

        QuizState.unsubscribers.push(unsubscribe);
    },

    init: () => {
        console.log('🎮 StudentQuizManager.init() chamado');

        if (RoomState.isStudent && RoomState.roomCode) {
            console.log('✅ Inicializando listener de quiz ativo');
            console.log('🏠 Sala:', RoomState.roomCode);
            console.log('👤 ID do aluno:', RoomState.studentId);

            StudentQuizManager.listenToActiveQuiz();
        } else {
            console.log('❌ Condições não atendidas para StudentQuizManager:');
            console.log('   - É aluno?:', RoomState.isStudent);
            console.log('   - Tem roomCode?:', !!RoomState.roomCode);
            console.log('   - Tem studentId?:', !!RoomState.studentId);
        }
    },
};

function initializeQuizSystem() {
    console.log('🎯 Inicializando sistema de quiz...');

    // Sempre inicializar o QuizManager básico
    QuizManager.init();

    // Inicialização específica para alunos
    if (RoomState.isStudent) {
        console.log('🎓 Inicializando quiz para ALUNO');
        console.log('📝 RoomCode:', RoomState.roomCode);
        console.log('👤 StudentId:', RoomState.studentId);

        if (RoomState.roomCode && RoomState.studentId) {
            StudentQuizManager.init();
        } else {
            console.log('⏳ Aguardando RoomState completo...');
            // Tentar novamente em 1 segundo
            setTimeout(initializeQuizSystem, 1000);
        }
    } else if (RoomState.isTeacher) {
        console.log('👨‍🏫 Inicializando quiz para PROFESSOR');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM carregado, iniciando quiz system...');
    setTimeout(initializeQuizSystem, 100);
});

// Também inicializar quando RoomState mudar (SPA navigation)
let quizInitialized = false;
const originalNavigateTo = window.navigateTo;
window.navigateTo = function (page) {
    originalNavigateTo(page);

    // Re-inicializar quiz quando navegar para student-room
    if (page === 'student-room' && !quizInitialized) {
        setTimeout(initializeQuizSystem, 500);
        quizInitialized = true;
    }
};


window.QuizManager = QuizManager;
window.StudentQuizManager = StudentQuizManager;
window.QuizState = QuizState;
