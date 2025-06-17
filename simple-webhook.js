const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Simple Test Webhook - Always Returns Challenge');

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

// Main webhook - ALWAYS return a challenge
app.post('/webhook/lark', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  console.log('📥 Request received');
  console.log('📦 Body length:', body.length);
  console.log('📦 Body content:', body.substring(0, 200) + '...');
  
  try {
    const data = JSON.parse(body);
    console.log('✅ Parsed JSON:', JSON.stringify(data, null, 2));
    
    // If encrypted, log it
    if (data.encrypt) {
      console.log('🔐 Encrypted field found');
      console.log('🔐 Encrypt length:', data.encrypt.length);
      console.log('🔐 Encrypt data:', data.encrypt);
    }
    
    // Check for any challenge
    const challenge = data.challenge || data.CHALLENGE || data.Challenge;
    if (challenge) {
      console.log('🎯 Plain challenge found:', challenge);
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    }
    
  } catch (e) {
    console.log('❌ JSON parse failed:', e.message);
  }
  
  // For testing: always return a fixed challenge if no challenge found
  console.log('🔄 No challenge found, returning test challenge');
  res.set('Content-Type', 'text/plain');
  res.status(200).send('test_challenge_response_12345');
});

// Copy for other endpoints
app.post('/api/webhooks/lark-verify', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  try {
    const data = JSON.parse(body);
    const challenge = data.challenge || data.CHALLENGE || data.Challenge;
    if (challenge) {
      console.log('✅ API challenge:', challenge);
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    }
  } catch (e) {}
  
  res.set('Content-Type', 'text/plain');
  res.status(200).send('test_challenge_response_12345');
});

app.post('/', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('test_challenge_response_12345');
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Simple Test Webhook',
    timestamp: Date.now()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple webhook running on 0.0.0.0:${PORT}`);
}); 