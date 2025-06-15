const crypto = require('crypto');

// From your Railway logs - the EXACT encrypted payload (with %2F URL encoding)
const ENCRYPTED_RAW = "auJ%2F9Inv%2BCgzkJ78Fs4783jd5jvz1E3F9YqFxfYk7%2F1LkpnDAtLvOVwH%2F9sF3bbcO%2Ba0Berki%2B6UF%2FMyYPyDcs%2FvphwQgbBYfXesSyAqgXHPJx9eQfX5X6oguVMnLZ13iaponz58yxp5U7ew7HlZ4dC0E1G1FJscWxy2TFYqq0DpApPTJ3JtO%2Bqb7e8u";

// Your Lark encrypt key (35 chars) - using only first 32
const ENCRYPT_KEY = "J1DTSQinMN90kYPYipO8afEpbxhTa4qe".slice(0, 32);

console.log('🔍 Lark Decryption Test v3 - URL Encoded Data');
console.log('🔑 Encrypt key (first 32):', ENCRYPT_KEY);
console.log('📦 Raw encrypted data (URL encoded):', ENCRYPTED_RAW);
console.log('📦 Raw data length:', ENCRYPTED_RAW.length);

// URL decode the data
let ENCRYPTED;
try {
  ENCRYPTED = decodeURIComponent(ENCRYPTED_RAW);
  console.log('🔄 URL decoded data:', ENCRYPTED);
  console.log('🔄 URL decoded length:', ENCRYPTED.length);
} catch (e) {
  console.log('❌ URL decode failed:', e.message);
  ENCRYPTED = ENCRYPTED_RAW;
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
    
    // Look for challenge
    if (parsed.challenge || parsed.CHALLENGE) {
      console.log('🎯 CHALLENGE FOUND:', parsed.challenge || parsed.CHALLENGE);
    }
  } catch (e) {
    console.log('⚠️ Method 1 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 1 failed:', err.message);
}

// Method 2: Try with SHA256 hashed key
console.log('\n🔄 Method 2: SHA256 hashed key');
try {
  const key = crypto.createHash('sha256').update(ENCRYPT_KEY, 'utf8').digest();
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(ENCRYPTED, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log('✅ Method 2 SUCCESS - Decrypted:', decrypted);
  
  try {
    const parsed = JSON.parse(decrypted);
    console.log('✅ Method 2 - Parsed JSON:', JSON.stringify(parsed, null, 2));
    
    // Look for challenge
    if (parsed.challenge || parsed.CHALLENGE) {
      console.log('🎯 CHALLENGE FOUND:', parsed.challenge || parsed.CHALLENGE);
    }
  } catch (e) {
    console.log('⚠️ Method 2 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 2 failed:', err.message);
}

// Method 3: Try with full 35-char key (padded to 32)
console.log('\n🔄 Method 3: Full 35-char key padded');
try {
  const fullKey = "J1DTSQinMN90kYPYipO8afEpbxhTa4qe";
  const keyBuffer = Buffer.alloc(32, 0);
  Buffer.from(fullKey, 'utf8').copy(keyBuffer);
  
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
    
    // Look for challenge
    if (parsed.challenge || parsed.CHALLENGE) {
      console.log('🎯 CHALLENGE FOUND:', parsed.challenge || parsed.CHALLENGE);
    }
  } catch (e) {
    console.log('⚠️ Method 3 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 3 failed:', err.message);
}

console.log('\n🏁 URL Encoded test completed'); 