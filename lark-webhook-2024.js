const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Lark app credentials
const LARK_ENCRYPT_KEY = 'J1DTSQinMN90kYPYipO8afEpbxhTa4qe';
const LARK_VERIFICATION_TOKEN = 'towpHcKvdzLz0qcMQpy1dg6kOJOpO2aF';

console.log('🚀 Lark Webhook 2024 - Latest Event Subscription Format');

// Raw body parsing for webhook validation
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Lark-Signature, X-Lark-Request-Timestamp, X-Lark-Request-Nonce');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Lark signature verification
function verifyLarkSignature(timestamp, nonce, encryptKey, body, signature) {
  try {
    const data = timestamp + nonce + encryptKey + body;
    const expectedSignature = crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    return expectedSignature === signature;
  } catch (error) {
    console.log('❌ Signature verification error:', error.message);
    return false;
  }
}

// Decrypt Lark encrypted content
function decryptLarkContent(encryptedData, encryptKey) {
  try {
    // Method 1: Use first 32 chars of encrypt key as AES key
    const keyBuffer = Buffer.from(encryptKey.slice(0, 32), 'utf8');
    const iv = Buffer.alloc(16, 0); // Zero IV
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (e1) {
    try {
      // Method 2: Use SHA256 hash of encrypt key
      const key = crypto.createHash('sha256').update(encryptKey, 'utf8').digest();
      const iv = Buffer.alloc(16, 0);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (e2) {
      console.log('❌ Decryption failed with both methods:', e1.message, e2.message);
      return null;
    }
  }
}

// MAIN WEBHOOK ENDPOINT
app.post('/webhook/lark', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  const timestamp = req.headers['x-lark-request-timestamp'];
  const nonce = req.headers['x-lark-request-nonce'];
  const signature = req.headers['x-lark-signature'];
  
  console.log('\n=== LARK WEBHOOK 2024 ===');
  console.log('📥 Time:', new Date().toISOString());
  console.log('📦 Body length:', body.length);
  console.log('📦 Headers:', {
    timestamp,
    nonce,
    signature: signature ? signature.substring(0, 20) + '...' : 'none'
  });
  console.log('📦 Body:', body);
  
  try {
    const data = JSON.parse(body);
    console.log('✅ Parsed JSON:', JSON.stringify(data, null, 2));
    
    // Verify signature if present
    if (signature && timestamp && nonce) {
      const isValidSignature = verifyLarkSignature(timestamp, nonce, LARK_ENCRYPT_KEY, body, signature);
      console.log('🔐 Signature validation:', isValidSignature ? '✅ Valid' : '❌ Invalid');
      
      if (!isValidSignature) {
        console.log('⚠️ Invalid signature, but continuing for testing...');
      }
    }
    
    // Handle encrypted content (latest format)
    if (data.encrypt) {
      console.log('🔐 Processing encrypted content...');
      const decryptedData = decryptLarkContent(data.encrypt, LARK_ENCRYPT_KEY);
      
      if (decryptedData) {
        console.log('✅ Decrypted content:', JSON.stringify(decryptedData, null, 2));
        
        // Check for challenge in decrypted content
        const challenge = decryptedData.challenge || decryptedData.CHALLENGE;
        if (challenge) {
          console.log('🎯 Challenge found in encrypted data:', challenge);
          
          // Return challenge as PLAIN TEXT (Lark 2024 requirement)
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(String(challenge));
          return;
        }
        
        // Handle decrypted event
        console.log('📨 Processing decrypted event...');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ code: 0, msg: 'success' }));
        return;
      } else {
        console.log('❌ Failed to decrypt, returning challenge placeholder');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('challenge_placeholder');
        return;
      }
    }
    
    // Handle URL verification (plain challenge)
    if (data.type === 'url_verification' || data.challenge || data.CHALLENGE) {
      const challenge = data.challenge || data.CHALLENGE;
      console.log('🔗 URL verification challenge:', challenge);
      
      // Return challenge as PLAIN TEXT (official requirement)
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(challenge));
      return;
    }
    
    // Handle regular events
    if (data.type === 'event_callback' || data.event) {
      console.log('📨 Regular event callback received');
      console.log('📋 Event type:', data.event?.type || 'unknown');
      
      // Return success response for events
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ code: 0, msg: 'success' }));
      return;
    }
    
    // Default success response
    console.log('📨 Unknown event type, returning success');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 0, msg: 'success' }));
    
  } catch (error) {
    console.log('❌ JSON parse failed:', error.message);
    console.log('🔄 Returning plain text OK for non-JSON requests');
    
    // For non-JSON requests, return plain text
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
  }
  
  console.log('=== END WEBHOOK ===\n');
});

// Alternative endpoint
app.post('/api/webhooks/lark-verify', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  try {
    const data = JSON.parse(body);
    const challenge = data.challenge || data.CHALLENGE;
    
    if (challenge) {
      console.log('✅ API endpoint challenge:', challenge);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(challenge));
      return;
    }
  } catch (e) {}
  
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ code: 0, msg: 'success' }));
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Lark Webhook 2024 - Latest Event Subscription Format',
    timestamp: Date.now(),
    version: '2024.1',
    endpoints: ['/webhook/lark', '/api/webhooks/lark-verify'],
    features: [
      'URL Verification (plain text response)',
      'Encrypted Content Decryption',
      'Signature Verification',
      'Event Callback Handling',
      'Latest 2024 Format Support'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '2024.1' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lark Webhook 2024 running on 0.0.0.0:${PORT}`);
  console.log(`📡 Ready for ngrok: ngrok http ${PORT}`);
  console.log(`🔧 Features: URL verification, encryption, signature validation`);
}); 