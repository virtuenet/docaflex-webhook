const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Lark app credentials (no encryption)
const LARK_VERIFICATION_TOKEN = 'towpHcKvdzLz0qcMQpy1dg6kOJOpO2aF';

console.log('🚀 Lark Webhook - Simple No Encryption (Railway)');
console.log('🔧 Verification Token configured');

// Parse JSON body for webhook requests
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// MAIN WEBHOOK ENDPOINT - Simple No Encryption
app.post('/webhook/lark', (req, res) => {
  console.log('\n=== LARK WEBHOOK SIMPLE (RAILWAY) ===');
  console.log('📥 Time:', new Date().toISOString());
  console.log('📦 Headers:', req.headers);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const data = req.body;
    
    // Verify token if present
    if (data.token && data.token !== LARK_VERIFICATION_TOKEN) {
      console.log('❌ Invalid verification token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Handle URL verification challenge
    if (data.type === 'url_verification' && data.challenge) {
      console.log('🔗 URL verification request');
      console.log('🎯 Challenge:', data.challenge);
      console.log('✅ Token verified:', data.token === LARK_VERIFICATION_TOKEN);
      
      // Return challenge as required by Lark
      const response = { challenge: data.challenge };
      console.log('📤 Responding with:', JSON.stringify(response));
      
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json(response);
      return;
    }
    
    // Handle regular event callbacks
    if (data.event) {
      console.log('📨 Event callback received');
      console.log('📋 Event type:', data.event.type || 'unknown');
      console.log('📋 Event data:', JSON.stringify(data.event, null, 2));
      
      // Return success response for events
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json({ code: 0, msg: 'success' });
      return;
    }
    
    // Handle any other requests
    console.log('📨 Other request received');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ code: 0, msg: 'received' });
    
  } catch (error) {
    console.log('❌ Error processing request:', error.message);
    console.log('🔄 Returning error response');
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ code: 1, msg: 'error', error: error.message });
  }
  
  console.log('=== END WEBHOOK ===\n');
});

// Alternative endpoint
app.post('/api/webhooks/lark-verify', (req, res) => {
  console.log('\n=== API ENDPOINT (RAILWAY) ===');
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  
  const data = req.body;
  
  if (data.type === 'url_verification' && data.challenge) {
    const response = { challenge: data.challenge };
    console.log('📤 API responding with:', JSON.stringify(response));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(response);
    return;
  }
  
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({ code: 0, msg: 'success' });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Lark Webhook - Simple No Encryption (Railway)',
    timestamp: Date.now(),
    version: 'SIMPLE-RAILWAY-2024',
    endpoints: ['/webhook/lark', '/api/webhooks/lark-verify'],
    features: [
      'Plain Text Challenge Verification',
      'No Encryption Required',
      'Fast Response Time',
      'Event Callback Handling',
      'JSON Response Format',
      'Railway Deployment'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', encryption: 'disabled', platform: 'railway' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple Lark Webhook (Railway) running on 0.0.0.0:${PORT}`);
  console.log(`📡 Ready for Lark!`);
  console.log(`🔧 Implementation: Simple No Encryption`);
  console.log(`🎯 Main endpoint: /webhook/lark`);
});
