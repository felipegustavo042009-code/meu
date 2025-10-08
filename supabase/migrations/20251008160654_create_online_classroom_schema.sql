/*
  # Schema para Sistema de Sala Online

  ## Descrição
  Criação de toda estrutura de banco de dados para sistema de sala online
  com tempo real entre professor e alunos.

  ## 1. Novas Tabelas

  ### `salas`
  Armazena informações das salas criadas pelos professores
  - `id` (uuid, primary key)
  - `codigo` (text, unique) - Código único da sala para entrada dos alunos
  - `nome` (text) - Nome da sala
  - `professor_id` (uuid) - ID do professor que criou a sala
  - `ativa` (boolean) - Se a sala está ativa
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### `alunos_conectados`
  Registra alunos conectados em cada sala (tempo real)
  - `id` (uuid, primary key)
  - `sala_id` (uuid, foreign key) - Referência à sala
  - `nome` (text) - Nome do aluno
  - `conectado` (boolean) - Se está conectado agora
  - `foto_presenca` (text) - URL da foto de presença
  - `presenca_confirmada` (boolean) - Se confirmou presença
  - `mao_levantada` (boolean) - Se está com a mão levantada
  - `created_at` (timestamptz) - Quando entrou na sala
  - `updated_at` (timestamptz) - Última atualização

  ### `perguntas_alunos`
  Perguntas feitas pelos alunos durante a aula
  - `id` (uuid, primary key)
  - `sala_id` (uuid, foreign key) - Referência à sala
  - `aluno_id` (uuid, foreign key) - Referência ao aluno conectado
  - `aluno_nome` (text) - Nome do aluno (cache)
  - `pergunta` (text) - Texto da pergunta
  - `respondida` (boolean) - Se foi respondida pelo professor
  - `created_at` (timestamptz) - Quando foi feita

  ### `atividades`
  Atividades criadas pelo professor
  - `id` (uuid, primary key)
  - `sala_id` (uuid, foreign key) - Referência à sala
  - `titulo` (text) - Título da atividade
  - `descricao` (text) - Descrição detalhada
  - `tipo` (text) - Tipo: 'tarefa', 'exercicio', 'leitura'
  - `created_at` (timestamptz) - Quando foi criada

  ### `quizzes`
  Quizzes interativos criados pelo professor
  - `id` (uuid, primary key)
  - `sala_id` (uuid, foreign key) - Referência à sala
  - `titulo` (text) - Título do quiz
  - `pergunta` (text) - Pergunta do quiz
  - `opcoes` (jsonb) - Array de opções [{"texto": "...", "correta": true/false}]
  - `ativo` (boolean) - Se está ativo para resposta
  - `created_at` (timestamptz) - Quando foi criado

  ### `respostas_quiz`
  Respostas dos alunos aos quizzes
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key) - Referência ao quiz
  - `aluno_id` (uuid, foreign key) - Referência ao aluno conectado
  - `aluno_nome` (text) - Nome do aluno (cache)
  - `resposta_index` (integer) - Índice da opção escolhida
  - `correta` (boolean) - Se acertou
  - `created_at` (timestamptz) - Quando respondeu

  ### `materiais`
  Materiais de apoio enviados pelo professor
  - `id` (uuid, primary key)
  - `sala_id` (uuid, foreign key) - Referência à sala
  - `titulo` (text) - Título do material
  - `descricao` (text) - Descrição
  - `url` (text) - URL do arquivo ou link
  - `tipo` (text) - Tipo: 'pdf', 'link', 'video', 'imagem'
  - `created_at` (timestamptz) - Quando foi enviado

  ## 2. Segurança (RLS)
  - Todas as tabelas terão RLS habilitado
  - Políticas permissivas para permitir leitura/escrita durante desenvolvimento
  - Em produção, adicionar autenticação apropriada

  ## 3. Índices
  - Índices em chaves estrangeiras para melhor performance
  - Índice em `salas.codigo` para busca rápida

  ## 4. Triggers
  - Trigger para atualizar `updated_at` automaticamente
*/

-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela: salas
CREATE TABLE IF NOT EXISTS salas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  professor_id uuid,
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salas_codigo ON salas(codigo);

CREATE TRIGGER update_salas_updated_at
  BEFORE UPDATE ON salas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela: alunos_conectados
CREATE TABLE IF NOT EXISTS alunos_conectados (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id uuid REFERENCES salas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  conectado boolean DEFAULT true,
  foto_presenca text,
  presenca_confirmada boolean DEFAULT false,
  mao_levantada boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alunos_sala ON alunos_conectados(sala_id);
CREATE INDEX IF NOT EXISTS idx_alunos_mao_levantada ON alunos_conectados(sala_id, mao_levantada);

CREATE TRIGGER update_alunos_conectados_updated_at
  BEFORE UPDATE ON alunos_conectados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela: perguntas_alunos
CREATE TABLE IF NOT EXISTS perguntas_alunos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id uuid REFERENCES salas(id) ON DELETE CASCADE NOT NULL,
  aluno_id uuid REFERENCES alunos_conectados(id) ON DELETE CASCADE NOT NULL,
  aluno_nome text NOT NULL,
  pergunta text NOT NULL,
  respondida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perguntas_sala ON perguntas_alunos(sala_id);

-- Tabela: atividades
CREATE TABLE IF NOT EXISTS atividades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id uuid REFERENCES salas(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text DEFAULT 'tarefa',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atividades_sala ON atividades(sala_id);

-- Tabela: quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id uuid REFERENCES salas(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_sala ON quizzes(sala_id);

-- Tabela: respostas_quiz
CREATE TABLE IF NOT EXISTS respostas_quiz (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  aluno_id uuid REFERENCES alunos_conectados(id) ON DELETE CASCADE NOT NULL,
  aluno_nome text NOT NULL,
  resposta_index integer NOT NULL,
  correta boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_respostas_quiz ON respostas_quiz(quiz_id);

-- Tabela: materiais
CREATE TABLE IF NOT EXISTS materiais (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sala_id uuid REFERENCES salas(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  url text NOT NULL,
  tipo text DEFAULT 'link',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materiais_sala ON materiais(sala_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_conectados ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (permite tudo)
-- Em produção, substituir por políticas mais restritivas com autenticação

CREATE POLICY "Permitir tudo em salas"
  ON salas FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em alunos_conectados"
  ON alunos_conectados FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em perguntas_alunos"
  ON perguntas_alunos FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em atividades"
  ON atividades FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em quizzes"
  ON quizzes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em respostas_quiz"
  ON respostas_quiz FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em materiais"
  ON materiais FOR ALL
  USING (true)
  WITH CHECK (true);