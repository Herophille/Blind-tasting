const supabase = require('../../lib/supabase');
const setCors = require('../../lib/cors');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!supabase) return res.status(503).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sessions')
      .select('data')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data.map(r => r.data));
  }

  if (req.method === 'POST') {
    const session = req.body;
    const { error } = await supabase
      .from('sessions')
      .insert({ id: session.id, created_at: session.createdAt, data: session });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(session);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
