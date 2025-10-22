import { db, storage } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';



function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const RoomService = {
  async createRoom(professorNome) {
    const codigo = generateRoomCode();
    const roomRef = doc(db, 'salas', codigo);

    await setDoc(roomRef, {
      codigo,
      professorNome,
      alunosConectados: [],
      criadaEm: serverTimestamp(),
      ativa: true
    });

    return codigo;
  },

  async getRoom(codigo) {
    const roomRef = doc(db, 'salas', codigo);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    }
    return null;
  },

  listenToRoom(codigo, callback) {
    const roomRef = doc(db, 'salas', codigo);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  async updateRoom(codigo, data) {
    const roomRef = doc(db, 'salas', codigo);
    await updateDoc(roomRef, data);
  },

  async addStudentToRoom(codigoSala, alunoId, alunoNome) {
    const roomRef = doc(db, 'salas', codigoSala);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const alunosConectados = roomSnap.data().alunosConectados || [];
      if (!alunosConectados.find(a => a.id === alunoId)) {
        alunosConectados.push({ id: alunoId, nome: alunoNome, conectadoEm: new Date().toISOString() });
        await updateDoc(roomRef, { alunosConectados });
      }
    }
  },

  listenToStudents(codigoSala, callback) {
    const roomRef = doc(db, 'salas', codigoSala);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().alunosConectados || []);
      }
    });
  }
};

