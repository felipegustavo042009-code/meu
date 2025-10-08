const supabase = require('../config/supabase');

exports.createMaterial = async (req, res) => {
  try {
    const { sala_id, titulo, descricao, url, tipo } = req.body;

    const { data, error } = await supabase
      .from('materiais')
      .insert([{ sala_id, titulo, descricao, url, tipo }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMateriaisBySala = async (req, res) => {
  try {
    const { sala_id } = req.params;

    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('sala_id', sala_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
