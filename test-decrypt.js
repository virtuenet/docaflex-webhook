const crypto = require('crypto');

const LARK_ENCRYPT_KEY = 'J1DTSQinMN90kYPYipO8afEpbxhTa4qe';
const encryptedData = 'ByqHqVTDRVzpEr37W85Vb7U/QT/ktfpLXyd8QmLMI6xGr1F58r8tEXr1Yn7zxxnQebDa5FXPMnvlqYvS6YlC8xloYUknJZLBGBx5PznVSDKfnfaUynJJFLXY/nT5lBTfettnYYH0ZyEJlCeTsAWdVWGAwgqtCEZMYN57W';

console.log('🔍 Testing decryption with actual Lark data...');
console.log('📦 Encrypted length:', encryptedData.length);

// Method 1: First 32 chars
try {
  const keyStr = LARK_ENCRYPT_KEY.slice(0, 32);
  const keyBuffer = Buffer.from(keyStr, 'utf8');
  const iv = Buffer.alloc(16, 0);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedData.trim(), 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 1 Decrypted:', decrypted);
  const parsed = JSON.parse(decrypted);
  console.log('✅ Method 1 Parsed:', JSON.stringify(parsed, null, 2));
  
  if (parsed.challenge) {
    console.log('🎯 CHALLENGE FOUND:', parsed.challenge);
  }
} catch (e) {
  console.log('❌ Method 1 failed:', e.message);
}

// Method 2: SHA256 key
try {
  const key = crypto.createHash('sha256').update(LARK_ENCRYPT_KEY, 'utf8').digest();
  const iv = Buffer.alloc(16, 0);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData.trim(), 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 2 Decrypted:', decrypted);
  const parsed = JSON.parse(decrypted);
  console.log('✅ Method 2 Parsed:', JSON.stringify(parsed, null, 2));
  
  if (parsed.challenge) {
    console.log('🎯 CHALLENGE FOUND:', parsed.challenge);
  }
} catch (e) {
  console.log('❌ Method 2 failed:', e.message);
} 