export const StudentService = {
  async createStudent(codigoSala, nome) {
    const studentRef = await addDoc(collection(db, 'alunos'), {
      codigoSala,
      nome,
      presenca: false,
      maoLevantada: false,
      fotoPresenca: null,
      criadoEm: serverTimestamp()
    });

    await RoomService.addStudentToRoom(codigoSala, studentRef.id, nome);

    return studentRef.id;
  },

  async getStudent(studentId) {
    const studentRef = doc(db, 'alunos', studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return { id: studentSnap.id, ...studentSnap.data() };
    }
    return null;
  },

  async updateStudent(studentId, data) {
    const studentRef = doc(db, 'alunos', studentId);
    await updateDoc(studentRef, data);
  },

  async markPresence(studentId, fotoBlob) {
    let fotoUrl = null;

    if (fotoBlob) {
      const storageRef = ref(storage, `presenca/${studentId}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, fotoBlob);
      fotoUrl = await getDownloadURL(storageRef);
    }

    await this.updateStudent(studentId, {
      presenca: true,
      fotoPresenca: fotoUrl,
      presencaMarcadaEm: serverTimestamp()
    });
  },

  async raiseHand(studentId, levantada) {
    await this.updateStudent(studentId, {
      maoLevantada: levantada,
      maoLevantadaEm: levantada ? serverTimestamp() : null
    });
  },

  listenToStudent(studentId, callback) {
    const studentRef = doc(db, 'alunos', studentId);
    return onSnapshot(studentRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  listenToStudentsInRoom(codigoSala, callback) {
    const q = query(collection(db, 'alunos'), where('codigoSala', '==', codigoSala));
    return onSnapshot(q, (snapshot) => {
      const students = [];
      snapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      callback(students);
    });
  },

  listenToRaisedHands(codigoSala, callback) {
    const q = query(
      collection(db, 'alunos'),
      where('codigoSala', '==', codigoSala),
      where('maoLevantada', '==', true)
    );
    return onSnapshot(q, (snapshot) => {
      const raisedHands = [];
      snapshot.forEach((doc) => {
        raisedHands.push({ id: doc.id, ...doc.data() });
      });
      callback(raisedHands);
    });
  }
};

export const QuestionService = {
  async createQuestion(codigoSala, alunoId, alunoNome, pergunta) {
    const questionRef = await addDoc(collection(db, 'perguntas'), {
      codigoSala,
      alunoId,
      alunoNome,
      pergunta,
      respondida: false,
      criadaEm: serverTimestamp()
    });

    return questionRef.id;
  },

  async updateQuestion(questionId, data) {
    const questionRef = doc(db, 'perguntas', questionId);
    await updateDoc(questionRef, data);
  },

  async deleteQuestion(questionId) {
    const questionRef = doc(db, 'perguntas', questionId);
    await deleteDoc(questionRef);
  },

  listenToQuestions(codigoSala, callback) {
    const q = query(
      collection(db, 'perguntas'),
      where('codigoSala', '==', codigoSala)
    );

    return onSnapshot(q, (snapshot) => {
      const questions = [];
      snapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });

      questions.sort((a, b) => {
        const dateA = a.criadaEm?.toDate ? a.criadaEm.toDate() : new Date(a.criadaEm || 0);
        const dateB = b.criadaEm?.toDate ? b.criadaEm.toDate() : new Date(b.criadaEm || 0);
        return dateB - dateA; // Mais recentes primeiro
      });
      console.log("🔥 Listener disparou, perguntas encontradas:", questions);
      callback(questions);
    });
  }
};

export const ActivityService = {
  async createActivity(codigoSala, titulo, descricao, tipo, prazo) {
    const activityRef = await addDoc(collection(db, 'atividades'), {
      codigoSala,
      titulo,
      descricao,
      tipo,
      prazo,
      ativa: true,
      criadaEm: serverTimestamp()
    });

    return activityRef.id;
  },

  async updateActivity(activityId, data) {
    const activityRef = doc(db, 'atividades', activityId);
    await updateDoc(activityRef, data);
  },

  async deleteActivity(activityId) {
    const activityRef = doc(db, 'atividades', activityId);
    await deleteDoc(activityRef);
  },

  listenToActivities(codigoSala, callback) {
    const q = query(
      collection(db, 'atividades'),
      where('codigoSala', '==', codigoSala),
      where('ativa', '==', true),
      orderBy('criadaEm', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const activities = [];
      snapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      callback(activities);
    });
  }
};

export const QuizService = {
  async createQuiz(codigoSala, pergunta, opcoes, respostaCorreta, tempo) {
    const quizRef = await addDoc(collection(db, 'quizzes'), {
      codigoSala,
      pergunta,
      opcoes,
      respostaCorreta,
      tempo,
      ativo: true,
      respostas: {},
      criadoEm: serverTimestamp()
    });

    return quizRef.id;
  },

  async submitAnswer(quizId, alunoId, alunoNome, resposta) {
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      const respostas = quizSnap.data().respostas || {};
      respostas[alunoId] = {
        nome: alunoNome,
        resposta,
        respondidoEm: new Date().toISOString()
      };
      await updateDoc(quizRef, { respostas });
    }
  },

  async closeQuiz(quizId) {
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, {
      ativo: false,
      fechadoEm: serverTimestamp()
    });
  },

  async getQuiz(quizId) {
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      return { id: quizSnap.id, ...quizSnap.data() };
    }
    return null;
  },

  listenToActiveQuiz(codigoSala, callback) {
    console.log('🔥 Firebase: Buscando quiz ativo para sala:', codigoSala);

    const q = query(
      collection(db, 'quizzes'),
      where('codigoSala', '==', codigoSala),
      where('ativo', '==', true),
      orderBy('criadoEm', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      console.log('🔥 Firebase: Snapshot de quiz recebido:', snapshot.size, 'documentos');

      if (!snapshot.empty) {
        const quiz = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        console.log('✅ Quiz ativo encontrado:', quiz);
        callback(quiz);
      } else {
        console.log('❌ Nenhum quiz ativo encontrado');
        callback(null);
      }
    });
  },

  listenToQuiz(quizId, callback) {
    const quizRef = doc(db, 'quizzes', quizId);
    return onSnapshot(quizRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }
};

export const MaterialService = {
  async uploadMaterial(codigoSala, titulo, arquivo, tipo) {
    let url = null;

    if (arquivo) {
      const storageRef = ref(storage, `materiais/${codigoSala}/${Date.now()}_${arquivo.name}`);
      await uploadBytes(storageRef, arquivo);
      url = await getDownloadURL(storageRef);
    }

    const materialRef = await addDoc(collection(db, 'materiais'), {
      codigoSala,
      titulo,
      tipo,
      url,
      nomeArquivo: arquivo ? arquivo.name : null,
      criadoEm: serverTimestamp()
    });

    return materialRef.id;
  },

  async createMaterialLink(codigoSala, titulo, link, tipo) {
    const materialRef = await addDoc(collection(db, 'materiais'), {
      codigoSala,
      titulo,
      tipo,
      url: link,
      criadoEm: serverTimestamp()
    });

    return materialRef.id;
  },

  async deleteMaterial(materialId) {
    const materialRef = doc(db, 'materiais', materialId);
    await deleteDoc(materialRef);
  },

  listenToMaterials(codigoSala, callback) {
    const q = query(
      collection(db, 'materiais'),
      where('codigoSala', '==', codigoSala),
      orderBy('criadoEm', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const materials = [];
      snapshot.forEach((doc) => {
        materials.push({ id: doc.id, ...doc.data() });
      });
      callback(materials);
    });
  }
};

window.QuestionService = QuestionService;
window.RoomService = RoomService;
window.StudentService = StudentService;
window.ActivityService = ActivityService;
window.QuizService = QuizService;
window.MaterialService = MaterialService;