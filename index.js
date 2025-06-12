const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Deployment timestamp: 2024-06-12 10:58 - Complete webhook rewrite for encrypted challenges
// Lark app credentials from environment variables
const LARK_APP_ID = process.env.LARK_APP_ID || 'cli_a8cecb6af438d02f';
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || 'ZsI84qt2SA3L1PedniU5ShMbQqtpUrql';
const LARK_VERIFICATION_TOKEN = process.env.LARK_VERIFICATION_TOKEN || process.env.VERIFICATION_TOKEN;
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

console.log('🚀 Starting Enhanced Lark Webhook Server v1.0.4...');
console.log('📋 Configuration:', {
  app_id: LARK_APP_ID,
  verification_token_set: !!LARK_VERIFICATION_TOKEN,
  encrypt_key_set: !!LARK_ENCRYPT_KEY,
  encrypt_key_preview: LARK_ENCRYPT_KEY ? LARK_ENCRYPT_KEY.substring(0, 8) + '...' : 'NOT_SET'
});

// Middleware for raw body parsing - CRITICAL for encrypted data
app.use('/webhook/lark', express.raw({ 
  type: ['application/json', 'application/x-www-form-urlencoded', '*/*'],
  limit: '10mb'
}));

app.use('/api/webhooks/lark-verify', express.raw({ 
  type: ['application/json', 'application/x-www-form-urlencoded', '*/*'],
  limit: '10mb'
}));

// Regular JSON middleware for other endpoints
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

// Enhanced decryption function with multiple methods
function decryptLarkChallenge(encryptedData) {
  if (!LARK_ENCRYPT_KEY) {
    console.log('⚠️ LARK_ENCRYPT_KEY not set, cannot decrypt');
    return null;
  }

  const dataToDecrypt = typeof encryptedData === 'string' ? encryptedData.trim() : encryptedData.toString().trim();
  console.log('🔓 Attempting to decrypt data (length: ' + dataToDecrypt.length + ')');
  console.log('🔓 Data preview:', dataToDecrypt.substring(0, 100) + '...');

  // Method 1: Standard Lark AES-256-CBC with SHA256 hashed key
  try {
    console.log('🔄 Method 1: SHA256 hashed key with zero IV');
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 1 successful!');
    return parsed;
  } catch (error) {
    console.log('❌ Method 1 failed:', error.message);
  }

  // Method 2: Direct key without hashing
  try {
    console.log('🔄 Method 2: Direct key without hashing');
    const key = Buffer.from(LARK_ENCRYPT_KEY, 'utf8');
    
    // Ensure key is 32 bytes for AES-256
    const finalKey = key.length === 32 ? key : crypto.createHash('sha256').update(key).digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', finalKey, iv);
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 2 successful!');
    return parsed;
  } catch (error) {
    console.log('❌ Method 2 failed:', error.message);
  }

  // Method 3: Try with different padding
  try {
    console.log('🔄 Method 3: Custom padding approach');
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(false);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'binary');
    decrypted += decipher.final('binary');
    
    // Remove padding manually
    const lastByte = decrypted.charCodeAt(decrypted.length - 1);
    if (lastByte < 16) {
      decrypted = decrypted.substring(0, decrypted.length - lastByte);
    }
    
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 3 successful!');
    return parsed;
  } catch (error) {
    console.log('❌ Method 3 failed:', error.message);
  }

  console.log('❌ All decryption methods failed');
  return null;
}

// Fast challenge response function
function sendChallenge(res, challenge) {
  console.log('📤 SENDING CHALLENGE RESPONSE:', challenge);
  console.log('📤 Challenge type:', typeof challenge);
  console.log('📤 Challenge length:', challenge ? challenge.length : 0);
  
  // Set headers for plain text response
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Response-Time': Date.now()
  });
  
  // Send the challenge immediately
  res.status(200).send(String(challenge));
  
  console.log('✅ Challenge response sent successfully');
  return true;
}

