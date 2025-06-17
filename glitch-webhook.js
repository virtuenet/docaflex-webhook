const express = require('express');
const crypto = require('crypto');
const app = express();

// Lark encryption key - replace with your actual key
const LARK_ENCRYPT_KEY = 'J1DTSQinMN90kYPYipO8afEpbxhTa4qe';

console.log('🚀 Glitch Lark Webhook - Ultra Fast Decryption');

// Raw body parsing for encrypted data
app.use(express.raw({ type: '*/*', limit: '1mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Fast decryption function
function decryptLark(encryptedData) {
  try {
    // Method 1: First 32 chars of key
    const keyStr = LARK_ENCRYPT_KEY.slice(0, 32);
    const keyBuffer = Buffer.from(keyStr, 'utf8');
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedData.trim(), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (e1) {
    try {
      // Method 2: SHA256 hashed key
      const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
      const iv = Buffer.alloc(16, 0);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData.trim(), 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (e2) {
      console.log('❌ Decryption failed:', e1.message, e2.message);
      return null;
    }
  }
}

// Main webhook endpoint
app.post('/webhook/lark', (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  
  try {
    const data = JSON.parse(body);
    
    // Check for encrypted data
    if (data.encrypt) {
      console.log('🔐 Encrypted data received, decrypting...');
      const decrypted = decryptLark(data.encrypt);
      
      if (decrypted && (decrypted.challenge || decrypted.CHALLENGE)) {
        const challenge = decrypted.challenge || decrypted.CHALLENGE;
        console.log('✅ Challenge found:', challenge);
        res.set('Content-Type', 'text/plain');
        return res.status(200).send(String(challenge));
      }
    }
    
    // Check for plain challenge
    if (data.challenge || data.CHALLENGE) {
      const challenge = data.challenge || data.CHALLENGE;
      console.log('✅ Plain challenge found:', challenge);
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    }
    
    // No challenge - return OK
    console.log('📨 Event received');
    res.set('Content-Type', 'text/plain');
    res.status(200).send('OK');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    res.set('Content-Type', 'text/plain');
    res.status(200).send('OK');
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Glitch Lark Webhook',
    timestamp: Date.now()
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Glitch webhook running on port ${port}`);
}); 