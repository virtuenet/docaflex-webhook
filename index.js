const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// FAST WEBHOOK v1.0.13 - Immediate responses, minimal logging
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

console.log('🚀 Fast Webhook v1.0.13 - Immediate Responses');
console.log('🔐 Encrypt key set:', !!LARK_ENCRYPT_KEY);

// Raw body parsing
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

// FAST DECRYPTION - Only essential methods
function fastDecrypt(encryptedData, requestId) {
  if (!LARK_ENCRYPT_KEY) {
    return null;
  }

  const dataToDecrypt = encryptedData.trim();
  
  // Method 1: First 32 chars of key
  try {
    const keyStr = LARK_ENCRYPT_KEY.slice(0, 32);
    const keyBuffer = Buffer.from(keyStr, 'utf8');
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    // Silent fail, try next method
  }

  // Method 2: SHA256 hashed key
  try {
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    // Silent fail
  }

  return null;
}

// FAST CHALLENGE DETECTION
function findChallenge(data) {
  if (!data) return null;
  
  // Check common challenge fields
  if (data.challenge) return data.challenge;
  if (data.CHALLENGE) return data.CHALLENGE;
  if (data.Challenge) return data.Challenge;
  
  return null;
}

// MAIN WEBHOOK HANDLER - IMMEDIATE RESPONSE
function handleWebhook(req, res) {
  const requestId = Date.now().toString(36);
  
  // IMMEDIATE RESPONSE FIRST
  res.set('Content-Type', 'text/plain; charset=utf-8');
  
  try {
    let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    let data = null;
    
    // Try parsing as JSON first
    try {
      data = JSON.parse(bodyText);
      
      // Check if there's an "encrypt" field
      if (data && data.encrypt) {
        const decryptedData = fastDecrypt(data.encrypt, requestId);
        if (decryptedData) {
          data = decryptedData;
        }
      }
    } catch (e) {
      // Try full body decryption
      data = fastDecrypt(bodyText, requestId);
    }
    
    // Look for challenge
    const challenge = findChallenge(data);
    
    if (challenge) {
      console.log(`✅ [${requestId}] Challenge found: ${challenge}`);
      res.status(200).send(String(challenge));
      return;
    }
    
    // No challenge found - send OK
    console.log(`📨 [${requestId}] Event received, no challenge`);
    res.status(200).send('OK');

  } catch (error) {
    console.error(`❌ [${requestId}] Error:`, error.message);
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
    message: 'Fast Webhook v1.0.13',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.13' });
});

app.listen(PORT, () => {
  console.log(`🚀 Fast Webhook v1.0.13 running on port ${PORT}`);
  console.log(`📡 URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
});
