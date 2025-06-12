const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Lark app credentials from environment variables
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a8cecb6af438d02f';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'ZsI84qt2SA3L1PedniU5ShMbQqtpUrql';
const LARK_VERIFICATION_TOKEN = process.env.LARK_VERIFICATION_TOKEN || process.env.VERIFICATION_TOKEN;
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

// Middleware to parse JSON and raw body
app.use('/webhook/lark', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/lark-verify', express.raw({ type: 'application/json' }));
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

// Function to decrypt Lark webhook data
function decryptLarkData(encryptedData) {
  if (!LARK_ENCRYPT_KEY) {
    console.log('⚠️ LARK_ENCRYPT_KEY not set, skipping decryption');
    return encryptedData;
  }
  
  try {
    const key = Buffer.from(LARK_ENCRYPT_KEY, 'utf8');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return null;
  }
}

// Function to verify Lark webhook signature
function verifyLarkSignature(timestamp, nonce, body, signature) {
  if (!LARK_VERIFICATION_TOKEN) {
    console.log('⚠️ VERIFICATION_TOKEN not set, skipping signature verification');
    return true;
  }
  
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const stringToSign = timestamp + nonce + LARK_VERIFICATION_TOKEN + bodyStr;
  const computedSignature = crypto.createHash('sha256').update(stringToSign, 'utf8').digest('hex');
  
  console.log('🔐 Signature verification:', {
    timestamp,
    nonce,
    expectedSignature: signature,
    computedSignature
  });
  
  return computedSignature === signature;
}

// Main webhook handler function
function handleLarkWebhook(req, res) {
  console.log('🔐 Received webhook request');
  console.log('🔐 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    let webhookData;
    
    // Handle raw body (potentially encrypted)
    if (Buffer.isBuffer(req.body)) {
      const bodyStr = req.body.toString('utf8');
      console.log('📦 Raw body:', bodyStr.substring(0, 100) + '...');
      
      // Try to parse as JSON first
      try {
        webhookData = JSON.parse(bodyStr);
      } catch (e) {
        // If JSON parsing fails, try to decrypt
        console.log('🔓 Attempting to decrypt data...');
        webhookData = decryptLarkData(bodyStr);
        if (!webhookData) {
          return res.status(400).json({ error: 'Failed to decrypt webhook data' });
        }
      }
    } else {
      webhookData = req.body;
    }
    
    console.log('📧 Parsed webhook data:', JSON.stringify(webhookData, null, 2));
    
    // Handle Lark webhook URL verification challenge (uppercase CHALLENGE)
    if (webhookData && webhookData.CHALLENGE) {
      console.log('🔐 URL verification received (uppercase):', webhookData.CHALLENGE);
      return res.status(200).send(webhookData.CHALLENGE);
    }
    
    // Handle Lark webhook URL verification challenge (lowercase challenge)
    if (webhookData && webhookData.challenge) {
      console.log('🔐 URL verification received (lowercase):', webhookData.challenge);
      return res.status(200).send(webhookData.challenge);
    }
    
    // Handle URL verification with type field
    if (webhookData && webhookData.type === 'url_verification') {
      const challenge = webhookData.CHALLENGE || webhookData.challenge;
      console.log('🔐 URL verification with type:', challenge);
      
      if (challenge) {
        return res.status(200).send(challenge);
      }
    }

    // Handle actual webhook events
    console.log('📧 Received webhook event:', JSON.stringify(webhookData, null, 2));
    
    // Verify the request signature for actual events
    const timestamp = req.headers['x-lark-request-timestamp'];
    const nonce = req.headers['x-lark-request-nonce'];
    const signature = req.headers['x-lark-signature'];
    
    if (timestamp && nonce && signature) {
      const isValid = verifyLarkSignature(timestamp, nonce, req.body, signature);
      if (!isValid) {
        console.error('❌ Invalid signature for webhook event');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Event signature verified successfully');
    }
    
    return res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      event_type: webhookData.header?.event_type || 'unknown'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Lark webhook verification endpoint
app.post('/webhook/lark', handleLarkWebhook);

// Alternative endpoint for testing
app.post('/api/webhooks/lark-verify', handleLarkWebhook);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DocaFlex Lark Webhook Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      primary: '/webhook/lark',
      alternative: '/api/webhooks/lark-verify'
    },
    config: {
      app_id: LARK_APP_ID,
      verification_token_set: !!LARK_VERIFICATION_TOKEN,
      encrypt_key_set: !!LARK_ENCRYPT_KEY
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
  console.log(`🔐 Verification token set: ${!!LARK_VERIFICATION_TOKEN}`);
  console.log(`🔐 Encrypt key set: ${!!LARK_ENCRYPT_KEY}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
});
