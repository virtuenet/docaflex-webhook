const crypto = require('crypto');

// From your Railway logs - the encrypted payload (might be URL encoded)
const ENCRYPTED_RAW = "auJ/9Inv+CgzkJ78Fs4783jd5jvz1E3F9YqFxfYk7/1LkpnDAtLvOVwH2F9sF3bbcO+a0Berki+6UF/MyYPyDcs/vphwQgbBYfXesSyAqgXHPJx9eQfX5X6oguVMnLZ13iaponz58yxp5U7ew7HlZ4dC0E1G1FJscWxy2TFYqq0DpApPTJ3JtO+qb7e8u";

// Your Lark encrypt key (35 chars) - using only first 32
const ENCRYPT_KEY = "J1DTSQinMN90kYPYipO8afEpbxhTa4qe".slice(0, 32);

console.log('🔍 Enhanced Lark Decryption Test v2');
console.log('🔑 Encrypt key (first 32):', ENCRYPT_KEY);
console.log('🔑 Key length:', ENCRYPT_KEY.length);
console.log('📦 Raw encrypted data:', ENCRYPTED_RAW);
console.log('📦 Raw data length:', ENCRYPTED_RAW.length);

// Try URL decoding first
let ENCRYPTED = ENCRYPTED_RAW;
try {
  const urlDecoded = decodeURIComponent(ENCRYPTED_RAW);
  if (urlDecoded !== ENCRYPTED_RAW) {
    console.log('🔄 URL decoded version:', urlDecoded);
    ENCRYPTED = urlDecoded;
  }
} catch (e) {
  console.log('⚠️ URL decode failed, using raw data');
}

// Analyze the base64 data
console.log('\n📊 Base64 Analysis:');
try {
  const buffer = Buffer.from(ENCRYPTED, 'base64');
  console.log('📊 Decoded buffer length:', buffer.length);
  console.log('📊 Divisible by 16 (AES block size):', buffer.length % 16 === 0 ? 'YES' : 'NO');
  console.log('📊 First 16 bytes (hex):', buffer.slice(0, 16).toString('hex'));
  console.log('📊 Last 16 bytes (hex):', buffer.slice(-16).toString('hex'));
} catch (e) {
  console.log('❌ Invalid base64 data:', e.message);
}

// Method 1: Standard AES-256-CBC with zero IV
console.log('\n🔄 Method 1: Standard AES-256-CBC');
try {
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY, 'utf8'), iv);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(ENCRYPTED, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 1 SUCCESS - Decrypted:', decrypted);
  
  try {
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 1 - Parsed JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('⚠️ Method 1 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 1 failed:', err.message);
}

// Method 2: Try without auto padding
console.log('\n🔄 Method 2: No auto padding');
try {
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY, 'utf8'), iv);
  decipher.setAutoPadding(false);
  
  let decrypted = decipher.update(ENCRYPTED, 'base64');
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  // Manual PKCS7 unpadding
  const padLength = decrypted[decrypted.length - 1];
  if (padLength > 0 && padLength <= 16) {
    decrypted = decrypted.slice(0, -padLength);
  }
  
  const result = decrypted.toString('utf8');
  console.log('✅ Method 2 SUCCESS - Decrypted:', result);
  
  try {
    const parsed = JSON.parse(result);
    console.log('✅ Method 2 - Parsed JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('⚠️ Method 2 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 2 failed:', err.message);
}

// Method 3: Try with full 35-char key (all bytes)
console.log('\n🔄 Method 3: Full 35-char key (truncated to 32)');
try {
  const fullKey = "J1DTSQinMN90kYPYipO8afEpbxhTa4qe";
  const keyBuffer = Buffer.from(fullKey.substring(0, 32), 'utf8');
  
  console.log('🔑 Method 3 key hex:', keyBuffer.toString('hex'));
  
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(ENCRYPTED, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 3 SUCCESS - Decrypted:', decrypted);
  
  try {
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 3 - Parsed JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('⚠️ Method 3 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 3 failed:', err.message);
}

// Method 4: Check if the data is actually valid base64
console.log('\n🔄 Method 4: Base64 validation and cleanup');
try {
  // Clean up the base64 string
  let cleanBase64 = ENCRYPTED.replace(/[^A-Za-z0-9+/=]/g, '');
  
  // Add padding if needed
  while (cleanBase64.length % 4 !== 0) {
    cleanBase64 += '=';
  }
  
  console.log('🧹 Cleaned base64:', cleanBase64);
  console.log('🧹 Cleaned length:', cleanBase64.length);
  
  const buffer = Buffer.from(cleanBase64, 'base64');
  console.log('🧹 Buffer length:', buffer.length);
  console.log('🧹 Divisible by 16:', buffer.length % 16 === 0 ? 'YES' : 'NO');
  
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY, 'utf8'), iv);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(cleanBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 4 SUCCESS - Decrypted:', decrypted);
  
  try {
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 4 - Parsed JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('⚠️ Method 4 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 4 failed:', err.message);
}

console.log('\n🏁 Enhanced test completed'); 