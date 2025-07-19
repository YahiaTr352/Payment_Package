const EncryptionKeyModel = require("../models/keysModel");

const paymentData = require("../models/paymentDataModel");
const {
  isValidString,
  isValidNumber,
  validateMerchantPhoneNumber,
  validateCustomerPhoneNumber,
  isValidAmount,
  isValidOTP
} = require("../utils/validation");
const {
  generateRSAKeyPair,
  encryptHybrid,
  decryptHybrid,
  sendEncryptedError,
  encryptKeyGCM,
  decryptKeyGCM
} = require('../utils/encryption');
const { generateKeyPairSync } = require('crypto');
const BASE_API_URL = process.env.BASE_SYRITAL_URL;
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const getUrl = async (req, res) => {
  const { clientPublicKey } = req.body;
  const { companyName, programmName, code, merchantMSISDN, amount } = req.body;
  const isDevRequest = req.headers["x-dev-request"] === "true";

  if (!isValidString(companyName)) return isDevRequest ? res.status(400).json({message : "Invalid CompanyName"}) : res.status(204).end();
  if (!isValidString(programmName)) return isDevRequest ? res.status(400).json({message : "Invalid ProgrammName"}) : res.status(204).end();
  if (!isValidNumber(code)) return isDevRequest ? res.status(400).json({message : "Invalid Code"}) : res.status(204).end();
  if (!validateMerchantPhoneNumber(merchantMSISDN)) return isDevRequest ? res.status(400).json({message : "Invalid Merchant Phone Number"}) : res.status(204).end();
  if (!isValidAmount(amount)) return isDevRequest ? res.status(400).json({message : "Invalid Amount"}) : res.status(204).end();

  const transactionID = uuidv4();
  const publicID_phonePage = uuidv4();
  const publicID_otpPage = uuidv4();

  try {
    await paymentData.create({
          publicIDs: {
            phonePage: publicID_phonePage,
            otpPage: publicID_otpPage,
          },
      transactionID,
      companyName,
      programmName,
      code,
      merchantMSISDN,
      customerMSISDN : null,
      amount,
      otp: null,
      createdAt: new Date()
    });

    await EncryptionKeyModel.create({
      clientPublicKey : null,
      serverPrivateKey : null,
          publicIDs: {
            phonePage: publicID_phonePage,
            otpPage: publicID_otpPage,
          },
    });


    const baseUrl = process.env.BASE_PACKAGE_URL;
    const redirectUrl = `${baseUrl}/api/clients/customerPhone-page/${publicID_phonePage}`;
    return res.json({ url: redirectUrl });

  } catch (error) {
    console.error("Login error:", error);  // اطبع الخطأ هنا
    return res.status(500).json({message : "Internal server error"});
  }
};

