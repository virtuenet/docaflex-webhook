const crypto = require('crypto');

// From your Railway logs - the encrypted payload
const ENCRYPTED = "auJ/9Inv+CgzkJ78Fs4783jd5jvz1E3F9YqFxfYk7/1LkpnDAtLvOVwH2F9sF3bbcO+a0Berki+6UF/MyYPyDcs/vphwQgbBYfXesSyAqgXHPJx9eQfX5X6oguVMnLZ13iaponz58yxp5U7ew7HlZ4dC0E1G1FJscWxy2TFYqq0DpApPTJ3JtO+qb7e8u";

// Your Lark encrypt key (35 chars) - using only first 32
const ENCRYPT_KEY = "J1DTSQinMN90kYPYipO8afEpbxhTa4qe".slice(0, 32);

console.log('🔍 Testing Lark Decryption');
console.log('🔑 Encrypt key (first 32):', ENCRYPT_KEY);
console.log('🔑 Key length:', ENCRYPT_KEY.length);
console.log('🔑 Key hex:', Buffer.from(ENCRYPT_KEY, 'utf8').toString('hex'));
console.log('📦 Encrypted data length:', ENCRYPTED.length);
console.log('📦 Encrypted preview:', ENCRYPTED.substring(0, 50) + '...');

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
  } catch (e) {
    console.log('⚠️ Method 3 - Decrypted but not valid JSON');
  }
} catch (err) {
  console.log('❌ Method 3 failed:', err.message);
}

// Method 4: Try AES-128-CBC
console.log('\n🔄 Method 4: AES-128-CBC');
try {
  const key128 = Buffer.from(ENCRYPT_KEY.substring(0, 16), 'utf8');
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key128, iv);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(ENCRYPTED, 'base64', 'utf8');
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

console.log('\n🏁 Test completed'); 