import { MaterialService } from './firebase-services.js';

const MaterialsState = {
    materials: [],
    unsubscribers: []
};

const MaterialsManager = {
    addMaterial: async (materialData) => {
        const codigoSala = RoomState.roomCode;
        if (!codigoSala) {
            showToast('Código da sala não encontrado', 'error');
            return null;
        }

        try {
            let materialId;

            if (materialData.type === 'link') {
                materialId = await MaterialService.createMaterialLink(
                    codigoSala,
                    materialData.title,
                    materialData.url,
                    'link'
                );
            } else {
                const file = materialData.file;
                if (!file) {
                    showToast('Arquivo não selecionado', 'error');
                    return null;
                }

                materialId = await MaterialService.uploadMaterial(
                    codigoSala,
                    materialData.title,
                    file,
                    'file'
                );
            }

            showToast('Material adicionado com sucesso!', 'success');
            return materialId;
        } catch (error) {
            showToast('Erro ao adicionar material: ' + error.message, 'error');
            console.error('Erro ao adicionar material:', error);
            return null;
        }
    },

    removeMaterial: async (materialId) => {
        try {
            await MaterialService.deleteMaterial(materialId);
            showToast('Material removido com sucesso!', 'info');
        } catch (error) {
            showToast('Erro ao remover material: ' + error.message, 'error');
            console.error('Erro ao remover material:', error);
        }
    },

    getMaterialIcon: (material) => {
        if (material.tipo === 'link') {
            return 'fas fa-external-link-alt';
        } else if (material.nomeArquivo) {
            const extension = material.nomeArquivo.split('.').pop().toLowerCase();
            switch (extension) {
                case 'pdf':
                    return 'fas fa-file-pdf';
                case 'doc':
                case 'docx':
                    return 'fas fa-file-word';
                case 'xls':
                case 'xlsx':
                    return 'fas fa-file-excel';
                case 'ppt':
                case 'pptx':
                    return 'fas fa-file-powerpoint';
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                    return 'fas fa-file-image';
                case 'mp4':
                case 'avi':
                case 'mov':
                    return 'fas fa-file-video';
                case 'mp3':
                case 'wav':
                    return 'fas fa-file-audio';
                default:
                    return 'fas fa-file';
            }
        }
        return 'fas fa-file';
    },

    updateTeacherMaterialsUI: () => {
        const materialsSection = document.getElementById('materials-management-section');
        if (!materialsSection) return;

        const materialsList = materialsSection.querySelector('.materials-list');
        if (!materialsList) return;

        if (MaterialsState.materials.length === 0) {
            materialsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <p>Nenhum material adicionado ainda</p>
                    <button class="btn btn-primary" onclick="showAddMaterialForm()">
                        <i class="fas fa-plus" id="materialAdicionar"></i> Adicionar Primeiro Material
                    </button>
                </div>
            `;
            return;
        }

        materialsList.innerHTML = `
            <div class="materials-grid">
                ${MaterialsState.materials.map(material => `
                    <div class="material-item">
                        <div class="material-info">
                            <div class="material-icon">
                                <i class="${MaterialsManager.getMaterialIcon(material)}"></i>
                            </div>
                            <div class="material-details">
                                <h4>${material.titulo}</h4>
                                ${material.nomeArquivo ? `<small>Arquivo: ${material.nomeArquivo}</small>` : ''}
                                <small>Adicionado em ${material.criadoEm ? new Date(material.criadoEm.toDate()).toLocaleString() : ''}</small>
                            </div>
                        </div>
                        <div class="material-actions">
                            <button class="btn btn-small btn-secondary" onclick="previewMaterial('${material.id}')">
                                <i class="fas fa-eye"></i> Visualizar
                            </button>
                            <button class="btn btn-small btn-danger" onclick="removeMaterial('${material.id}')">
                                <i class="fas fa-trash"></i> Remover
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    updateStudentMaterialsUI: () => {
        const materialsSection = document.getElementById('student-materials-section');
        if (!materialsSection) return;

        const materialsList = materialsSection.querySelector('.student-materials-list');
        if (!materialsList) return;

        if (MaterialsState.materials.length === 0) {
            materialsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <p>Nenhum material disponível ainda</p>
                    <p>O professor ainda não compartilhou materiais para esta aula.</p>
                </div>
            `;
            return;
        }

        materialsList.innerHTML = `
            <div class="materials-header">
                <h3>Materiais da Aula (${MaterialsState.materials.length})</h3>
            </div>
            <div class="materials-grid">
                ${MaterialsState.materials.map(material => `
                    <div class="material-item student-material">
                        <div class="material-info">
                            <div class="material-icon">
                                <i class="${MaterialsManager.getMaterialIcon(material)}"></i>
                            </div>
                            <div class="material-details">
                                <h4>${material.titulo}</h4>
                                ${material.nomeArquivo ? `<small>Arquivo: ${material.nomeArquivo}</small>` : ''}
                                <small>Compartilhado pelo professor</small>
                            </div>
                        </div>
                        <div class="material-actions">
                            <button class="btn btn-small btn-primary" onclick="accessMaterial('${material.id}')">
                                <i class="fas fa-external-link-alt"></i> Acessar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    showAddMaterialForm: () => {
        const materialsSection = document.getElementById('materials-management-section');
        if (!materialsSection) return;

        const materialsList = materialsSection.querySelector('.materials-list');
        if (!materialsList) return;

        materialsList.innerHTML = `
            <div class="add-material-form">
                <div class="form-header">
                    <h3>Adicionar Material de Apoio</h3>
                    <button class="btn btn-secondary" onclick="MaterialsManager.updateTeacherMaterialsUI()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>

                <form id="material-form">
                    <div class="form-group">
                        <label for="material-title">Título do Material:</label>
                        <input type="text" id="material-title" placeholder="Ex: Slides da Aula 1" required>
                    </div>

                    <div class="form-group">
                        <label>Tipo de Material:</label>
                        <div class="material-type-options">
                            <div class="type-option">
                                <input type="radio" id="type-link" name="material-type" value="link" checked>
                                <label for="type-link">
                                    <i class="fas fa-link"></i>
                                    Link/URL
                                </label>
                            </div>
                            <div class="type-option">
                                <input type="radio" id="type-file" name="material-type" value="file">
                                <label for="type-file">
                                    <i class="fas fa-file"></i>
                                    Arquivo
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group" id="link-input-group">
                        <label for="material-url">URL do Material:</label>
                        <input type="url" id="material-url" placeholder="https://exemplo.com/material">
                    </div>

                    <div class="form-group" id="file-input-group" style="display: none;">
                        <label for="material-file">Arquivo:</label>
                        <input type="file" id="material-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3">
                        <small>Formatos suportados: PDF, Word, PowerPoint, Excel, Imagens, Vídeos, Áudios</small>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="addMaterialFromForm()">
                            <i class="fas fa-plus"></i> Adicionar Material
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="MaterialsManager.updateTeacherMaterialsUI()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        const typeRadios = document.querySelectorAll('input[name="material-type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const linkGroup = document.getElementById('link-input-group');
                const fileGroup = document.getElementById('file-input-group');

                if (radio.value === 'link') {
                    linkGroup.style.display = 'block';
                    fileGroup.style.display = 'none';
                } else {
                    linkGroup.style.display = 'none';
                    fileGroup.style.display = 'block';
                }
            });
        });
    },

    listenToMaterials: () => {
        if (!RoomState.roomCode) return;

        const unsubscribe = MaterialService.listenToMaterials(RoomState.roomCode, (materials) => {
            MaterialsState.materials = materials;
            MaterialsManager.updateTeacherMaterialsUI();
            MaterialsManager.updateStudentMaterialsUI();
        });

        MaterialsState.unsubscribers.push(unsubscribe);
    },

    init: async () => {
        if (RoomState.roomCode) {
            MaterialsManager.listenToMaterials();
        }
    },

    cleanup: () => {
        MaterialsState.unsubscribers.forEach(unsub => unsub());
        MaterialsState.unsubscribers = [];
        MaterialsState.materials = [];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MaterialsManager.init();
});

window.MaterialsManager = MaterialsManager;
window.MaterialsState = MaterialsState;
