const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// ENHANCED DECRYPTION WEBHOOK v1.0.7 - Multiple decryption methods + detailed debugging
const LARK_ENCRYPT_KEY = process.env.LARK_ENCRYPT_KEY;

console.log('🚀 Enhanced Decryption Webhook v1.0.7 - Multiple Decryption Methods');
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

// ENHANCED DECRYPTION with multiple methods and detailed logging
function enhancedDecrypt(encryptedData, requestId) {
  if (!LARK_ENCRYPT_KEY) {
    console.log(`⚠️ [${requestId}] LARK_ENCRYPT_KEY not set, cannot decrypt`);
    return null;
  }

  const dataToDecrypt = encryptedData.trim();
  console.log(`🔓 [${requestId}] Decrypt input length: ${dataToDecrypt.length}`);
  console.log(`🔓 [${requestId}] Decrypt input preview: ${dataToDecrypt.substring(0, 50)}...`);

  // Method 1: Standard Lark AES-256-CBC with SHA256 hashed key
  try {
    console.log(`🔄 [${requestId}] Method 1: Standard Lark AES-256-CBC`);
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`✅ [${requestId}] Method 1 decrypted length: ${decrypted.length}`);
    console.log(`✅ [${requestId}] Method 1 decrypted content: ${decrypted}`);
    
    const parsed = JSON.parse(decrypted);
    console.log(`✅ [${requestId}] Method 1 parsed successfully:`, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (error) {
    console.log(`❌ [${requestId}] Method 1 failed: ${error.message}`);
  }

  // Method 2: Direct key approach
  try {
    console.log(`🔄 [${requestId}] Method 2: Direct key approach`);
    const key = Buffer.from(LARK_ENCRYPT_KEY, 'utf8');
    const finalKey = key.length === 32 ? key : crypto.createHash('sha256').update(key).digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', finalKey, iv);
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`✅ [${requestId}] Method 2 decrypted: ${decrypted}`);
    const parsed = JSON.parse(decrypted);
    console.log(`✅ [${requestId}] Method 2 parsed successfully:`, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (error) {
    console.log(`❌ [${requestId}] Method 2 failed: ${error.message}`);
  }

  // Method 3: Raw key with manual padding
  try {
    console.log(`🔄 [${requestId}] Method 3: Manual padding approach`);
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(false);
    
    let decrypted = decipher.update(dataToDecrypt, 'base64', 'binary');
    decrypted += decipher.final('binary');
    
    // Manual padding removal
    const lastByte = decrypted.charCodeAt(decrypted.length - 1);
    if (lastByte < 16) {
      decrypted = decrypted.substring(0, decrypted.length - lastByte);
    }
    
    console.log(`✅ [${requestId}] Method 3 decrypted: ${decrypted}`);
    const parsed = JSON.parse(decrypted);
    console.log(`✅ [${requestId}] Method 3 parsed successfully:`, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (error) {
    console.log(`❌ [${requestId}] Method 3 failed: ${error.message}`);
  }

  // Method 4: Alternative IV approach
  try {
    console.log(`🔄 [${requestId}] Method 4: Alternative IV approach`);
    const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
    
    // Try with IV extracted from first 16 bytes
    const encryptedBuffer = Buffer.from(dataToDecrypt, 'base64');
    if (encryptedBuffer.length > 16) {
      const iv = encryptedBuffer.slice(0, 16);
      const encryptedContent = encryptedBuffer.slice(16);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedContent, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log(`✅ [${requestId}] Method 4 decrypted: ${decrypted}`);
      const parsed = JSON.parse(decrypted);
      console.log(`✅ [${requestId}] Method 4 parsed successfully:`, JSON.stringify(parsed, null, 2));
      return parsed;
    }
  } catch (error) {
    console.log(`❌ [${requestId}] Method 4 failed: ${error.message}`);
  }

  console.log(`❌ [${requestId}] All decryption methods failed`);
  return null;
}

// ENHANCED CHALLENGE DETECTION - Check multiple possible field names
function findChallenge(data, requestId) {
  console.log(`🔍 [${requestId}] Searching for challenge in data:`, JSON.stringify(data, null, 2));
  
  const possibleFields = [
    'CHALLENGE',
    'challenge', 
    'Challenge',
    'url_verification',
    'challenge_code',
    'verification_token',
    'token'
  ];
  
  for (const field of possibleFields) {
    if (data && data[field]) {
      console.log(`🎯 [${requestId}] Found challenge in field '${field}': ${data[field]}`);
      return data[field];
    }
  }
  
  // Check nested objects
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        const nestedChallenge = findChallenge(value, requestId);
        if (nestedChallenge) {
          console.log(`🎯 [${requestId}] Found nested challenge in '${key}': ${nestedChallenge}`);
          return nestedChallenge;
        }
      }
    }
  }
  
  console.log(`❌ [${requestId}] No challenge found in any expected fields`);
  return null;
}

// MAIN WEBHOOK HANDLER
function handleWebhook(req, res) {
  const startTime = Date.now();
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  try {
    let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    let data = null;
    
    console.log(`📥 [${requestId}] Received request - Body length: ${bodyText.length}`);
    console.log(`📥 [${requestId}] Body preview: ${bodyText.substring(0, 100)}...`);
    
    // Try parsing as JSON first (unencrypted)
    try {
      data = JSON.parse(bodyText);
      console.log(`✅ [${requestId}] Parsed as plain JSON:`, JSON.stringify(data, null, 2));
      
      // CRITICAL FIX: Check if there's an "encrypt" field that needs to be decrypted
      if (data && data.encrypt) {
        console.log(`🔐 [${requestId}] Found encrypted field, decrypting...`);
        const decryptedData = enhancedDecrypt(data.encrypt, requestId);
        if (decryptedData) {
          console.log(`✅ [${requestId}] Successfully decrypted encrypt field:`, JSON.stringify(decryptedData, null, 2));
          data = decryptedData; // Replace with decrypted content
        } else {
          console.log(`❌ [${requestId}] Failed to decrypt encrypt field`);
        }
      }
      
    } catch (e) {
      console.log(`📝 [${requestId}] Not plain JSON, attempting full body decryption...`);
      data = enhancedDecrypt(bodyText, requestId);
    }
    
    if (!data) {
      console.log(`❌ [${requestId}] No valid data received`);
      return res.status(200).json({ error: 'Invalid data', request_id: requestId });
    }
    
    // ENHANCED CHALLENGE DETECTION
    const challenge = findChallenge(data, requestId);
    
    if (challenge) {
      const elapsed = Date.now() - startTime;
      console.log(`🔐 [${requestId}] CHALLENGE DETECTED: ${challenge} (${elapsed}ms)`);
      
      // IMMEDIATE PLAIN TEXT RESPONSE
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(String(challenge));
      
      console.log(`✅ [${requestId}] Challenge response sent successfully`);
      return;
    }
    
    // Handle URL verification with type field
    if (data.type === 'url_verification') {
      console.log(`🔐 [${requestId}] URL verification type detected`);
      const verificationChallenge = findChallenge(data, requestId);
      if (verificationChallenge) {
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(String(verificationChallenge));
        console.log(`✅ [${requestId}] URL verification response sent`);
        return;
      }
    }
    
    // For other events - immediate success response
    const eventType = data.header?.event_type || data.type || 'unknown';
    const elapsed = Date.now() - startTime;
    
    console.log(`📨 [${requestId}] Event received: ${eventType} (${elapsed}ms)`);
    
    res.status(200).json({
      status: 'received',
      request_id: requestId,
      timestamp: new Date().toISOString(),
      processing_time: elapsed + 'ms'
    });
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [${requestId}] Webhook error (${elapsed}ms):`, error.message);
    
    return res.status(200).json({ 
      error: 'Processing error',
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }
}

// DEBUG HANDLER - Same enhanced detection
function debugHandler(req, res) {
  const requestId = Date.now().toString(36);
  
  console.log(`\n🔍 ========== DEBUG REQUEST [${requestId}] ==========`);
  
  let bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  console.log(`📦 [${requestId}] Raw Body: ${bodyText}`);
  
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
    console.log(`✅ [${requestId}] Parsed as JSON:`, JSON.stringify(parsed, null, 2));
    
    // CRITICAL FIX: Check if there's an "encrypt" field that needs to be decrypted
    if (parsed && parsed.encrypt) {
      console.log(`🔐 [${requestId}] Found encrypted field in debug, decrypting...`);
      const decryptedData = enhancedDecrypt(parsed.encrypt, requestId);
      if (decryptedData) {
        console.log(`✅ [${requestId}] Successfully decrypted encrypt field in debug:`, JSON.stringify(decryptedData, null, 2));
        parsed = decryptedData; // Replace with decrypted content
      } else {
        console.log(`❌ [${requestId}] Failed to decrypt encrypt field in debug`);
      }
    }
    
  } catch (e) {
    console.log(`📝 [${requestId}] Not JSON, attempting decryption...`);
    parsed = enhancedDecrypt(bodyText, requestId);
  }
  
  const challenge = findChallenge(parsed, requestId);
  console.log(`🔍 ========== END DEBUG [${requestId}] ==========\n`);
  
  if (challenge) {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(String(challenge));
  } else {
    res.status(200).json({ 
      status: 'debug-ok', 
      request_id: requestId,
      received: !!bodyText,
      parsed: !!parsed,
      challenge: !!challenge,
      data_structure: parsed ? Object.keys(parsed) : null,
      timestamp: new Date().toISOString()
    });
  }
}

// ENDPOINTS
app.post('/webhook/lark', handleWebhook);
app.post('/api/webhooks/lark-verify', handleWebhook);
app.post('/debug', debugHandler);
app.post('/', handleWebhook);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Enhanced Decryption Webhook v1.0.7',
    timestamp: new Date().toISOString(),
    encrypt_key_set: !!LARK_ENCRYPT_KEY,
    features: [
      'Multiple decryption methods (4 different approaches)',
      'Enhanced challenge detection (7+ field names)',
      'Detailed debug logging',
      'Immediate plain text responses'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.7' });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Decryption Webhook v1.0.7 running on port ${PORT}`);
  console.log(`📡 Main URL: https://docaflex-webhook-production.up.railway.app/webhook/lark`);
  console.log(`🔍 Debug URL: https://docaflex-webhook-production.up.railway.app/debug`);
  console.log(`🔧 Enhanced: 4 decryption methods + 7+ challenge field checks`);
});
