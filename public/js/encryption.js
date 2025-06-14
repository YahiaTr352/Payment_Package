
// let rsaKeyPair;
// let serverPublicKey;
// let otpPageID = "";
// let fixedData;


// function b64ToArrayBuffer(b64) {
//   // إزالة الترويسات والأسطر الجديدة
//   const cleaned = b64
//     .replace(/-----BEGIN PUBLIC KEY-----/, '')
//     .replace(/-----END PUBLIC KEY-----/, '')
//     .replace(/\n/g, '')
//     .replace(/\r/g, '')
//     .trim();

//   const binaryString = window.atob(cleaned);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// }


// function arrayBufferToB64(buffer) {
//   const binary = String.fromCharCode(...new Uint8Array(buffer));
//   return btoa(binary);
// }

// async function generateRSAKeyPair() {
//   return await crypto.subtle.generateKey(
//     {
//       name: "RSA-OAEP",
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: "SHA-256",
//     },
//     true,
//     ["encrypt", "decrypt"]
//   );
// }

// async function exportPublicKey(key) {
//   const spki = await crypto.subtle.exportKey("spki", key);
//   return arrayBufferToB64(spki);
// }

// async function importServerPublicKey(b64Key) {
//   const spki = b64ToArrayBuffer(b64Key);
//   return await crypto.subtle.importKey(
//     "spki",
//     spki,
//     { name: "RSA-OAEP", hash: "SHA-256" },
//     true,
//     ["encrypt"]
//   );
// }

// async function encryptHybrid(data, serverPublicKey) {
//   const aesKey = await crypto.subtle.generateKey(
//     { name: "AES-GCM", length: 256 },
//     true,
//     ["encrypt", "decrypt"]
//   );

//   const iv = crypto.getRandomValues(new Uint8Array(12));
//   const encoder = new TextEncoder();
//   const encoded = encoder.encode(JSON.stringify(data));

//   const fullCiphertextBuffer = await crypto.subtle.encrypt(
//     { name: "AES-GCM", iv },
//     aesKey,
//     encoded
//   );

//   // تقسيم الـ ciphertext + authTag
//   const fullCiphertext = new Uint8Array(fullCiphertextBuffer);
//   const authTag = fullCiphertext.slice(-16); // آخر 16 بايت
//   const ciphertext = fullCiphertext.slice(0, -16); // باقي البيانات

//   const rawAESKey = await crypto.subtle.exportKey("raw", aesKey);
//   const encryptedAESKey = await crypto.subtle.encrypt(
//     { name: "RSA-OAEP" },
//     serverPublicKey,
//     rawAESKey
//   );

//   return {
//     ciphertext: arrayBufferToB64(ciphertext.buffer),
//     encryptedAESKey: arrayBufferToB64(encryptedAESKey),
//     iv: arrayBufferToB64(iv.buffer),
//     authTag: arrayBufferToB64(authTag.buffer), // ✅ مهم جدًا
//   };
// }


// async function decryptHybrid(encryptedData, privateKey) {
//   const { ciphertext, encryptedAESKey, iv, authTag } = encryptedData;

//   const aesKeyRaw = await crypto.subtle.decrypt(
//     { name: "RSA-OAEP" },
//     privateKey,
//     b64ToArrayBuffer(encryptedAESKey)
//   );

//   const aesKey = await crypto.subtle.importKey(
//     "raw",
//     aesKeyRaw,
//     { name: "AES-GCM" },
//     false,
//     ["decrypt"]
//   );

//   // دمج ciphertext + authTag كما كان عند التشفير
//   const ct = new Uint8Array(b64ToArrayBuffer(ciphertext));
//   const at = new Uint8Array(b64ToArrayBuffer(authTag));
//   const combined = new Uint8Array(ct.length + at.length);
//   combined.set(ct);
//   combined.set(at, ct.length);

//   const decrypted = await crypto.subtle.decrypt(
//     { name: "AES-GCM", iv: b64ToArrayBuffer(iv) },
//     aesKey,
//     combined.buffer
//   );

