const supabase = require('../config/supabase');

exports.connectAluno = async (req, res) => {
  try {
    const { sala_id, nome } = req.body;

    const { data, error } = await supabase
      .from('alunos_conectados')
      .insert([{
        sala_id,
        nome,
        conectado: true,
        presenca_confirmada: false,
        mao_levantada: false
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAlunosConectados = async (req, res) => {
  try {
    const { sala_id } = req.params;

    const { data, error } = await supabase
      .from('alunos_conectados')
      .select('*')
      .eq('sala_id', sala_id)
      .eq('conectado', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAlunoById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alunos_conectados')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) return res.status(404).json({ message: "Aluno not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAluno = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alunos_conectados')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) return res.status(404).json({ message: "Aluno not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disconnectAluno = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alunos_conectados')
      .update({ conectado: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmarPresenca = async (req, res) => {
  try {
    const { id } = req.params;
    const { foto_presenca } = req.body;

    const { data, error } = await supabase
      .from('alunos_conectados')
      .update({
        presenca_confirmada: true,
        foto_presenca: foto_presenca || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.levantarMao = async (req, res) => {
  try {
    const { id } = req.params;
    const { levantar } = req.body;

    const { data, error } = await supabase
      .from('alunos_conectados')
      .update({ mao_levantada: levantar })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