const getToken = async (req, res) => {
  const encryptedBody = req.body;

  let decryptedData;
  let pageID = encryptedBody.pageID; // ✅ خذ pageID مباشرة من خارج البيانات المشفّرة

  if (!pageID) {
    return res.status(400).json({ message: "Missing page ID" });
  }

  let transaction;
  let clientPublicKey;
  let serverPrivateKey;
  let decryptedPrivateKey;
  let decryptedPublicKey;

  // 🧩 ابحث عن المعاملة
  try {
    transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    clientPublicKey = transaction.clientPublicKey;
    serverPrivateKey = transaction.serverPrivateKey;

    if (!serverPrivateKey || !clientPublicKey) {
      return res.status(400).json({message : "missing encryption keys."});
    }
    
     decryptedPublicKey = decryptKeyGCM(clientPublicKey);
     decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);

  } catch (e) {
    console.error("DB error:", e);
    return res.status(500).json({ message: "Database error" });
  }

  // 🔓 فك تشفير الطلب
  try {
    decryptedData = JSON.parse(decryptHybrid(encryptedBody, decryptedPrivateKey));

    // تحقق أن pageID داخل الرسالة المشفّرة يطابق الخارجي
    if (decryptedData.pageID !== pageID) {
      return sendEncryptedError(res, decryptedPublicKey, "Mismatched page ID", 400);
    } 
  } catch (e) {
    console.error("Decryption failed:", e);
    return sendEncryptedError(res, decryptedPublicKey, "Invalid encrypted payload", 400);
  }

  const { companyName, programmName, merchantMSISDN, code } = decryptedData;

  // ✅ تحقق من القيم
  if (!isValidString(companyName)) return sendEncryptedError(res, decryptedPublicKey, "Invalid CompanyName");
  if (!isValidString(programmName)) return sendEncryptedError(res, decryptedPublicKey, "Invalid ProgrammName");
  if (!validateMerchantPhoneNumber(merchantMSISDN)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Merchant Phone Number");
  if (!isValidNumber(code)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Code");

  try {
    const response = await axios.post(`${BASE_API_URL}/api/clients/get-token`, {
      programmName,
      companyName,
      merchantMSISDN,
      code,
    });

    const encryptedResponse = encryptHybrid(JSON.stringify(response.data), decryptedPublicKey);
    return res.status(200).json(encryptedResponse);

  } catch (error) {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.errorDesc;

    if (clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, errMsg || "Internal Server Error", error.response?.status || 500);
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const paymentRequest = async (req, res) => {
  const encryptedBody = req.body;

  const pageID = encryptedBody.pageID;
  if (!pageID) {
    return res.status(400).json({ message: "Missing page ID" });
  }

  let transaction;
  let clientPublicKey;
  let serverPrivateKey;
  let getKeys;
  let decryptedPublicKey;
  let decryptedPrivateKey;

  // 🔍 ابحث عن مفاتيح التشفير من قاعدة البيانات
  try {
    transaction = await paymentData.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

   getKeys = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    clientPublicKey = getKeys.clientPublicKey;
    serverPrivateKey = getKeys.serverPrivateKey;

    if (!serverPrivateKey || !clientPublicKey) {
      return res.status(400).json({message : "missing encryption keys."});
    }
    
     decryptedPublicKey = decryptKeyGCM(clientPublicKey);
     decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);

  } catch (e) {
    console.error("DB error:", e);
    return res.status(500).json({ message: "Database error" });
  }

  // 🔓 فك التشفير باستخدام المفتاح الخاص
  let decryptedData;
  try {
    decryptedData = JSON.parse(decryptHybrid(encryptedBody, decryptedPrivateKey));

    // تحقق من تطابق pageID
    if (decryptedData.pageID !== pageID) {
      return sendEncryptedError(res, decryptedPublicKey, "Mismatched page ID", 400);
    }
  } catch (err) {
    console.error("Decryption failed:", err);
    return res.status(400).json(encryptHybrid(JSON.stringify({ message: "Invalid encrypted request" }), decryptedPublicKey));
  }

  const { code, customerMSISDN, merchantMSISDN, amount, token, transactionID } = decryptedData;

  // ✅ تحقق من القيم
  if (!isValidNumber(code)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Code");
  if (!validateMerchantPhoneNumber(merchantMSISDN)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Merchant Phone Number");
  if (!validateCustomerPhoneNumber(customerMSISDN)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Customer Phone Number");
  if (!isValidAmount(amount)) return sendEncryptedError(res, decryptedPublicKey, "Invalid amount");

  // 🧾 أرسل الطلب إلى سيرفر الدفع
  try {
    const response = await axios.post(`${BASE_API_URL}/api/clients/payment-request`, {
      code,
      customerMSISDN,
      merchantMSISDN,
      transactionID,
      amount,
      token,
    });

    // 🧠 خزّن OTP إذا وُجد
   if (response.data.details?.otp && transactionID) {
  await paymentData.updateOne(
    { _id: transaction._id },
    {
      $set: {
        otp: response.data.details.otp,
        customerMSISDN // 👈 أضف هذا
      }
    }
  );
}

    // 🔐 شفر الرد وأرسله
    const encryptedResponse = encryptHybrid(JSON.stringify(response.data), decryptedPublicKey);
    return res.status(response.status).json(encryptedResponse);

  } catch (error) {
    console.error("Payment error:", error?.response?.data || error.message);

    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.errorDesc ||
      "Internal Server Error";

    return sendEncryptedError(res, decryptedPublicKey, errMsg, error.response?.status || 500);
  }
};
const paymentConfirmation = async (req, res) => {
  const encryptedBody = req.body;
  const pageID = encryptedBody.pageID; // ✅ ناخد pageID خارج البيانات المشفّرة

  if (!pageID) {
    return res.status(400).json({ message: 'Missing page ID' });
  }

  let transaction;
  let clientPublicKey;
  let serverPrivateKey;
  let getKeys;
  let decryptedPublicKey;
  let decryptedPrivateKey;

  // 🔎 ابحث عن المعاملة بالمخزن
  try {
    transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    getKeys = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    clientPublicKey = getKeys.clientPublicKey;
    serverPrivateKey = getKeys.serverPrivateKey;

    if (!serverPrivateKey || !clientPublicKey) {
       return res.status(400).json({message : "missing encryption keys."});
    }
    
     decryptedPublicKey = decryptKeyGCM(clientPublicKey);
     decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);

  } catch (e) {
    console.error("DB error:", e);
    return res.status(500).json({ message: "Database error" });
  }

  // 🔓 فك التشفير
  let decryptedData;
  try {
    decryptedData = JSON.parse(decryptHybrid(encryptedBody, decryptedPrivateKey));

    if (decryptedData.pageID !== pageID) {
      return sendEncryptedError(res, decryptedPublicKey, "Mismatched page ID", 400);
    }
  } catch (err) {
    console.error("❌ Failed to decrypt payment confirmation request:", err);
    return sendEncryptedError(res, decryptedPublicKey, "Invalid encrypted request");
  }

  const { code, merchantMSISDN, OTP, token, transactionID } = decryptedData;

  // ✅ التحقق من البيانات
  if (!transactionID) return sendEncryptedError(res, decryptedPublicKey, "Missing transaction ID");
  if (!isValidNumber(code)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Code");
  if (!validateMerchantPhoneNumber(merchantMSISDN)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Merchant Phone Number");
  if (!isValidOTP(OTP)) return sendEncryptedError(res, decryptedPublicKey, "Invalid OTP");

  try {
    // 📨 أرسل البيانات لـ Syriatel
    const response = await axios.post(`${BASE_API_URL}/api/clients/payment-confirmation`, {
      code,
      transactionID,
      merchantMSISDN,
      OTP,
      token,
    });

    // ✅ تحديث successPayment = true
      await paymentData.updateOne(
        { _id: transaction._id },
        { $set: { paymentSuccess: true } }
      );


    // 🔐 تشفير الرد
    const encryptedResponse = encryptHybrid(JSON.stringify(response.data), decryptedPublicKey);
    return res.status(response.status).json(encryptedResponse);

  } catch (error) {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.errorDesc;

    if (error.response && clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, errMsg, error.response.status);
    }

    if (clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, "Internal Server Error", 500);
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getRedirctUrl = async (req, res) => {
  const encryptedBody = req.body;
  const pageID = req.body.pageID;

  if (!pageID) {
    return res.status(400).json({ message: 'Missing page ID' });
  }

  let transaction;
  let clientPublicKey;
  let serverPrivateKey;
  let decryptedPublicKey;
  let decryptedPrivateKey;

  // 📦 جلب المفاتيح من قاعدة البيانات
  try {
    transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    clientPublicKey = transaction.clientPublicKey;
    serverPrivateKey = transaction.serverPrivateKey;

    if (!serverPrivateKey || !clientPublicKey) {
          return res.status(400).json({message : "missing encryption keys."});
    }
    
     decryptedPublicKey = decryptKeyGCM(clientPublicKey);
     decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);
  } catch (e) {
    console.error("❌ Database error:", e);
    return res.status(500).json({ message: "Database error" });
  }

  // 🔓 فك التشفير
  let decryptedData;
  try {
    const decryptedString = decryptHybrid(encryptedBody, decryptedPrivateKey);
    decryptedData = JSON.parse(decryptedString);

    if (decryptedData.pageID !== pageID) {
      return sendEncryptedError(res, decryptedPublicKey, "Mismatched page ID", 400);
    }
  } catch (err) {
    console.error("❌ Decryption failed in getRedirctUrl:", err);
    return sendEncryptedError(res, decryptedPublicKey, "Invalid encrypted payload", 400);
  }

  const { code, companyName, programmName } = decryptedData;

  // ✅ التحقق من البيانات
  if (!code || !companyName || !programmName) {
    return sendEncryptedError(res, decryptedPublicKey, "All fields are required.");
  }
  if (!isValidString(companyName)) {
    return sendEncryptedError(res, decryptedPublicKey, "Invalid CompanyName");
  }
  if (!isValidString(programmName)) {
    return sendEncryptedError(res, decryptedPublicKey, "Invalid ProgrammName");
  }
  if (!isValidNumber(code)) {
    return sendEncryptedError(res, decryptedPublicKey, "Invalid Code");
  }

  try {
    // 📡 إرسال الطلب إلى Syritel
    const response = await axios.post(`${BASE_API_URL}/api/clients/get-url`, {
      companyName,
      programmName,
      code,
    });

    // 🔐 تشفير الرد
    const encryptedResponse = encryptHybrid(JSON.stringify(response.data), decryptedPublicKey);
    return res.status(response.status).json(encryptedResponse);

  } catch (error) {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.errorDesc;

    if (error.response && clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, errMsg, error.response.status);
    }

    if (clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, "Internal Server Error", 500);
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const resendOTP = async (req, res) => {
  const encryptedBody = req.body;
  const pageID = encryptedBody.pageID; // ✅ ناخذ pageID خارج التشفير

  if (!pageID) {
    return res.status(400).json({ message: 'Missing page ID' });
  }

  let transaction;
  let clientPublicKey;
  let serverPrivateKey;
  let decryptedPrivateKey;
  let decryptedPublicKey;

  // 🔍 ابحث عن المعاملة باستخدام pageID
  try {
    transaction = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": pageID },
        { "publicIDs.otpPage": pageID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    clientPublicKey = transaction.clientPublicKey;
    serverPrivateKey = transaction.serverPrivateKey;

    if (!serverPrivateKey || !clientPublicKey) {
      return sendEncryptedError(res, clientPublicKey, "Missing encryption keys", 401);
    }
    
     decryptedPublicKey = decryptKeyGCM(clientPublicKey);
     decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);

  } catch (e) {
    console.error("Database error:", e);
    return res.status(500).json({ message: "Database error" });
  }

  // 🔓 فك التشفير
  let decryptedData;
  try {
    const decryptedString = decryptHybrid(encryptedBody, decryptedPrivateKey);
    decryptedData = JSON.parse(decryptedString);

    // ✅ تحقق من تطابق pageID داخل التشفير مع الخارجي
    if (decryptedData.pageID !== pageID) {
      return sendEncryptedError(res, decryptedPublicKey, "Mismatched page ID", 400);
    }
  } catch (err) {
    console.error("❌ Decryption failed in resendOTP:", err);
    return sendEncryptedError(res, decryptedPublicKey, "Invalid encrypted payload");
  }

  const { code, merchantMSISDN, token, transactionID } = decryptedData;

  // ✅ التحقق من البيانات
  if (!transactionID) return sendEncryptedError(res, decryptedPublicKey, "Missing transaction ID");
  if (!isValidNumber(code)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Code");
  if (!validateMerchantPhoneNumber(merchantMSISDN)) return sendEncryptedError(res, decryptedPublicKey, "Invalid Merchant Phone Number");

  try {
    // 📡 إرسال الطلب إلى Syritel
    const response = await axios.post(`${BASE_API_URL}/api/clients/resend-otp`, {
      code,
      transactionID,
      merchantMSISDN,
      token,
    });

    // 🔐 تشفير الرد
    const encryptedResponse = encryptHybrid(JSON.stringify(response.data), decryptedPublicKey);
    return res.status(response.status).json(encryptedResponse);

  } catch (error) {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.errorDesc;

    if (error.response && clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, errMsg, error.response.status);
    }

    if (clientPublicKey) {
      return sendEncryptedError(res, decryptedPublicKey, "Internal Server Error", 500);
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// module.exports = {
//   saveServer,
//   getToken, // 5
//   paymentRequest, // 6
//   paymentConfirmation, // 9
//   resendOTP, 
//   getRedirctUrl, // 10
//   getUrl, //1. get url 
//   customerPhonePage, //2 rendering first page
//   otpVerificationPage, // 8
//   getPaymentData, // 4.get transcation data
//   exchangeKeys, // 3 exchange public keys 
//   getTransactions,
//   getTransactionsByProgrammName,
//   generateReactCode,
//   generateFlutterCode,
// };
module.exports = {
  getToken, // 5
  paymentRequest, // 6
  paymentConfirmation, // 9
  resendOTP, 
  getRedirctUrl, // 10
  getUrl, //1. get url 
};