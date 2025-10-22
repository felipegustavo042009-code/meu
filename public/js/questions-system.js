import { QuestionService } from './firebase-services.js';

class QuestionsSystem {
    constructor() {
        this.questions = [];
        this.unsubscribers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        if (RoomState.roomCode) {
            this.listenToQuestions();
        }
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="submit-question"]')) {
                this.submitQuestion();
            }
            if (e.target.matches('[data-action="mark-answered"]')) {
                const questionId = e.target.dataset.questionId;
                this.markAsAnswered(questionId);
            }
            if (e.target.matches('[data-action="delete-question"]')) {
                const questionId = e.target.dataset.questionId;
                this.deleteQuestion(questionId);
            }
        });

        document.addEventListener('keypress', (e) => {
            if (e.target.matches('#question-input') && e.key === 'Enter') {
                this.submitQuestion();
            }
        });
    }

    async submitQuestion() {
        const input = document.getElementById('question-input');
        const studentName = StudentManager.getName();
        const studentId = RoomState.studentId;

        if (!input || !input.value.trim()) {
            this.showToast('Por favor, digite sua pergunta', 'error');
            return;
        }

        if (!studentName || !studentId) {
            this.showToast('Informações do aluno não encontradas', 'error');
            return;
        }

        try {
            await QuestionService.createQuestion(
                RoomState.roomCode,
                studentId,
                studentName,
                input.value.trim()
            );

            input.value = '';
            this.showToast('Pergunta enviada com sucesso!', 'success');
        } catch (error) {
            this.showToast('Erro ao enviar pergunta: ' + error.message, 'error');
            console.error('Erro ao enviar pergunta:', error);
        }
    }

    async markAsAnswered(questionId) {
        try {
            await QuestionService.updateQuestion(questionId, { respondida: true });
            this.showToast('Pergunta marcada como respondida', 'success');
        } catch (error) {
            this.showToast('Erro ao marcar pergunta: ' + error.message, 'error');
            console.error('Erro ao marcar pergunta:', error);
        }
    }

    async deleteQuestion(questionId) {
        if (confirm('Deseja realmente excluir esta pergunta?')) {
            try {
                await QuestionService.deleteQuestion(questionId);
                this.showToast('Pergunta excluída', 'info');
            } catch (error) {
                this.showToast('Erro ao excluir pergunta: ' + error.message, 'error');
                console.error('Erro ao excluir pergunta:', error);
            }
        }
    }

    listenToQuestions(codigoSala, callback) {
    const q = query(
        collection(db, 'perguntas'),
        where('codigoSala', '==', codigoSala),
        orderBy('criadaEm', 'asc') // 🔥 MUDOU para 'asc' - ordem crescente
    );
    
    return onSnapshot(q, (snapshot) => {
        const questions = [];
        snapshot.forEach((doc) => {
            questions.push({ id: doc.id, ...doc.data() });
        });
        console.log("🔥 Listener disparou, perguntas encontradas (ordem crescente):", questions);
        callback(questions);
    });
}

    updateTeacherUI() {
        const container = document.getElementById('questions-list');
        if (!container) return;

        if (this.questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <p>Nenhuma pergunta recebida ainda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.questions.map(q => `
            <div class="question-item ${q.respondida ? 'answered' : ''}">
                <div class="question-header">
                    <strong>${q.alunoNome}</strong>
                    <small>${q.criadaEm ? new Date(q.criadaEm.toDate()).toLocaleString() : ''}</small>
                </div>
                <div class="question-body">
                    <p>${q.pergunta}</p>
                </div>
                <div class="question-actions">
                    ${!q.respondida ? `
                        <button class="btn btn-small btn-success" data-action="mark-answered" data-question-id="${q.id}">
                            <i class="fas fa-check"></i> Marcar Respondida
                        </button>
                    ` : ''}
                    <button class="btn btn-small btn-danger" data-action="delete-question" data-question-id="${q.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    showToast(message, type) {
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
    }

    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.questions = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.questionsSystem = new QuestionsSystem();
});

export default QuestionsSystem;
