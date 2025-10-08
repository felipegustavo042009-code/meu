require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const salaRoutes = require('./routes/salaRoutes');
const alunoRoutes = require('./routes/alunoRoutes');
const participacaoRoutes = require('./routes/participacaoRoutes');
const perguntaAlunoRoutes = require('./routes/perguntaAlunoRoutes');
const quizRoutes = require('./routes/quizRoutes');
const materialRoutes = require('./routes/materialRoutes');

app.use('/api/salas', salaRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/participacoes', participacaoRoutes);
app.use('/api/perguntas-aluno', perguntaAlunoRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/materiais', materialRoutes);

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Supabase conectado`);
});
