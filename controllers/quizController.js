const supabase = require('../config/supabase');

exports.createQuiz = async (req, res) => {
  try {
    const { sala_id, titulo, pergunta, opcoes } = req.body;

    const { data, error } = await supabase
      .from('quizzes')
      .insert([{
        sala_id,
        titulo,
        pergunta,
        opcoes: opcoes || [],
        ativo: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizzesBySala = async (req, res) => {
  try {
    const { sala_id } = req.params;

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('sala_id', sala_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizAtivo = async (req, res) => {
  try {
    const { sala_id } = req.params;

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('sala_id', sala_id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.desativarQuiz = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ ativo: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.responderQuiz = async (req, res) => {
  try {
    const { quiz_id, aluno_id, aluno_nome, resposta_index, correta } = req.body;

    const { data, error } = await supabase
      .from('respostas_quiz')
      .insert([{
        quiz_id,
        aluno_id,
        aluno_nome,
        resposta_index,
        correta
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRespostasQuiz = async (req, res) => {
  try {
    const { quiz_id } = req.params;

    const { data, error } = await supabase
      .from('respostas_quiz')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