// Main webhook handler
function handleLarkWebhook(req, res) {
  const startTime = Date.now();
  console.log('\n🔐 ========== Lark Webhook Request ==========');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🔐 Method:', req.method);
  console.log('🔐 URL:', req.url);
  console.log('🔐 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    let bodyText = '';
    
    if (Buffer.isBuffer(req.body)) {
      bodyText = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      bodyText = req.body;
    } else if (req.body) {
      bodyText = JSON.stringify(req.body);
    }
    
    console.log('📦 Body type:', typeof req.body);
    console.log('📦 Body length:', bodyText.length);
    console.log('📦 Body preview:', bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : ''));
    
    let webhookData = null;
    
    // First, try to parse as JSON (unencrypted)
    try {
      webhookData = JSON.parse(bodyText);
      console.log('✅ Parsed as plain JSON (unencrypted)');
    } catch (e) {
      console.log('📝 Not plain JSON, attempting decryption...');
      
      // Try to decrypt the data
      webhookData = decryptLarkChallenge(bodyText);
      
      if (!webhookData) {
        console.error('❌ Failed to decrypt webhook data');
        const elapsed = Date.now() - startTime;
        console.log('⏱️ Request processing time:', elapsed + 'ms');
        return res.status(400).json({ 
          error: 'Failed to decrypt webhook data',
          timestamp: new Date().toISOString(),
          elapsed: elapsed + 'ms'
        });
      }
      
      console.log('✅ Successfully decrypted webhook data');
    }
    
    console.log('📧 Final webhook data:', JSON.stringify(webhookData, null, 2));
    
    // PRIORITY: Handle challenge verification first for speed
    const challenge = webhookData.CHALLENGE || webhookData.challenge;
    
    if (challenge) {
      const elapsed = Date.now() - startTime;
      console.log('🔐 CHALLENGE DETECTED:', challenge);
      console.log('⏱️ Processing time before response:', elapsed + 'ms');
      
      return sendChallenge(res, challenge);
    }
    
    // Handle URL verification with type field
    if (webhookData && webhookData.type === 'url_verification') {
      const verificationChallenge = webhookData.CHALLENGE || webhookData.challenge;
      if (verificationChallenge) {
        const elapsed = Date.now() - startTime;
        console.log('🔐 URL verification challenge:', verificationChallenge);
        console.log('⏱️ Processing time before response:', elapsed + 'ms');
        
        return sendChallenge(res, verificationChallenge);
      }
    }
    
    // Handle actual webhook events
    console.log('📧 Processing webhook event...');
    const eventType = webhookData.header?.event_type || webhookData.type || 'unknown';
    console.log('📨 Event type:', eventType);
    
    const response = {
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      event_type: eventType,
      processing_time: (Date.now() - startTime) + 'ms'
    };
    
    console.log('✅ Webhook processed successfully');
    console.log('⏱️ Total processing time:', (Date.now() - startTime) + 'ms');
    console.log('🔐 ========== End Webhook Request ==========\n');
    
    return res.status(200).json(response);
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('❌ Webhook error:', error);
    console.log('⏱️ Error processing time:', elapsed + 'ms');
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString(),
      elapsed: elapsed + 'ms'
    });
  }
}

// Webhook endpoints
app.post('/webhook/lark', handleLarkWebhook);
app.post('/api/webhooks/lark-verify', handleLarkWebhook);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DocaFlex Enhanced Lark Webhook Server v1.0.4',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/webhook/lark (POST) - Main webhook endpoint',
      '/api/webhooks/lark-verify (POST) - Verification endpoint',
      '/ (GET) - Health check'
    ],
    config: {
      app_id: LARK_APP_ID,
      verification_token_set: !!LARK_VERIFICATION_TOKEN,
      encrypt_key_set: !!LARK_ENCRYPT_KEY,
      encrypt_key_length: LARK_ENCRYPT_KEY ? LARK_ENCRYPT_KEY.length : 0
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Lark Webhook Server v1.0.4 running on port ${PORT}`);
  console.log(`📡 Webhook URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
  console.log(`🔍 Health check: https://docaflex-webhook-production.up.railway.app/`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
});