//   const decoder = new TextDecoder();
//   return JSON.parse(decoder.decode(decrypted));
// }

// .................................................................................................

// let rsaKeyPair;
// let serverPublicKey;
// let otpPageID = "";
// let fixedData;


// function b64ToArrayBuffer(b64) {
//   // إزالة الترويسات والأسطر الجديدة
//   const cleaned = b64
//     .replace(/-----BEGIN PUBLIC KEY-----/, '')
//     .replace(/-----END PUBLIC KEY-----/, '')
//     .replace(/\n/g, '')
//     .replace(/\r/g, '')
//     .trim();

//   const binaryString = window.atob(cleaned);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// }


// function arrayBufferToB64(buffer) {
//   const binary = String.fromCharCode(...new Uint8Array(buffer));
//   return btoa(binary);
// }

// async function generateRSAKeyPair() {
//   return await crypto.subtle.generateKey(
//     {
//       name: "RSA-OAEP",
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: "SHA-256",
//     },
//     true,
//     ["encrypt", "decrypt"]
//   );
// }

// async function exportPublicKey(key) {
//   const spki = await crypto.subtle.exportKey("spki", key);
//   return arrayBufferToB64(spki);
// }

// async function importServerPublicKey(b64Key) {
//   const spki = b64ToArrayBuffer(b64Key);
//   return await crypto.subtle.importKey(
//     "spki",
//     spki,
//     { name: "RSA-OAEP", hash: "SHA-256" },
//     true,
//     ["encrypt"]
//   );
// }

// async function encryptHybrid(data, serverPublicKey) {
//   const aesKey = await crypto.subtle.generateKey(
//     { name: "AES-GCM", length: 256 },
//     true,
//     ["encrypt", "decrypt"]
//   );

//   const iv = crypto.getRandomValues(new Uint8Array(12));
//   const encoder = new TextEncoder();
//   const encoded = encoder.encode(JSON.stringify(data));

//   const fullCiphertextBuffer = await crypto.subtle.encrypt(
//     { name: "AES-GCM", iv },
//     aesKey,
//     encoded
//   );

//   // تقسيم الـ ciphertext + authTag
//   const fullCiphertext = new Uint8Array(fullCiphertextBuffer);
//   const authTag = fullCiphertext.slice(-16); // آخر 16 بايت
//   const ciphertext = fullCiphertext.slice(0, -16); // باقي البيانات

//   const rawAESKey = await crypto.subtle.exportKey("raw", aesKey);
//   const encryptedAESKey = await crypto.subtle.encrypt(
//     { name: "RSA-OAEP" },
//     serverPublicKey,
//     rawAESKey
//   );

//   return {
//     ciphertext: arrayBufferToB64(ciphertext.buffer),
//     encryptedAESKey: arrayBufferToB64(encryptedAESKey),
//     iv: arrayBufferToB64(iv.buffer),
//     authTag: arrayBufferToB64(authTag.buffer), // ✅ مهم جدًا
//   };
// }


// async function decryptHybrid(encryptedData, privateKey) {
//   const { ciphertext, encryptedAESKey, iv, authTag } = encryptedData;

//   const aesKeyRaw = await crypto.subtle.decrypt(
//     { name: "RSA-OAEP" },
//     privateKey,
//     b64ToArrayBuffer(encryptedAESKey)
//   );

//   const aesKey = await crypto.subtle.importKey(
//     "raw",
//     aesKeyRaw,
//     { name: "AES-GCM" },
//     false,
//     ["decrypt"]
//   );

//   // دمج ciphertext + authTag كما كان عند التشفير
//   const ct = new Uint8Array(b64ToArrayBuffer(ciphertext));
//   const at = new Uint8Array(b64ToArrayBuffer(authTag));
//   const combined = new Uint8Array(ct.length + at.length);
//   combined.set(ct);
//   combined.set(at, ct.length);

//   const decrypted = await crypto.subtle.decrypt(
//     { name: "AES-GCM", iv: b64ToArrayBuffer(iv) },
//     aesKey,
//     combined.buffer
//   );

//   const decoder = new TextDecoder();
//   return JSON.parse(decoder.decode(decrypted));
// }

