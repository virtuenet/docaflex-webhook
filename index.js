const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Lark app credentials from environment variables
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a7bac77b4e7e8013';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'J9F6gP8Rv62nDpqTZU5pDfPL6pOWWcZh';
const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN || 'v_defaulttoken';

// Middleware to parse JSON
app.use(express.json());

// CORS for testing
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

// Function to verify Lark webhook signature
function verifyLarkSignature(timestamp, nonce, body, signature) {
  if (!VERIFICATION_TOKEN) {
    console.log('⚠️ VERIFICATION_TOKEN not set, skipping signature verification');
    return true;
  }
  
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const stringToSign = timestamp + nonce + VERIFICATION_TOKEN + bodyStr;
  const computedSignature = crypto.createHash('sha256').update(stringToSign, 'utf8').digest('hex');
  
  console.log('🔐 Signature verification:', {
    timestamp,
    nonce,
    expectedSignature: signature,
    computedSignature
  });
  
  return computedSignature === signature;
}

// Lark webhook verification endpoint
app.post('/webhook/lark', (req, res) => {
  console.log('🔐 Received webhook request:', JSON.stringify(req.body, null, 2));
  console.log('🔐 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Handle Lark webhook URL verification challenge
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL verification received:', req.body.challenge);
      
      // Return challenge as plain text
      return res.status(200).send(req.body.challenge);
    }

    // Handle legacy challenge format
    if (req.body && req.body.challenge && !req.body.type) {
      console.log('🔐 Legacy challenge received:', req.body.challenge);
      return res.status(200).send(req.body.challenge);
    }

    // Handle actual webhook events
    console.log('📧 Received webhook event:', JSON.stringify(req.body, null, 2));
    
    return res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      event_type: req.body.header?.event_type || 'unknown'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Alternative endpoint for testing
app.post('/api/webhooks/lark-verify', (req, res) => {
  console.log('🔐 Alternative endpoint - Received webhook request:', JSON.stringify(req.body, null, 2));
  console.log('🔐 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Handle Lark webhook URL verification challenge
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL verification received:', req.body.challenge);
      
      // Return challenge as plain text
      return res.status(200).send(req.body.challenge);
    }

    // Handle legacy challenge format  
    if (req.body && req.body.challenge && !req.body.type) {
      console.log('🔐 Legacy challenge received:', req.body.challenge);
      return res.status(200).send(req.body.challenge);
    }

    // For any other request, return success
    return res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DocaFlex Lark Webhook Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      primary: '/webhook/lark',
      alternative: '/api/webhooks/lark-verify'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 DocaFlex Lark Webhook Server running on port ${port}`);
  console.log(`📍 Primary webhook endpoint: /webhook/lark`);
  console.log(`📍 Alternative webhook endpoint: /api/webhooks/lark-verify`);
  console.log(`🔐 App ID: ${LARK_APP_ID}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
});
