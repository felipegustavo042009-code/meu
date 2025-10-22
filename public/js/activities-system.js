import { ActivityService } from './firebase-services.js';

class ActivitiesSystem {
    constructor() {
        this.activities = [];
        this.responses = [];
        this.unsubscribers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        if (RoomState.roomCode) {
            this.listenToActivities();
        }
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="create-activity"]')) {
                this.openCreateActivityModal();
            }
            if (e.target.matches('[data-action="save-activity"]')) {
                this.saveActivity();
            }
            if (e.target.matches('[data-action="delete-activity"]')) {
                const activityId = e.target.dataset.activityId;
                this.deleteActivity(activityId);
            }
            if (e.target.matches('[data-action="close-modal"]')) {
                this.closeAllModals();
            }
        });
    }

    openCreateActivityModal() {
        const modal = document.getElementById('create-activity-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');

            this.clearActivityForm();

            setTimeout(() => {
                const titleInput = document.getElementById('activity-title');
                if (titleInput) titleInput.focus();
            }, 100);
        }
    }

    async saveActivity() {
        const title = document.getElementById('activity-title')?.value.trim();
        const description = document.getElementById('activity-description')?.value.trim();
        const type = document.getElementById('activity-type')?.value;
        const dueDate = document.getElementById('activity-due-date')?.value;

        if (!title) {
            this.showToast('Por favor, digite o título da atividade', 'error');
            return;
        }

        if (!description) {
            this.showToast('Por favor, digite a descrição da atividade', 'error');
            return;
        }

        try {
            await ActivityService.createActivity(
                RoomState.roomCode,
                title,
                description,
                type || 'tarefa',
                dueDate
            );

            this.showToast('Atividade criada com sucesso!', 'success');
            this.closeAllModals();
        } catch (error) {
            this.showToast('Erro ao criar atividade: ' + error.message, 'error');
            console.error('Erro ao criar atividade:', error);
        }
    }

    async deleteActivity(activityId) {
        // Encontrar a atividade para mostrar o nome na confirmação
        const activity = this.activities.find(a => a.id === activityId);
        const activityName = activity?.titulo || 'esta atividade';

        if (confirm(`Tem certeza que deseja excluir "${activityName}"? Esta ação não pode ser desfeita.`)) {
            try {
                showToast('Excluindo atividade...', 'info');
                await ActivityService.deleteActivity(activityId);
                showToast('Atividade excluída com sucesso!', 'success');

                // Remover a atividade da lista local
                this.activities = this.activities.filter(a => a.id !== activityId);
                this.updateTeacherUI();

            } catch (error) {
                console.error('Erro ao excluir atividade:', error);
                showToast('Erro ao excluir atividade: ' + error.message, 'error');
            }
        }
    }

    // No arquivo active.txt, modifique o listenToActivities
    listenToActivities() {
        if (!RoomState.roomCode) return;

        console.log('🎯 Ouvindo atividades para sala:', RoomState.roomCode);

        const unsubscribe = ActivityService.listenToActivities(RoomState.roomCode, (activities) => {
            console.log('📚 Atividades recebidas:', activities);
            this.activities = activities || [];

            // ✅ Garantir que os métodos existam antes de chamar
            if (typeof this.updateTeacherUI === 'function') {
                this.updateTeacherUI();
            } else {
                console.warn('⚠️ updateTeacherUI não disponível');
            }

            if (typeof this.updateStudentUI === 'function') {
                this.updateStudentUI();
            } else {
                console.warn('⚠️ updateStudentUI não disponível');
            }
        });

        this.unsubscribers.push(unsubscribe);
    }

    updateStudentUI() {
        const container = document.getElementById('student-activities-list');
        console.log('🎯 Atualizando UI do aluno, container:', container);
        console.log('📋 Atividades disponíveis:', this.activities);

        if (!container) {
            console.error('❌ Container de atividades do aluno não encontrado');
            return;
        }

        if (this.activities.length === 0) {
            console.log('📭 Nenhuma atividade disponível');
            container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p>Nenhuma atividade disponível</p>
            </div>
        `;
            return;
        }

        console.log('🎨 Renderizando atividades para aluno');
        container.innerHTML = this.activities.map(activity => `
        <div class="activity-item student-activity">
            <div class="activity-header">
                <h4>${activity.titulo}</h4>
                <span class="activity-type">${activity.tipo}</span>
            </div>
            <div class="activity-body">
                <p>${activity.descricao}</p>
                ${activity.prazo ? `<small>Prazo: ${new Date(activity.prazo).toLocaleString()}</small>` : ''}
            </div>
        </div>
    `).join('');
    }

    updateTeacherUI() {
        console.log('🔄 ATUALIZANDO UI DO PROFESSOR - Iniciando...');
        const container = document.getElementById('teacher-activities-list');

        if (!container) {
            console.error('❌ Container de atividades do professor não encontrado');
            return;
        }

        console.log('✅ Container encontrado, atividades:', this.activities.length);

        if (this.activities.length === 0) {
            console.log('📭 Nenhuma atividade para mostrar');
            container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>Nenhuma atividade criada ainda</p>
                <button class="btn btn-primary" data-action="create-activity">
                    <i class="fas fa-plus"></i> Criar Primeira Atividade
                </button>
            </div>
        `;
            return;
        }

        console.log('🎨 Renderizando', this.activities.length, 'atividades para o professor');

        container.innerHTML = this.activities.map(activity => {
            return `
            <div class="activity-item">
                <div class="activity-header">
                    <h4>${activity.titulo || 'Sem título'}</h4>
                    <span class="activity-type">${activity.tipo || 'tarefa'}</span>
                </div>
                <div class="activity-body">
                    <p>${activity.descricao || 'Sem descrição'}</p>
                    ${activity.prazo ? `<small>Prazo: ${new Date(activity.prazo).toLocaleString()}</small>` : ''}
                </div>
                <div class="activity-actions">
                    <button class="btn btn-small btn-danger" 
                            onclick="window.activitiesSystem.deleteActivity('${activity.id}')"
                            title="Excluir atividade">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        }).join('');

        console.log('✅ UI do professor atualizada com sucesso');
    }

    clearActivityForm() {
        const title = document.getElementById('activity-title');
        const description = document.getElementById('activity-description');
        const type = document.getElementById('activity-type');
        const dueDate = document.getElementById('activity-due-date');

        if (title) title.value = '';
        if (description) description.value = '';
        if (type) type.value = 'tarefa';
        if (dueDate) dueDate.value = '';
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        });
    }

    showToast(message, type) {
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
    }

    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.activities = [];
        this.responses = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.activitiesSystem = new ActivitiesSystem();
});

export default ActivitiesSystem;
