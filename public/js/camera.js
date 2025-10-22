import { StudentService } from './firebase-services.js';

let cameraStream = null;
let capturedPhoto = null;
let cameraContext = null;

const getCameraElements = () => ({
    modal: DOM.get('camera-modal'),
    video: DOM.get('camera-video'),
    canvas: DOM.get('camera-canvas'),
    preview: DOM.get('camera-preview'),
    previewImage: DOM.get('preview-image'),
    startBtn: DOM.get('start-camera-btn'),
    captureBtn: DOM.get('capture-btn'),
    retakeBtn: DOM.get('retake-btn'),
    confirmBtn: DOM.get('confirm-btn'),
    downloadBtn: DOM.get('download-btn')
});

function openCameraModal(context = 'general') {
    cameraContext = context;
    const elements = getCameraElements();

    if (elements.modal) {
        elements.modal.classList.add('active');
        elements.modal.style.display = 'flex';
        resetCameraState();
    }
}

function closeCameraModal() {
    const elements = getCameraElements();

    if (elements.modal) {
        elements.modal.classList.remove('active');
        elements.modal.style.display = 'none';
    }

    stopCamera();
    resetCameraState();
}

function resetCameraState() {
    const elements = getCameraElements();

    if (elements.video) elements.video.style.display = 'block';
    if (elements.preview) elements.preview.style.display = 'none';
    if (elements.startBtn) elements.startBtn.style.display = 'block';
    if (elements.captureBtn) elements.captureBtn.style.display = 'none';
    if (elements.retakeBtn) elements.retakeBtn.style.display = 'none';
    if (elements.confirmBtn) elements.confirmBtn.style.display = 'none';
    if (elements.downloadBtn) elements.downloadBtn.style.display = 'none';

    capturedPhoto = null;
}

async function startCamera() {
    const elements = getCameraElements();

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Seu navegador não suporta acesso à câmera');
        }

        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        };

        showToast('Solicitando acesso à câmera...', 'info');

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (elements.video) {
            elements.video.srcObject = cameraStream;
            elements.video.play();

            elements.video.onloadedmetadata = () => {
                showToast('Câmera iniciada com sucesso!', 'success');

                if (elements.startBtn) elements.startBtn.style.display = 'none';
                if (elements.captureBtn) elements.captureBtn.style.display = 'block';
            };
        }

    } catch (error) {
        console.error('Erro ao acessar câmera:', error);

        let errorMessage = 'Erro ao acessar a câmera';

        if (error.name === 'NotAllowedError') {
            errorMessage = 'Acesso à câmera negado. Por favor, permita o acesso e tente novamente.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Seu navegador não suporta acesso à câmera.';
        }

        showToast(errorMessage, 'error');
    }
}

function stopCamera() {
    if (cameraStream) {
        const tracks = cameraStream.getTracks();
        tracks.forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    const elements = getCameraElements();

    if (!elements.video || !elements.canvas) {
        showToast('Erro: elementos de câmera não encontrados', 'error');
        return;
    }

    try {
        const video = elements.video;
        const canvas = elements.canvas;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);

        if (elements.previewImage && elements.preview) {
            elements.previewImage.src = capturedPhoto;
            elements.video.style.display = 'none';
            elements.preview.style.display = 'block';
        }

        if (elements.captureBtn) elements.captureBtn.style.display = 'none';
        if (elements.retakeBtn) elements.retakeBtn.style.display = 'block';
        if (elements.confirmBtn) elements.confirmBtn.style.display = 'block';
        if (elements.downloadBtn) elements.downloadBtn.style.display = 'block';

        showToast('Foto capturada! Você pode refazer ou confirmar.', 'success');

    } catch (error) {
        console.error('Erro ao capturar foto:', error);
        showToast('Erro ao capturar foto', 'error');
    }
}

function retakePhoto() {
    const elements = getCameraElements();

    if (elements.video) elements.video.style.display = 'block';
    if (elements.preview) elements.preview.style.display = 'none';

    if (elements.captureBtn) elements.captureBtn.style.display = 'block';
    if (elements.retakeBtn) elements.retakeBtn.style.display = 'none';
    if (elements.confirmBtn) elements.confirmBtn.style.display = 'none';
    if (elements.downloadBtn) elements.downloadBtn.style.display = 'none';

    capturedPhoto = null;
    showToast('Pronto para capturar nova foto', 'info');
}

