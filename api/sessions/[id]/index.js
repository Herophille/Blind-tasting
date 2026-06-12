const supabase = require('../../../lib/supabase');
const setCors = require('../../../lib/cors');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!supabase) return res.status(503).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars' });

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Not found' });
    return res.json(data.data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
