const EncryptionKeyModel = require("../models/keysModel");

const exchangeKeys = async (req, res) => {
  const { clientPublicKey, phonePageID } = req.body;

  if (!clientPublicKey || !phonePageID) {
    return res.status(400).json({ message: 'Missing client public key or phonePageID' });
  }

  try {
    const { publicKey, privateKey } = generateRSAKeyPair();

    const encryptedPublicKey = encryptKeyGCM(clientPublicKey);
    const encryptedPrivateKey = encryptKeyGCM(privateKey);

    const updated = await EncryptionKeyModel.findOneAndUpdate(
      {
        $or: [
          { "publicIDs.phonePage": phonePageID },
          { "publicIDs.otpPage": phonePageID }
        ]
      },
      {
        clientPublicKey : encryptedPublicKey,
        serverPrivateKey: encryptedPrivateKey
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found for given phonePageID" });
    }

    return res.status(200).json({ serverPublicKey: publicKey });

  } catch (error) {
    console.error('Key generation error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
module.exports = {
  exchangeKeys, // 3 exchange public keys 
};