const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const HTML_FILE = path.join(__dirname, 'blind_tasting.html');
const PORT = 8080;

function load() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function save(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions));
}

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  });
}

function send(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  });
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    });
    return res.end();
  }

  // Serve HTML
  if (method === 'GET' && (pathname === '/' || pathname === '/blind_tasting.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(HTML_FILE));
  }

  const sessions = load();

  // GET /api/sessions
  if (method === 'GET' && pathname === '/api/sessions') {
    return send(res, sessions);
  }

  // POST /api/sessions
  if (method === 'POST' && pathname === '/api/sessions') {
    const session = await readBody(req);
    sessions.push(session);
    save(sessions);
    return send(res, session, 201);
  }

  // /api/sessions/:id
  const mSession = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (mSession) {
    const id = mSession[1];
    const idx = sessions.findIndex(s => s.id === id);
    if (method === 'GET') {
      if (idx === -1) return send(res, { error: 'Not found' }, 404);
      return send(res, sessions[idx]);
    }
    if (method === 'DELETE') {
      if (idx === -1) return send(res, { error: 'Not found' }, 404);
      sessions.splice(idx, 1);
      save(sessions);
      return send(res, { ok: true });
    }
  }

  // PUT /api/sessions/:id/responses/:tasterId
  const mResponse = pathname.match(/^\/api\/sessions\/([^/]+)\/responses\/([^/]+)$/);
  if (mResponse && method === 'PUT') {
    const [, sessionId, tasterId] = mResponse;
    const data = await readBody(req);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return send(res, { error: 'Not found' }, 404);
    if (!session.responses) session.responses = [];
    const existing = session.responses.find(r => r.tasterId === tasterId);
    if (existing) {
      if (data.tasterName !== undefined) existing.tasterName = data.tasterName;
      if (data.answers !== undefined) existing.answers = data.answers;
      if (data.submitted !== undefined) existing.submitted = data.submitted;
    } else {
      session.responses.push({ tasterId, ...data });
    }
    save(sessions);
    return send(res, session);
  }

  // POST /api/sessions/:id/score
  const mScore = pathname.match(/^\/api\/sessions\/([^/]+)\/score$/);
  if (mScore && method === 'POST') {
    const data = await readBody(req);
    const session = sessions.find(s => s.id === mScore[1]);
    if (!session) return send(res, { error: 'Not found' }, 404);
    const response = session.responses && session.responses.find(r => r.tasterId === data.tasterId);
    if (response) {
      response.scored = true;
      if (!response.answers) response.answers = {};
      if (!response.answers[data.glassId]) response.answers[data.glassId] = {};
      response.answers[data.glassId][data.field] = data.val;
    }
    save(sessions);
    return send(res, session);
  }

  send(res, { error: 'Not found' }, 404);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Blind Tasting → http://0.0.0.0:${PORT}`);
});
