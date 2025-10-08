const supabase = require('../config/supabase');

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

exports.createSala = async (req, res) => {
  try {
    const { nome, professor_id } = req.body;
    const codigo = generateRoomCode();

    const { data, error } = await supabase
      .from('salas')
      .insert([{ nome, professor_id, codigo, ativa: true }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSalas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSalaById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) return res.status(404).json({ message: "Sala not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSalaByCodigo = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .eq('codigo', req.params.codigo)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSala = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salas')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) return res.status(404).json({ message: "Sala not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSala = async (req, res) => {
  try {
    const { error } = await supabase
      .from('salas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: "Sala deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAlunosConectados = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alunos_conectados')
      .select('*')
      .eq('sala_id', req.params.sala_id)
      .eq('conectado', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
