const API_BASE_URL = "http://localhost:3000";

async function fetchData(endpoint, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro na requisição: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
}

const api = {
  salas: {
    create: (sala) => fetchData("/api/salas", "POST", sala),
    getAll: () => fetchData("/api/salas"),
    getById: (id) => fetchData(`/api/salas/${id}`),
    getByCodigo: (codigo) => fetchData(`/api/salas/codigo/${codigo}`),
    getAlunosConectados: (salaId) => fetchData(`/api/salas/${salaId}/alunos`),
    update: (id, sala) => fetchData(`/api/salas/${id}`, "PUT", sala),
    delete: (id) => fetchData(`/api/salas/${id}`, "DELETE"),
  },

  alunos: {
    connect: (data) => fetchData("/api/alunos/connect", "POST", data),
    getBySala: (salaId) => fetchData(`/api/alunos/sala/${salaId}`),
    getById: (id) => fetchData(`/api/alunos/${id}`),
    update: (id, data) => fetchData(`/api/alunos/${id}`, "PUT", data),
    disconnect: (id) => fetchData(`/api/alunos/${id}/disconnect`, "PUT"),
    confirmarPresenca: (id, fotoPresenca) => fetchData(`/api/alunos/${id}/presenca`, "PUT", { foto_presenca: fotoPresenca }),
    levantarMao: (id, levantar) => fetchData(`/api/alunos/${id}/mao`, "PUT", { levantar }),
  },

  perguntas: {
    create: (pergunta) => fetchData("/api/perguntas-aluno", "POST", pergunta),
    getBySala: (salaId) => fetchData(`/api/perguntas-aluno/sala/${salaId}`),
    update: (id, data) => fetchData(`/api/perguntas-aluno/${id}`, "PUT", data),
    marcarRespondida: (id) => fetchData(`/api/perguntas-aluno/${id}/responder`, "PUT"),
  },

  atividades: {
    create: (atividade) => fetchData("/api/participacoes", "POST", atividade),
    getBySala: (salaId) => fetchData(`/api/participacoes/sala/${salaId}`),
    delete: (id) => fetchData(`/api/participacoes/${id}`, "DELETE"),
  },

  quizzes: {
    create: (quiz) => fetchData("/api/quizzes", "POST", quiz),
    getBySala: (salaId) => fetchData(`/api/quizzes/sala/${salaId}`),
    getAtivo: (salaId) => fetchData(`/api/quizzes/sala/${salaId}/ativo`),
    desativar: (id) => fetchData(`/api/quizzes/${id}/desativar`, "PUT"),
    responder: (resposta) => fetchData("/api/quizzes/responder", "POST", resposta),
    getRespostas: (quizId) => fetchData(`/api/quizzes/${quizId}/respostas`),
  },

  materiais: {
    create: (material) => fetchData("/api/materiais", "POST", material),
    getBySala: (salaId) => fetchData(`/api/materiais/sala/${salaId}`),
    delete: (id) => fetchData(`/api/materiais/${id}`, "DELETE"),
  },
};

window.api = api;
