# Guia de Integração - Sistema de Sala Online com Supabase

## Visão Geral

O sistema foi migrado do MongoDB para Supabase com suporte completo a tempo real. Nenhum dado é mais armazenado em localStorage ou sessionStorage.

## Estrutura do Banco de Dados

### Tabelas Principais:
- `salas` - Salas criadas pelo professor
- `alunos_conectados` - Alunos conectados em cada sala (tempo real)
- `perguntas_alunos` - Perguntas dos alunos
- `atividades` - Atividades criadas
- `quizzes` - Quizzes interativos
- `respostas_quiz` - Respostas dos alunos aos quizzes
- `materiais` - Materiais de apoio

## Como Usar o Tempo Real

### 1. Painel do Professor

No arquivo que gerencia o painel do professor, adicione:

```javascript
let currentSalaId = null;

function iniciarPainelProfessor(salaId) {
  currentSalaId = salaId;

  RealtimeManager.subscribeToAlunos(salaId, (payload) => {
    console.log('Mudança em alunos:', payload);
    atualizarListaAlunos();
  });

  RealtimeManager.subscribeToPerguntas(salaId, (payload) => {
    console.log('Nova pergunta:', payload);
    atualizarListaPerguntas();
  });

  RealtimeManager.subscribeToQuizzes(salaId, (payload) => {
    console.log('Mudança em quiz:', payload);
    atualizarQuizzes();
  });

  RealtimeManager.subscribeToAtividades(salaId, (payload) => {
    console.log('Nova atividade:', payload);
    atualizarAtividades();
  });

  RealtimeManager.subscribeToMateriais(salaId, (payload) => {
    console.log('Novo material:', payload);
    atualizarMateriais();
  });
}

async function atualizarListaAlunos() {
  const alunos = await api.alunos.getBySala(currentSalaId);
}

function sairDaSala() {
  RealtimeManager.unsubscribeAll();
  currentSalaId = null;
}
```

### 2. Sala do Aluno

No arquivo que gerencia a sala do aluno, adicione:

```javascript
let currentAlunoId = null;
let currentSalaId = null;

async function entrarNaSala(codigo, nome) {
  const sala = await api.salas.getByCodigo(codigo);
  currentSalaId = sala.id;

  const aluno = await api.alunos.connect({
    sala_id: sala.id,
    nome: nome
  });
  currentAlunoId = aluno.id;

  RealtimeManager.subscribeToQuizzes(sala.id, (payload) => {
    if (payload.eventType === 'INSERT') {
      mostrarNovoQuiz(payload.new);
    }
  });

  RealtimeManager.subscribeToAtividades(sala.id, (payload) => {
    if (payload.eventType === 'INSERT') {
      mostrarNovaAtividade(payload.new);
    }
  });

  RealtimeManager.subscribeToMateriais(sala.id, (payload) => {
    if (payload.eventType === 'INSERT') {
      mostrarNovoMaterial(payload.new);
    }
  });
}

async function levantarMao() {
  await api.alunos.levantarMao(currentAlunoId, true);
}

async function baixarMao() {
  await api.alunos.levantarMao(currentAlunoId, false);
}

async function enviarPergunta(pergunta) {
  await api.perguntas.create({
    sala_id: currentSalaId,
    aluno_id: currentAlunoId,
    aluno_nome: getNomeAluno(),
    pergunta: pergunta
  });
}

async function confirmarPresenca(fotoBase64) {
  await api.alunos.confirmarPresenca(currentAlunoId, fotoBase64);
}

function sairDaSala() {
  if (currentAlunoId) {
    api.alunos.disconnect(currentAlunoId);
  }
  RealtimeManager.unsubscribeAll();
  currentAlunoId = null;
  currentSalaId = null;
}
```

### 3. Sistema de Quiz

```javascript
async function criarQuiz(salaId, titulo, pergunta, opcoes) {
  const quiz = await api.quizzes.create({
    sala_id: salaId,
    titulo: titulo,
    pergunta: pergunta,
    opcoes: opcoes
  });

  RealtimeManager.subscribeToRespostasQuiz(quiz.id, (payload) => {
    console.log('Nova resposta:', payload.new);
    atualizarEstatisticasQuiz();
  });

  return quiz;
}

async function responderQuiz(quizId, respostaIndex, correta) {
  await api.quizzes.responder({
    quiz_id: quizId,
    aluno_id: currentAlunoId,
    aluno_nome: getNomeAluno(),
    resposta_index: respostaIndex,
    correta: correta
  });
}

async function encerrarQuiz(quizId) {
  await api.quizzes.desativar(quizId);
}
```

## Fluxo Completo de Uso

### Professor:

1. Criar sala: `api.salas.create({ nome: "Matemática", professor_id: "123" })`
2. Iniciar subscriptions com `iniciarPainelProfessor(salaId)`
3. Ver alunos conectados em tempo real
4. Criar atividades/quizzes/materiais
5. Ver perguntas e mãos levantadas em tempo real

### Aluno:

1. Entrar na sala: `entrarNaSala(codigo, nome)`
2. Confirmar presença com foto
3. Receber atualizações de atividades/quizzes/materiais
4. Levantar mão
5. Fazer perguntas
6. Responder quizzes

## APIs Disponíveis

Veja o arquivo `public/js/api.js` para lista completa de endpoints.

## Importante

- NUNCA use localStorage ou sessionStorage
- SEMPRE use as APIs do Supabase via backend
- SEMPRE limpe subscriptions ao sair: `RealtimeManager.unsubscribeAll()`
- Tempo real funciona automaticamente através do RealtimeManager
