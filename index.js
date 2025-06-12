const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// ASYNCHRONOUS WEBHOOK v1.0.6 - Immediate HTTP 200 + Background Processing
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

console.log('🚀 Asynchronous Webhook v1.0.6 - Immediate Response + Background Processing');
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

// Lightning-fast decryption
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

// ASYNCHRONOUS EVENT PROCESSOR - Runs in background
async function processEventAsync(eventData, requestId) {
  try {
    console.log(`🔄 [${requestId}] Starting async processing...`);
    
    const eventType = eventData.header?.event_type || eventData.type || 'unknown';
    const eventId = eventData.header?.event_id || 'no-id';
    
    console.log(`📨 [${requestId}] Processing event: ${eventType} (ID: ${eventId})`);
    
    // Simulate processing time (replace with actual business logic)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add your actual event processing logic here:
    switch (eventType) {
      case 'im.message.receive_v1':
        console.log(`💬 [${requestId}] Processing message event`);
        // Handle message events
        break;
      case 'contact.user.created_v3':
        console.log(`👤 [${requestId}] Processing user created event`);
        // Handle user creation events
        break;
      default:
        console.log(`❓ [${requestId}] Unknown event type: ${eventType}`);
    }
    
    console.log(`✅ [${requestId}] Event processed successfully`);
    
  } catch (error) {
    console.error(`❌ [${requestId}] Async processing error:`, error.message);
  }
}

// MAIN WEBHOOK HANDLER - Immediate Response + Async Processing
function handleWebhook(req, res) {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  try {
    let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    let data = null;
    
    // Parse/decrypt data
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      data = quickDecrypt(bodyText);
    }
    
    if (!data) {
      console.log(`❌ [${requestId}] No valid data received`);
      return res.status(200).json({ error: 'Invalid data' });
    }
    
    // STEP 1: Handle URL verification challenges IMMEDIATELY
    const challenge = data.CHALLENGE || data.challenge;
    
    if (challenge) {
      const elapsed = Date.now() - startTime;
      console.log(`🔐 [${requestId}] CHALLENGE: ${challenge} (${elapsed}ms)`);
      
      // IMMEDIATE PLAIN TEXT RESPONSE
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }
    
    // Handle URL verification with type field
    if (data.type === 'url_verification') {
      const verificationChallenge = data.CHALLENGE || data.challenge;
      if (verificationChallenge) {
        console.log(`🔐 [${requestId}] URL verification: ${verificationChallenge}`);
        res.set('Content-Type', 'text/plain');
        return res.status(200).send(verificationChallenge);
      }
    }
    
    // STEP 2: For actual events - respond immediately, process async
    const eventType = data.header?.event_type || data.type || 'unknown';
    const elapsed = Date.now() - startTime;
    
    console.log(`📨 [${requestId}] Event received: ${eventType} (${elapsed}ms)`);
    
    // IMMEDIATE SUCCESS RESPONSE (within 1 second requirement)
    res.status(200).json({
      status: 'received',
      request_id: requestId,
      timestamp: new Date().toISOString(),
      processing_time: elapsed + 'ms'
    });
    
    // STEP 3: Process event asynchronously in background
    setImmediate(() => {
      processEventAsync(data, requestId).catch(error => {
        console.error(`❌ [${requestId}] Background processing failed:`, error);
      });
    });
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [${requestId}] Webhook error (${elapsed}ms):`, error.message);
    
    // Even on error, respond quickly to prevent retries
    return res.status(200).json({ 
      error: 'Processing error',
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }
}

// DEBUG HANDLER - Enhanced with async pattern
function debugHandler(req, res) {
  const requestId = Date.now().toString(36);
  
  console.log(`\n🔍 ========== DEBUG REQUEST [${requestId}] ==========`);
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
  console.log(`🔍 ========== END DEBUG [${requestId}] ==========\n`);
  
  // Respond with plain text if challenge, JSON otherwise
  if (challenge) {
    res.set('Content-Type', 'text/plain');
    res.status(200).send(challenge);
  } else {
    res.status(200).json({ 
      status: 'debug-ok', 
      request_id: requestId,
      received: !!bodyText,
      parsed: !!parsed,
      challenge: !!challenge,
      timestamp: new Date().toISOString()
    });
  }
}

// WEBHOOK ENDPOINTS
app.post('/webhook/lark', handleWebhook);
app.post('/api/webhooks/lark-verify', handleWebhook);
app.post('/', handleWebhook); // Catch-all

// DEBUG ENDPOINTS
app.post('/debug', debugHandler);
app.get('/debug', (req, res) => {
  res.json({
    message: 'POST to this endpoint to see debug info',
    url: 'https://docaflex-webhook-production.up.railway.app/debug',
    note: 'This endpoint shows exactly what Lark sends'
  });
});

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Asynchronous Webhook v1.0.6 - Immediate Response + Background Processing',
    timestamp: new Date().toISOString(),
    encrypt_key_set: !!LARK_ENCRYPT_KEY,
    features: [
      'Immediate HTTP 200 responses (< 1 second)',
      'Asynchronous event processing',
      'Challenge verification support',
      'Debug endpoint for troubleshooting'
    ],
    endpoints: {
      main: '/webhook/lark',
      verify: '/api/webhooks/lark-verify',  
      debug: '/debug',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.6',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Asynchronous Webhook v1.0.6 running on port ${PORT}`);
  console.log(`📡 Main URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
  console.log(`🔍 Debug URL: https://docaflex-webhook-production.up.railway.app/debug`);
  console.log(`⚡ Features: Immediate responses + Background event processing`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
});
