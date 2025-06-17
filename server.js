const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

console.log('🚀 Ultra-Fast Lark Webhook for Render.com');

// Minimal middleware for maximum speed
app.use(express.raw({ type: '*/*', limit: '1mb' }));

// Minimal CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  req.method === 'OPTIONS' ? res.sendStatus(200) : next();
});

// ULTRA-FAST WEBHOOK HANDLER
app.post('/webhook/lark', (req, res) => {
  // IMMEDIATE RESPONSE - No try/catch to save microseconds
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  // Fast JSON parse
  let data;
  try { data = JSON.parse(body); } catch { data = null; }
  
  // Fast challenge check
  const challenge = data?.challenge || data?.CHALLENGE || data?.Challenge;
  
  if (challenge) {
    console.log('✅', challenge);
    res.set('Content-Type', 'text/plain').status(200).send(String(challenge));
  } else {
    console.log('📨');
    res.set('Content-Type', 'text/plain').status(200).send('OK');
  }
});

// Copy endpoint for different paths
app.post('/api/webhooks/lark-verify', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  let data;
  try { data = JSON.parse(body); } catch { data = null; }
  const challenge = data?.challenge || data?.CHALLENGE || data?.Challenge;
  
  if (challenge) {
    console.log('✅', challenge);
    res.set('Content-Type', 'text/plain').status(200).send(String(challenge));
  } else {
    console.log('📨');
    res.set('Content-Type', 'text/plain').status(200).send('OK');
  }
});

app.post('/', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  let data;
  try { data = JSON.parse(body); } catch { data = null; }
  const challenge = data?.challenge || data?.CHALLENGE || data?.Challenge;
  
  if (challenge) {
    console.log('✅', challenge);
    res.set('Content-Type', 'text/plain').status(200).send(String(challenge));
  } else {
    console.log('📨');
    res.set('Content-Type', 'text/plain').status(200).send('OK');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Ultra-Fast Lark Webhook',
    endpoints: ['/webhook/lark', '/api/webhooks/lark-verify']
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
});

// Keep connections alive for speed
server.keepAliveTimeout = 5000;
server.headersTimeout = 6000; 