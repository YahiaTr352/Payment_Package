const crypto = require('crypto');

// إعدادات توليد زوج مفاتيح RSA
const RSA_KEY_OPTIONS = {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
};

// توليد زوج مفاتيح RSA
function generateRSAKeyPair() {
  return crypto.generateKeyPairSync('rsa', RSA_KEY_OPTIONS);
}

// تحويل مفتاح عام بصيغة base64 إلى PEM
function convertB64ToPem(b64Key) {
  // احذف أي رؤوس أو تذييل مكررين
  b64Key = b64Key
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, ''); // إزالة المسافات/أسطر إضافية

  const formatted = b64Key.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
}


// تشفير Hybrid: AES-GCM للبيانات + RSA-OAEP لمفتاح AES
function encryptHybrid(data, b64PublicKey) {
  // توليد مفتاح AES 256-bit
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12); // IV لـ AES-GCM

  // تشفير البيانات باستخدام AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // تحويل المفتاح العام إلى صيغة PEM
  const pemKey = convertB64ToPem(b64PublicKey);
  console.log("🔐 PEM public key:\n", pemKey); // يمكنك إبقاؤه أو حذفه

  // تشفير مفتاح AES باستخدام RSA-OAEP
  const encryptedKey = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    aesKey
  );

  return {
    ciphertext: encrypted.toString('base64'),
    encryptedAESKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

// فك التشفير Hybrid
function decryptHybrid({ ciphertext, encryptedAESKey, iv, authTag }, privateKeyPem) {
  
  // فك تشفير AES key باستخدام المفتاح الخاص
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(encryptedAESKey, 'base64')
  );

  // فك تشفير البيانات باستخدام AES-GCM
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

function sendEncryptedError(res, clientPublicKey, message, statusCode = 400) {
  const encryptedError = encryptHybrid(JSON.stringify({ message }), clientPublicKey);
  return res.status(statusCode).json(encryptedError);
}

const algorithm = "aes-256-gcm";
const ivLength = 12;
const secretKey = Buffer.from(process.env.SECRET_KEY.padEnd(32, "!"));

function encryptKeyGCM(plaintext) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64")
  };
}

function decryptKeyGCM({ iv, authTag, ciphertext }) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8").trim();
}

module.exports = {
  generateRSAKeyPair,
  encryptHybrid,
  decryptHybrid,
  convertB64ToPem,
  sendEncryptedError,
  encryptKeyGCM,
  decryptKeyGCM
};