// let rsaKeyPair;
// let serverPublicKey;
// let otpPageID = "";
// let fixedData;

// // =====================
// // 🧱 IndexedDB Functions
// // =====================
// function openKeyDB() {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open("cryptoKeysDB", 1);
//     request.onupgradeneeded = function (event) {
//       const db = event.target.result;
//       if (!db.objectStoreNames.contains("keys")) {
//         db.createObjectStore("keys");
//       }
//     };
//     request.onsuccess = () => resolve(request.result);
//     request.onerror = () => reject(request.error);
//   });
// }

// async function savePrivateKeyToDB(privateKey) {
//   const db = await openKeyDB();
//   const tx = db.transaction("keys", "readwrite");
//   const store = tx.objectStore("keys");
//   store.put(privateKey, "privateKey");
//   await tx.done;
//   db.close();
// }

// async function loadPrivateKeyFromDB() {
//   const db = await openKeyDB();
//   const tx = db.transaction("keys", "readonly");
//   const store = tx.objectStore("keys");
//   return new Promise((resolve, reject) => {
//     const request = store.get("privateKey");
//     request.onsuccess = () => {
//       db.close();
//       resolve(request.result);
//     };
//     request.onerror = () => {
//       db.close();
//       reject(request.error);
//     };
//   });
// }

// // =====================
// // 🔑 Key Management
// // =====================
// function b64ToArrayBuffer(b64) {
//   const cleaned = b64
//     .replace(/-----BEGIN PUBLIC KEY-----/, '')
//     .replace(/-----END PUBLIC KEY-----/, '')
//     .replace(/\n/g, '')
//     .replace(/\r/g, '')
//     .trim();

//   const binaryString = window.atob(cleaned);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// }

// function arrayBufferToB64(buffer) {
//   const binary = String.fromCharCode(...new Uint8Array(buffer));
//   return btoa(binary);
// }

// async function generateRSAKeyPair() {
//   return await crypto.subtle.generateKey(
//     {
//       name: "RSA-OAEP",
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: "SHA-256",
//     },
//     false, // ❌ Not extractable
//     ["encrypt", "decrypt"]
//   );
// }

// async function exportPublicKey(key) {
//   const spki = await crypto.subtle.exportKey("spki", key);
//   return arrayBufferToB64(spki);
// }

// async function importServerPublicKey(b64Key) {
//   const spki = b64ToArrayBuffer(b64Key);
//   return await crypto.subtle.importKey(
//     "spki",
//     spki,
//     { name: "RSA-OAEP", hash: "SHA-256" },
//     true,
//     ["encrypt"]
//   );
// }

// async function initializeKeys() {
//   const privateKey = await loadPrivateKeyFromDB();
//   if (privateKey) {
//     rsaKeyPair = { privateKey };
//   } else {
//     rsaKeyPair = await generateRSAKeyPair();
//     await savePrivateKeyToDB(rsaKeyPair.privateKey);
//   }
// }

// // =====================
// // 🔐 Hybrid Encryption
// // =====================
// async function encryptHybrid(data, serverPublicKey) {
//   const aesKey = await crypto.subtle.generateKey(
//     { name: "AES-GCM", length: 256 },
//     true,
//     ["encrypt", "decrypt"]
//   );

//   const iv = crypto.getRandomValues(new Uint8Array(12));
//   const encoder = new TextEncoder();
//   const encoded = encoder.encode(JSON.stringify(data));

//   const fullCiphertextBuffer = await crypto.subtle.encrypt(
//     { name: "AES-GCM", iv },
//     aesKey,
//     encoded
//   );

//   const fullCiphertext = new Uint8Array(fullCiphertextBuffer);
//   const authTag = fullCiphertext.slice(-16);
//   const ciphertext = fullCiphertext.slice(0, -16);

//   const rawAESKey = await crypto.subtle.exportKey("raw", aesKey);
//   const encryptedAESKey = await crypto.subtle.encrypt(
//     { name: "RSA-OAEP" },
//     serverPublicKey,
//     rawAESKey
//   );

