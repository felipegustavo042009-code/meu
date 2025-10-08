const supabase = require('../config/supabase');

exports.createAtividade = async (req, res) => {
  try {
    const { sala_id, titulo, descricao, tipo } = req.body;

    const { data, error } = await supabase
      .from('atividades')
      .insert([{ sala_id, titulo, descricao, tipo }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAtividadesBySala = async (req, res) => {
  try {
    const { sala_id } = req.params;

    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('sala_id', sala_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAtividade = async (req, res) => {
  try {
    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: "Atividade deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