function confirmPhoto() {
    if (!capturedPhoto) {
        showToast('Nenhuma foto capturada', 'error');
        return;
    }

    switch (cameraContext) {
        case 'attendance':
            confirmAttendancePhoto();
            break;
        default:
            showToast('Foto confirmada com sucesso!', 'success');
            closeCameraModal();
            break;
    }
}

async function confirmAttendancePhoto() {
    if (!capturedPhoto) {
        showToast('Nenhuma foto capturada', 'error');
        return;
    }

    const studentId = RoomState.studentId;
    if (!studentId) {
        showToast('ID do aluno não encontrado', 'error');
        return;
    }

    showLoading();

    try {
        const blob = await fetch(capturedPhoto).then(res => res.blob());
        await StudentService.markPresence(studentId, blob);

        hideLoading();
        showToast('Presença marcada com sucesso!', 'success');
        closeCameraModal();
    } catch (error) {
        hideLoading();
        console.error('Erro ao marcar presença:', error);
        showToast('Erro ao marcar presença', 'error');
    }
}

function downloadPhoto() {
    if (!capturedPhoto) {
        showToast('Nenhuma foto para download', 'error');
        return;
    }

    try {
        const link = document.createElement('a');
        link.download = `foto_${DateUtils.getCurrentDate()}_${DateUtils.getCurrentTime().replace(':', '')}.jpg`;
        link.href = capturedPhoto;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Foto baixada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao baixar foto:', error);
        showToast('Erro ao baixar foto', 'error');
    }
}

function checkCameraSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
            supported: false,
            message: 'Seu navegador não suporta acesso à câmera'
        };
    }

    return {
        supported: true,
        message: 'Câmera suportada'
    };
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');

        return cameras.map(camera => ({
            id: camera.deviceId,
            label: camera.label || `Câmera ${cameras.indexOf(camera) + 1}`
        }));

    } catch (error) {
        console.error('Erro ao listar câmeras:', error);
        return [];
    }
}

async function switchCamera(deviceId) {
    if (cameraStream) {
        stopCamera();
    }

    try {
        const constraints = {
            video: {
                deviceId: { exact: deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

        const elements = getCameraElements();
        if (elements.video) {
            elements.video.srcObject = cameraStream;
            elements.video.play();
        }

        showToast('Câmera alterada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao trocar câmera:', error);
        showToast('Erro ao trocar câmera', 'error');
    }
}

function applyPhotoFilter(filterType) {
    if (!capturedPhoto) {
        showToast('Nenhuma foto para aplicar filtro', 'error');
        return;
    }

    const elements = getCameraElements();
    const canvas = elements.canvas;
    const context = canvas.getContext('2d');

    const img = new Image();
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;

        switch (filterType) {
            case 'grayscale':
                context.filter = 'grayscale(100%)';
                break;
            case 'sepia':
                context.filter = 'sepia(100%)';
                break;
            case 'blur':
                context.filter = 'blur(2px)';
                break;
            case 'brightness':
                context.filter = 'brightness(120%)';
                break;
            case 'contrast':
                context.filter = 'contrast(120%)';
                break;
            default:
                context.filter = 'none';
        }

        context.drawImage(img, 0, 0);

        capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);

        if (elements.previewImage) {
            elements.previewImage.src = capturedPhoto;
        }

        showToast(`Filtro ${filterType} aplicado!`, 'success');
    };

    img.src = capturedPhoto;
}

async function copyToClipboard(elementId) {
    const element = DOM.get(elementId);

    if (!element) {
        showToast('Elemento não encontrado', 'error');
        return;
    }

    try {
        let textToCopy = '';

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            textToCopy = element.value;
        } else {
            textToCopy = element.textContent || element.innerText;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Copiado para a área de transferência!', 'success');
        } else {
            element.select();
            document.execCommand('copy');
            showToast('Copiado para a área de transferência!', 'success');
        }

    } catch (error) {
        console.error('Erro ao copiar:', error);
        showToast('Erro ao copiar para área de transferência', 'error');
    }
}

window.openCameraModal = openCameraModal;
window.closeCameraModal = closeCameraModal;
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.capturePhoto = capturePhoto;
window.retakePhoto = retakePhoto;
window.confirmPhoto = confirmPhoto;
window.downloadPhoto = downloadPhoto;
window.checkCameraSupport = checkCameraSupport;
window.getAvailableCameras = getAvailableCameras;
window.switchCamera = switchCamera;
window.applyPhotoFilter = applyPhotoFilter;
window.copyToClipboard = copyToClipboard;

document.addEventListener('DOMContentLoaded', function() {
    const support = checkCameraSupport();
    if (!support.supported) {
        console.warn('Camera not supported:', support.message);
    }
});