//   return {
//     ciphertext: arrayBufferToB64(ciphertext.buffer),
//     encryptedAESKey: arrayBufferToB64(encryptedAESKey),
//     iv: arrayBufferToB64(iv.buffer),
//     authTag: arrayBufferToB64(authTag.buffer),
//   };
// }

// async function decryptHybrid(encryptedData, privateKey) {
//   const { ciphertext, encryptedAESKey, iv, authTag } = encryptedData;

//   const aesKeyRaw = await crypto.subtle.decrypt(
//     { name: "RSA-OAEP" },
//     privateKey,
//     b64ToArrayBuffer(encryptedAESKey)
//   );

//   const aesKey = await crypto.subtle.importKey(
//     "raw",
//     aesKeyRaw,
//     { name: "AES-GCM" },
//     false,
//     ["decrypt"]
//   );

//   const ct = new Uint8Array(b64ToArrayBuffer(ciphertext));
//   const at = new Uint8Array(b64ToArrayBuffer(authTag));
//   const combined = new Uint8Array(ct.length + at.length);
//   combined.set(ct);
//   combined.set(at, ct.length);

//   const decrypted = await crypto.subtle.decrypt(
//     { name: "AES-GCM", iv: b64ToArrayBuffer(iv) },
//     aesKey,
//     combined.buffer
//   );

//   const decoder = new TextDecoder();
//   return JSON.parse(decoder.decode(decrypted));
// }

