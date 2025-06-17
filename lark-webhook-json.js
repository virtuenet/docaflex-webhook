const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Lark Webhook - JSON Response Format');

// Raw body parsing
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// MAIN WEBHOOK - JSON Response Format
app.post('/webhook/lark', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  console.log('\n=== LARK WEBHOOK REQUEST ===');
  console.log('📥 Time:', new Date().toISOString());
  console.log('📦 Body length:', body.length);
  console.log('📦 Body content:', body);
  
  try {
    const data = JSON.parse(body);
    console.log('✅ Parsed JSON:', JSON.stringify(data, null, 2));
    
    // Check for encrypted data first
    if (data.encrypt) {
      console.log('🔐 Encrypted data detected');
      console.log('🔐 Encrypt field:', data.encrypt);
      
      // Return JSON response for encrypted challenge
      console.log('🔄 Returning JSON challenge response for encrypted data');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ challenge: 'test_challenge_12345' }));
      return;
    }
    
    // Check for plain challenge
    const challenge = data.challenge || data.CHALLENGE || data.Challenge;
    if (challenge) {
      console.log('🎯 Plain challenge found:', challenge);
      // Return the challenge in JSON format
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ challenge: String(challenge) }));
      return;
    }
    
    // Check for URL verification
    if (data.type === 'url_verification') {
      console.log('🔗 URL verification request');
      if (data.challenge) {
        console.log('🎯 URL verification challenge:', data.challenge);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ challenge: String(data.challenge) }));
        return;
      }
    }
    
    // Regular event - return JSON success
    console.log('📨 Regular event received');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', message: 'Event received' }));
    
  } catch (error) {
    console.log('❌ JSON parse failed:', error.message);
    console.log('🔄 Treating as non-JSON request');
    
    // If not JSON, return JSON error response
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', message: 'Request processed' }));
  }
  
  console.log('=== END REQUEST ===\n');
});

// Copy for API endpoint
app.post('/api/webhooks/lark-verify', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  try {
    const data = JSON.parse(body);
    const challenge = data.challenge || data.CHALLENGE || data.Challenge;
    
    if (challenge) {
      console.log('✅ API challenge:', challenge);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ challenge: String(challenge) }));
      return;
    }
  } catch (e) {}
  
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ status: 'ok' }));
});

// Root endpoint
app.post('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ status: 'ok' }));
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Lark Webhook - JSON Response Format',
    timestamp: Date.now(),
    endpoints: ['/webhook/lark', '/api/webhooks/lark-verify']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lark JSON webhook running on 0.0.0.0:${PORT}`);
  console.log(`📡 Ready for ngrok: ngrok http ${PORT}`);
}); 