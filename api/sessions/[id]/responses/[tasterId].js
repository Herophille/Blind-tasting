const supabase = require('../../../../lib/supabase');
const setCors = require('../../../../lib/cors');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { id, tasterId } = req.query;
  const update = req.body;

  const { data: row, error } = await supabase
    .from('sessions')
    .select('data')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });

  const session = row.data;
  if (!session.responses) session.responses = [];

  const existing = session.responses.find(r => r.tasterId === tasterId);
  if (existing) {
    if (update.tasterName !== undefined) existing.tasterName = update.tasterName;
    if (update.answers !== undefined) existing.answers = update.answers;
    if (update.submitted !== undefined) existing.submitted = update.submitted;
  } else {
    session.responses.push({ tasterId, ...update });
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ data: session })
    .eq('id', id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json(session);
};