function _0x4e2b(){const _0x5c294a=['encode','20zzvrmF','2498200AgKIEF','transaction','result','exportKey','1276350IcPhOk','keys','7PeISTe','3167793mTKaHp','onupgradeneeded','cryptoKeysDB','error','charCodeAt','importKey','parse','5wpAwpo','SHA-256','get','decode','onsuccess','generateKey','done','getRandomValues','set','117405MBcVxT','326846UoJdjQ','decrypt','close','length','slice','AES-GCM','target','7155534aOhaFp','subtle','encrypt','352vNLCuM','RSA-OAEP','atob','createObjectStore','buffer','objectStore','stringify','privateKey','readwrite','108qnwsEi','replace','raw','trim','readonly','spki','open','775092YQGMqu'];_0x4e2b=function(){return _0x5c294a;};return _0x4e2b();}(function(_0x575fa3,_0x4dd473){const _0x472e40=_0x4e9d,_0xcc36f6=_0x575fa3();while(!![]){try{const _0x37ca78=-parseInt(_0x472e40(0xa3))/0x1*(parseInt(_0x472e40(0x78))/0x2)+parseInt(_0x472e40(0x77))/0x3*(parseInt(_0x472e40(0x8b))/0x4)+parseInt(_0x472e40(0x99))/0x5+parseInt(_0x472e40(0x7f))/0x6*(parseInt(_0x472e40(0x9b))/0x7)+parseInt(_0x472e40(0x95))/0x8+parseInt(_0x472e40(0x9c))/0x9*(parseInt(_0x472e40(0x94))/0xa)+parseInt(_0x472e40(0x82))/0xb*(-parseInt(_0x472e40(0x92))/0xc);if(_0x37ca78===_0x4dd473)break;else _0xcc36f6['push'](_0xcc36f6['shift']());}catch(_0x5c2ab1){_0xcc36f6['push'](_0xcc36f6['shift']());}}}(_0x4e2b,0x9b722));let rsaKeyPair,serverPublicKey,otpPageID='',fixedData;function openKeyDB(){return new Promise((_0x559946,_0x2aa471)=>{const _0x104491=_0x4e9d,_0xfc1134=indexedDB[_0x104491(0x91)](_0x104491(0x9e),0x1);_0xfc1134[_0x104491(0x9d)]=function(_0x425bca){const _0x1a339f=_0x104491,_0x50d4f5=_0x425bca[_0x1a339f(0x7e)][_0x1a339f(0x97)];!_0x50d4f5['objectStoreNames']['contains'](_0x1a339f(0x9a))&&_0x50d4f5[_0x1a339f(0x85)](_0x1a339f(0x9a));},_0xfc1134[_0x104491(0xa7)]=()=>_0x559946(_0xfc1134[_0x104491(0x97)]),_0xfc1134['onerror']=()=>_0x2aa471(_0xfc1134[_0x104491(0x9f)]);});}async function savePrivateKeyToDB(_0x2136da){const _0x3c7a71=_0x4e9d,_0xc9005e=await openKeyDB(),_0x643084=_0xc9005e[_0x3c7a71(0x96)](_0x3c7a71(0x9a),_0x3c7a71(0x8a)),_0x4ccd6e=_0x643084[_0x3c7a71(0x87)](_0x3c7a71(0x9a));_0x4ccd6e['put'](_0x2136da,'privateKey'),await _0x643084[_0x3c7a71(0x74)],_0xc9005e[_0x3c7a71(0x7a)]();}async function loadPrivateKeyFromDB(){const _0x595b46=_0x4e9d,_0x6a76d7=await openKeyDB(),_0x4cbf3c=_0x6a76d7[_0x595b46(0x96)](_0x595b46(0x9a),_0x595b46(0x8f)),_0x1a7c52=_0x4cbf3c['objectStore']('keys');return new Promise((_0x213bc9,_0x5eafa9)=>{const _0x498144=_0x595b46,_0x5067e5=_0x1a7c52[_0x498144(0xa5)](_0x498144(0x89));_0x5067e5[_0x498144(0xa7)]=()=>{const _0x23c0ef=_0x498144;_0x6a76d7[_0x23c0ef(0x7a)](),_0x213bc9(_0x5067e5[_0x23c0ef(0x97)]);},_0x5067e5['onerror']=()=>{const _0x23c458=_0x498144;_0x6a76d7[_0x23c458(0x7a)](),_0x5eafa9(_0x5067e5[_0x23c458(0x9f)]);};});}function b64ToArrayBuffer(_0x3109bd){const _0x3b27f5=_0x4e9d,_0x41dbc4=_0x3109bd[_0x3b27f5(0x8c)](/-----BEGIN PUBLIC KEY-----/,'')[_0x3b27f5(0x8c)](/-----END PUBLIC KEY-----/,'')['replace'](/\n/g,'')[_0x3b27f5(0x8c)](/\r/g,'')[_0x3b27f5(0x8e)](),_0x144c0a=window[_0x3b27f5(0x84)](_0x41dbc4),_0xc3ed23=_0x144c0a[_0x3b27f5(0x7b)],_0x2ec3a5=new Uint8Array(_0xc3ed23);for(let _0x46cb88=0x0;_0x46cb88<_0xc3ed23;_0x46cb88++){_0x2ec3a5[_0x46cb88]=_0x144c0a[_0x3b27f5(0xa0)](_0x46cb88);}return _0x2ec3a5[_0x3b27f5(0x86)];}function arrayBufferToB64(_0x54b73d){const _0x1c935a=String['fromCharCode'](...new Uint8Array(_0x54b73d));return btoa(_0x1c935a);}async function generateRSAKeyPair(){const _0x54c21b=_0x4e9d;return await crypto['subtle'][_0x54c21b(0xa8)]({'name':_0x54c21b(0x83),'modulusLength':0x800,'publicExponent':new Uint8Array([0x1,0x0,0x1]),'hash':_0x54c21b(0xa4)},![],['encrypt',_0x54c21b(0x79)]);}async function exportPublicKey(_0x3921fa){const _0x2e3652=_0x4e9d,_0x147e11=await crypto['subtle']['exportKey'](_0x2e3652(0x90),_0x3921fa);return arrayBufferToB64(_0x147e11);}async function importServerPublicKey(_0xadd540){const _0x202ff9=_0x4e9d,_0x5b1fc1=b64ToArrayBuffer(_0xadd540);return await crypto['subtle'][_0x202ff9(0xa1)](_0x202ff9(0x90),_0x5b1fc1,{'name':_0x202ff9(0x83),'hash':_0x202ff9(0xa4)},!![],[_0x202ff9(0x81)]);}async function initializeKeys(){const _0x2f1d1e=await loadPrivateKeyFromDB();_0x2f1d1e?rsaKeyPair={'privateKey':_0x2f1d1e}:(rsaKeyPair=await generateRSAKeyPair(),await savePrivateKeyToDB(rsaKeyPair['privateKey']));}function _0x4e9d(_0x3e83fb,_0x454c34){const _0x4e2bb3=_0x4e2b();return _0x4e9d=function(_0x4e9d99,_0xedeac7){_0x4e9d99=_0x4e9d99-0x74;let _0x11132d=_0x4e2bb3[_0x4e9d99];return _0x11132d;},_0x4e9d(_0x3e83fb,_0x454c34);}async function encryptHybrid(_0x58415d,_0x6332f4){const _0x38f7d0=_0x4e9d,_0x534804=await crypto[_0x38f7d0(0x80)][_0x38f7d0(0xa8)]({'name':_0x38f7d0(0x7d),'length':0x100},!![],[_0x38f7d0(0x81),_0x38f7d0(0x79)]),_0x46707d=crypto[_0x38f7d0(0x75)](new Uint8Array(0xc)),_0xb65ac8=new TextEncoder(),_0x10cd29=_0xb65ac8[_0x38f7d0(0x93)](JSON[_0x38f7d0(0x88)](_0x58415d)),_0x26f50b=await crypto[_0x38f7d0(0x80)][_0x38f7d0(0x81)]({'name':_0x38f7d0(0x7d),'iv':_0x46707d},_0x534804,_0x10cd29),_0x12c748=new Uint8Array(_0x26f50b),_0x1c644e=_0x12c748[_0x38f7d0(0x7c)](-0x10),_0x215b0a=_0x12c748[_0x38f7d0(0x7c)](0x0,-0x10),_0x395f53=await crypto[_0x38f7d0(0x80)][_0x38f7d0(0x98)](_0x38f7d0(0x8d),_0x534804),_0x327fc6=await crypto[_0x38f7d0(0x80)][_0x38f7d0(0x81)]({'name':_0x38f7d0(0x83)},_0x6332f4,_0x395f53);return{'ciphertext':arrayBufferToB64(_0x215b0a['buffer']),'encryptedAESKey':arrayBufferToB64(_0x327fc6),'iv':arrayBufferToB64(_0x46707d['buffer']),'authTag':arrayBufferToB64(_0x1c644e['buffer'])};}async function decryptHybrid(_0x52af66,_0x33a4f0){const _0x59e6e1=_0x4e9d,{ciphertext:_0x3fd800,encryptedAESKey:_0x4d3f42,iv:_0x4a8142,authTag:_0x317978}=_0x52af66,_0x39cc52=await crypto['subtle']['decrypt']({'name':'RSA-OAEP'},_0x33a4f0,b64ToArrayBuffer(_0x4d3f42)),_0x14b4e3=await crypto['subtle'][_0x59e6e1(0xa1)](_0x59e6e1(0x8d),_0x39cc52,{'name':_0x59e6e1(0x7d)},![],[_0x59e6e1(0x79)]),_0x4d3516=new Uint8Array(b64ToArrayBuffer(_0x3fd800)),_0x9527b7=new Uint8Array(b64ToArrayBuffer(_0x317978)),_0x19525e=new Uint8Array(_0x4d3516[_0x59e6e1(0x7b)]+_0x9527b7[_0x59e6e1(0x7b)]);_0x19525e[_0x59e6e1(0x76)](_0x4d3516),_0x19525e[_0x59e6e1(0x76)](_0x9527b7,_0x4d3516['length']);const _0x28e1be=await crypto[_0x59e6e1(0x80)][_0x59e6e1(0x79)]({'name':_0x59e6e1(0x7d),'iv':b64ToArrayBuffer(_0x4a8142)},_0x14b4e3,_0x19525e[_0x59e6e1(0x86)]),_0x4086be=new TextDecoder();return JSON[_0x59e6e1(0xa2)](_0x4086be[_0x59e6e1(0xa6)](_0x28e1be));}