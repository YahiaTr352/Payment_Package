const EncryptionKeyModel = require("../models/keysModel");

const { v4: uuidv4 } = require("uuid");
const customerPhonePage = async (req, res) => {
  const { publicID } = req.params;

  try {
    const transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": publicID },
        { "publicIDs.otpPage": publicID }
      ]
    });

    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }

      let userId = req.cookies?.userID;

      if (!userId) {
            userId = uuidv4();

            res.cookie("userID", userId, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
          });
      }

    res.render("pages/customerPhone/customerPhone");

  } catch (err) {
    console.error("MongoDB error:", err);
    return res.status(500).send("Server error");
  }
};

const otpVerificationPage = async(req, res) => {
  const { publicID } = req.params;

  try {

    const transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": publicID },
        { "publicIDs.otpPage": publicID }
      ]
    });

    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }

  res.render("pages/otpVerification/otpVerification");

  } catch (err) {
    console.error("MongoDB error:", err);
    return res.status(500).send("Server error");
  }

};

module.exports = {
  customerPhonePage, //2 rendering first page
  otpVerificationPage, // 8
};