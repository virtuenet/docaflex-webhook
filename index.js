const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Simple Webhook v1.0.15 - Railway Fix');
console.log('📡 Port:', PORT);

// Raw body parsing
app.use(express.raw({ type: '*/*', limit: '10mb' }));

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

// SIMPLE WEBHOOK HANDLER
function handleWebhook(req, res) {
  try {
    let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    
    // Try to parse as JSON
    let data = null;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      // Not JSON, that's ok
    }
    
    // Look for challenge in common places
    let challenge = null;
    if (data) {
      challenge = data.challenge || data.CHALLENGE || data.Challenge;
    }
    
    // If challenge found, return it immediately
    if (challenge) {
      console.log('✅ Challenge found:', challenge);
      res.set('Content-Type', 'text/plain');
      res.status(200).send(String(challenge));
      return;
    }
    
    // No challenge, just return OK
    console.log('📨 Event received');
    res.set('Content-Type', 'text/plain');
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.set('Content-Type', 'text/plain');
    res.status(200).send('OK');
  }
}

// ENDPOINTS
app.post('/webhook/lark', handleWebhook);
app.post('/api/webhooks/lark-verify', handleWebhook);
app.post('/debug', handleWebhook);
app.post('/', handleWebhook);

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple Webhook v1.0.15',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.15',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple Webhook v1.0.15 running on 0.0.0.0:${PORT}`);
  console.log(`📡 URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
