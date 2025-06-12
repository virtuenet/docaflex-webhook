const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// ULTRA-MINIMAL CHALLENGE-FOCUSED WEBHOOK v1.0.5
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

console.log('🚀 Ultra-Fast Challenge Webhook v1.0.5 - Challenge Response ONLY');
console.log('🔐 Encrypt key set:', !!LARK_ENCRYPT_KEY);
console.log('🔑 Encrypt key preview:', LARK_ENCRYPT_KEY ? LARK_ENCRYPT_KEY.substring(0, 8) + '...' : 'NOT_SET');

// Raw body parsing for ALL routes
app.use(express.raw({ 
  type: '*/*',
  limit: '10mb'
}));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Lightning-fast decryption - ONLY Method 1 (most common)
function quickDecrypt(encryptedData) {
  if (!LARK_ENCRYPT_KEY) return null;
  
  try {
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedData.trim(), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
}

// ULTRA-FAST CHALLENGE HANDLER
function handleChallenge(req, res) {
  const start = Date.now();
  
  try {
    let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    let data = null;
    
    // Try JSON first (fastest)
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      // Try decrypt (if needed)
      data = quickDecrypt(bodyText);
    }
    
    // Extract challenge IMMEDIATELY
    const challenge = data?.CHALLENGE || data?.challenge;
    
    if (challenge) {
      console.log(`🔐 CHALLENGE: ${challenge} (${Date.now() - start}ms)`);
      
      // IMMEDIATE PLAIN TEXT RESPONSE
      res.set('Content-Type', 'text/plain');
      res.status(200).send(challenge);
      return;
    }
    
    // No challenge found - basic response
    console.log(`📝 No challenge found (${Date.now() - start}ms)`);
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
}

// DEBUG ENDPOINT - Logs everything Lark sends
function debugHandler(req, res) {
  console.log('\n🔍 ========== DEBUG REQUEST ==========');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌐 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  
  let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  console.log('📦 Body Type:', typeof req.body);
  console.log('📦 Body Length:', bodyText.length);
  console.log('📦 Raw Body:', bodyText);
  
  // Try to parse/decrypt
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
    console.log('✅ Parsed as JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('❌ Not JSON, trying decrypt...');
    parsed = quickDecrypt(bodyText);
    if (parsed) {
      console.log('✅ Decrypted:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('❌ Decryption failed');
    }
  }
  
  // Check for challenge
  const challenge = parsed?.CHALLENGE || parsed?.challenge;
  console.log('🔐 Challenge found:', challenge || 'NONE');
  console.log('🔍 ========== END DEBUG ==========\n');
  
  // Respond with plain text if challenge, JSON otherwise
  if (challenge) {
    res.set('Content-Type', 'text/plain');
    res.status(200).send(challenge);
  } else {
    res.status(200).json({ 
      status: 'debug-ok', 
      received: !!bodyText,
      parsed: !!parsed,
      challenge: !!challenge
    });
  }
}

// ALL webhook endpoints use the same ultra-fast handler
app.post('/webhook/lark', handleChallenge);
app.post('/api/webhooks/lark-verify', handleChallenge);
app.post('/', handleChallenge); // Catch-all

// DEBUG endpoint for testing
app.post('/debug', debugHandler);
app.get('/debug', (req, res) => {
  res.json({
    message: 'POST to this endpoint to see debug info',
    url: 'https://docaflex-webhook-production.up.railway.app/debug'
  });
});

// Simple health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ultra-Fast Challenge Webhook v1.0.5',
    timestamp: new Date().toISOString(),
    encrypt_key_set: !!LARK_ENCRYPT_KEY,
    endpoints: {
      main: '/webhook/lark',
      verify: '/api/webhooks/lark-verify',  
      debug: '/debug'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ultra-Fast Challenge Webhook v1.0.5 running on port ${PORT}`);
  console.log(`📡 Main URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
  console.log(`🔍 Debug URL: https://docaflex-webhook-production.up.railway.app/debug`);
  console.log(`⚡ Optimized for CHALLENGE responses only`);
});
