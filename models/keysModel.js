const mongoose = require("mongoose");
const connectKeysDB = require("../config/keysDatabase");

const encryptedFieldSchema = new mongoose.Schema({
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true }
}, { _id: false });

const encryptionKeysSchema = new mongoose.Schema({
  clientPublicKey: encryptedFieldSchema,
  serverPrivateKey: encryptedFieldSchema,
  publicIDs: {
    phonePage: { type: String, required: true },
    otpPage: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});


const conn = connectKeysDB(); // ما في await
const EncryptionKeyModel = conn.model('EncryptionKeys', encryptionKeysSchema);

module.exports = EncryptionKeyModel;
