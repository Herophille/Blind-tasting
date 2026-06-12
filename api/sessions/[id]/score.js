const supabase = require('../../../lib/supabase');
const setCors = require('../../../lib/cors');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase) return res.status(503).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars' });

  const { id } = req.query;
  const { tasterId, glassId, field, val } = req.body;

  const { data: row, error } = await supabase
    .from('sessions')
    .select('data')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });

  const session = row.data;
  const response = session.responses && session.responses.find(r => r.tasterId === tasterId);
  if (response) {
    response.scored = true;
    if (!response.answers) response.answers = {};
    if (!response.answers[glassId]) response.answers[glassId] = {};
    response.answers[glassId][field] = val;
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ data: session })
    .eq('id', id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json(session);
};
