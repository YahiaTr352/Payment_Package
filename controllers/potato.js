const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require('crypto');
const { generateKeyPairSync } = require('crypto');
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
const paymentData = require("../models/paymentDataModel");
const getEncryptionKeyModel = require("../models/keysModel");
const EncryptionKeyModel = require("../models/keysModel");

const BASE_API_URL = process.env.BASE_SYRITAL_URL;

const saveServer = (req,res) => {
    try{
        return res.status(200).json({message : "server is running"});

    }catch(error){
        return res.status(400).json({message : "something went wrong" , error})
    }
}

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

const getPaymentData = async (req, res) => {
  let publicID;

  try {
    publicID = req.body.pageID;
    if (!publicID) {
      return res.status(400).json({ message: "Missing page ID" });
    }

    const transaction = await paymentData.findOne({
      $or: [
        { "publicIDs.phonePage": publicID },
        { "publicIDs.otpPage": publicID }
      ]
    });

    const getKeys = await EncryptionKeyModel.findOne({
      $or: [
        { "publicIDs.phonePage": publicID },
        { "publicIDs.otpPage": publicID }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    const serverPrivateKey = getKeys.serverPrivateKey;
    const clientPublicKey = getKeys.clientPublicKey;

    if (!serverPrivateKey || !clientPublicKey) {
           return res.status(400).json({message : "missing encryption keys."});
    }
    
    const decryptedPublicKey = decryptKeyGCM(clientPublicKey);
    const decryptedPrivateKey = decryptKeyGCM(serverPrivateKey);


    const otpPageID =
      transaction.publicIDs.otpPage === publicID
        ? transaction.publicIDs.phonePage
        : transaction.publicIDs.otpPage;

    const payload = {
      companyName: transaction.companyName,
      programmName: transaction.programmName,
      merchantMSISDN: transaction.merchantMSISDN,
      amount: transaction.amount,
      code: transaction.code,
      transactionID: transaction.transactionID,
      otp: transaction.otp,
      otpPageID
    };

    const encryptedResponse = encryptHybrid(JSON.stringify(payload), decryptedPublicKey);
    return res.status(200).json(encryptedResponse);

  } catch (err) {
    console.error("Decryption error:", err);
    return res.status(400).json({ message: "Invalid encrypted payload" });
  }
};

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

// const getTransactions = async (req, res) => {
//   try {
//     const allowedKeys = [
//       "merchantMSISDN",
//       "customerMSISDN",
//       "amount",
//       "transactionID",
//       "companyName",
//       "programmName",
//       "paymentSuccess"
//     ];

//     const { sortOrder, ...queryFilters } = req.query;

//     const invalidKeys = Object.keys(queryFilters).filter(
//       key => !allowedKeys.includes(key)
//     );

//     if (invalidKeys.length > 0) {
//       return res.status(400).json({
//         message: `Invalid query key(s): ${invalidKeys.join(", ")}`
//       });
//     }

//     const filter = {};

//     for (let key in queryFilters) {
//       let value = queryFilters[key];

//       if (value === "true") {
//         value = true;
//       } else if (value === "false") {
//         value = false;
//       } else if (!isNaN(Number(value)) && key === "amount") {
//         value = Number(value);
//       } else {
//           const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//           value = { $regex: escaped, $options: "i" };
//       }

//       filter[key] = value;
//     }

//     let sortOption = -1;
//     if (sortOrder === "asc") sortOption = 1;
//     else if (sortOrder === "desc") sortOption = -1;

//     const transactions = await paymentData
//       .find(filter)
//       .sort({ createdAt: sortOption })
//       .select("transactionID companyName programmName merchantMSISDN customerMSISDN amount paymentSuccess createdAt");

//     if (transactions.length === 0) {
//       return res.status(404).json({
//         message: "No matching transactions found"
//       });
//     }

//     res.status(200).json({ data: transactions });

//   } catch (err) {
//     console.error("Error fetching transactions:", err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };
const getTransactions = async (req, res) => {
  try {
    const allowedKeys = [
      "merchantmsisdn",
      "customermsisdn",
      "amount",
      "transactionid",
      "companyname",
      "programmname",
      "paymentsuccess"
    ];

    // Normalize headers to lowercase for consistent access
    const headers = Object.keys(req.headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = req.headers[key];
      return acc;
    }, {});

    const sortOrder = headers["sortorder"];
    const startDate = headers["startdate"];
    const endDate = headers["enddate"];

    const queryFilters = {};
    for (const key of allowedKeys) {
      if (headers[key] !== undefined) {
        queryFilters[key] = headers[key];
      }
    }

    const filter = {};

    // ✅ Add date filtering if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        filter.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        filter.createdAt.$lte = parsedEnd;
      }
    }

    // ✅ Process other header filters
    for (let key in queryFilters) {
      let value = queryFilters[key];

      switch (key) {
        case "paymentsuccess":
          if (value === "true") value = true;
          else if (value === "false") value = false;
          else return res.status(400).json({ message: "Invalid value for paymentSuccess" });
          break;

        case "amount":
          if (!isNaN(Number(value))) {
            value = Number(value);
          } else {
            return res.status(400).json({ message: "Invalid value for amount" });
          }
          break;

        default:
          const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          value = { $regex: escaped, $options: "i" };
      }

      // Re-map header keys to exact MongoDB field names
      const fieldMap = {
        merchantmsisdn: "merchantMSISDN",
        customermsisdn: "customerMSISDN",
        transactionid: "transactionID",
        companyname: "companyName",
        programmname: "programmName",
        paymentsuccess: "paymentSuccess"
      };

      const mongoField = fieldMap[key] || key;
      filter[mongoField] = value;
    }

    // ✅ Sorting
    let sortOption = -1;
    if (sortOrder === "asc") sortOption = 1;
    else if (sortOrder === "desc") sortOption = -1;

    const transactions = await paymentData
      .find(filter)
      .sort({ createdAt: sortOption })
      .select("transactionID companyName programmName merchantMSISDN customerMSISDN amount paymentSuccess createdAt");

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No matching transactions found" });
    }

    res.status(200).json({ data: transactions });

  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// const getTransactionsByProgrammName = async (req, res) => {
//   try {
//     const allowedKeys = [
//       "customermsisdn",
//       "amount",
//       "transactionid",
//       "paymentsuccess"
//     ];

//     // Normalize headers
//     const headers = Object.keys(req.headers).reduce((acc, key) => {
//       acc[key.toLowerCase()] = req.headers[key];
//       return acc;
//     }, {});

//     // ✅ Require programmName in headers
//     const programmName = headers["programmname"];
//     if (!programmName) {
//       return res.status(400).json({ message: "Missing required header: programmName" });
//     }

//     const sortOrder = headers["sortorder"] || "desc";
//     const queryFilters = {};

//     // ✅ Collect only allowed filter keys from headers
//     for (const key of allowedKeys) {
//       if (headers[key] !== undefined) {
//         queryFilters[key] = headers[key];
//       }
//     }

//     const filter = {};

//     // Apply programmName filter first
//     const escapedProgramm = programmName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//     filter.programmName = { $regex: escapedProgramm, $options: "i" };

//     // Process other optional filters
//     for (let key in queryFilters) {
//       let value = queryFilters[key];

//       switch (key) {
//         case "paymentsuccess":
//           if (value === "true") value = true;
//           else if (value === "false") value = false;
//           else return res.status(400).json({ message: "Invalid value for paymentSuccess" });
//           break;

//         case "amount":
//           if (!isNaN(Number(value))) {
//             value = Number(value);
//           } else {
//             return res.status(400).json({ message: "Invalid value for amount" });
//           }
//           break;

//         default:
//           const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//           value = { $regex: escaped, $options: "i" };
//       }

//       // Restore original casing for MongoDB field
//       const originalKey = key === "customermsisdn" ? "customerMSISDN"
//                         : key === "transactionid" ? "transactionID"
//                         : key === "paymentsuccess" ? "paymentSuccess"
//                         : key;
//       filter[originalKey] = value;
//     }

//     const sortOption = sortOrder === "asc" ? 1 : -1;

//     const transactions = await paymentData
//       .find(filter)
//       .sort({ createdAt: sortOption })
//       .select("transactionID companyName programmName merchantMSISDN customerMSISDN amount paymentSuccess createdAt");

//     if (transactions.length === 0) {
//       return res.status(404).json({
//         message: "No matching transactions found"
//       });
//     }

//     res.status(200).json({ data: transactions });

//   } catch (err) {
//     console.error("Error fetching transactions:", err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };
const getTransactionsByProgrammName = async (req, res) => {
  try {
    const allowedKeys = [
      "customermsisdn",
      "amount",
      "transactionid",
      "paymentsuccess"
    ];

    // Normalize headers
    const headers = Object.keys(req.headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = req.headers[key];
      return acc;
    }, {});

    // ✅ Require programmName
    const programmName = headers["programmname"];
    if (!programmName) {
      return res.status(400).json({ message: "Missing required header: programmName" });
    }

    const sortOrder = headers["sortorder"] || "desc";
    const startDate = headers["startdate"];
    const endDate = headers["enddate"];

    const queryFilters = {};

    // ✅ Collect allowed filters
    for (const key of allowedKeys) {
      if (headers[key] !== undefined) {
        queryFilters[key] = headers[key];
      }
    }

    const filter = {};

    // Filter by programmName
    const escapedProgramm = programmName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.programmName = { $regex: escapedProgramm, $options: "i" };

    // ✅ Add date range filter if present
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        filter.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        filter.createdAt.$lte = parsedEnd;
      }
    }

    // Process other optional filters
    for (let key in queryFilters) {
      let value = queryFilters[key];

      switch (key) {
        case "paymentsuccess":
          if (value === "true") value = true;
          else if (value === "false") value = false;
          else return res.status(400).json({ message: "Invalid value for paymentSuccess" });
          break;

        case "amount":
          if (!isNaN(Number(value))) {
            value = Number(value);
          } else {
            return res.status(400).json({ message: "Invalid value for amount" });
          }
          break;

        default:
          const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          value = { $regex: escaped, $options: "i" };
      }

      const originalKey = key === "customermsisdn" ? "customerMSISDN"
                        : key === "transactionid" ? "transactionID"
                        : key === "paymentsuccess" ? "paymentSuccess"
                        : key;
      filter[originalKey] = value;
    }

    const sortOption = sortOrder === "asc" ? 1 : -1;

    const transactions = await paymentData
      .find(filter)
      .sort({ createdAt: sortOption })
      .select("transactionID companyName programmName merchantMSISDN customerMSISDN amount paymentSuccess createdAt");

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "No matching transactions found"
      });
    }

    res.status(200).json({ data: transactions });

  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
};


const generateReactCode = async (req, res) => {
  const {
    companyname,
    programname,
    code,
    merchantmsisdn,
    amount,
  } = req.headers;

  if (!companyname || !programname || !code || !merchantmsisdn || !amount) {
    return res.status(400).json({
      error: "Missing required headers: companyname, programname, code, merchantmsisdn, amount",
    });
  }

  const reactCode = `
import { useEffect, useState } from "react";
import axios from "axios";

const CustomerPhonePage = () => {
  const [iframeUrl, setIframeUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchURL = async () => {
      const payload = {
        companyName: "${companyname}",
        programmName: "${programname}",
        code: "${code}",
        merchantMSISDN: "${merchantmsisdn}",
        amount: "${amount}",
      };

      try {
        const response = await axios.post(
          "https://payment-package-ocht.onrender.com/api/clients/get-url",
          payload,
          {
            headers: { 
              "Content-Type": "application/json",
              "x-dev-request": "true",
            },
          }
        );

        const { url } = response.data;
        setIframeUrl(url);
      } catch (err) {
        console.error("Failed to get URL", err);
        setError("Failed to generate payment page.");
      }
    };

    fetchURL();
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return iframeUrl ? (
    <iframe
      src={iframeUrl}
      style={{ width: "100%", height: "100vh", border: "none" }}
      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
      title="Customer Phone Page"
    />
  ) : (
    <div>Loading...</div>
  );
};

export default function App() {
  return <CustomerPhonePage />;
};
`;

  res.setHeader("Content-Type", "text/plain");
  res.send(reactCode);
}


const generateFlutterCode = async (req, res) => {
  const {
    companyname,
    programname,
    code,
    merchantmsisdn,
    amount,
  } = req.headers;

  if (!companyname || !programname || !code || !merchantmsisdn || !amount) {
    return res.status(400).json({
      error: "Missing required headers: companyname, programname, code, merchantmsisdn, amount",
    });
  }

  const reactCode = `
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

enum StatusRequest { none, loading, success, failure, offlinefailure, serverfailure }

class SyriatelPayment extends StatefulWidget {
  const SyriatelPayment({super.key});

  @override
  State<SyriatelPayment> createState() => _SyriatelPaymentState();
}

class _SyriatelPaymentState extends State<SyriatelPayment> {
  WebViewController? _controller;
  bool _isLoading = true;
  bool _paymentHandled = false;

  StatusRequest statusRequest = StatusRequest.none;
  Map<String, dynamic>? data;


  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await requestSyriatel(context);
      if (statusRequest == StatusRequest.success && data?['checkoutUrl'] != null) {
        _initPayment();
      }
    });
  }

  Future<void> requestSyriatel(BuildContext context) async {
    setState(() => statusRequest = StatusRequest.loading);
    try {
      final response = await http.post(
        Uri.parse("https://payment-package-ocht.onrender.com/api/clients/get-url"),
        headers: {
          'Content-Type': 'application/json',
          'x-dev-request': 'true',
        },
        body: jsonEncode({
          companyName: "${companyname}",
          programmName: "${programname}",
          code: "${code}",
          merchantMSISDN: "${merchantmsisdn}",
          amount: "${amount}",
        }),
      ).timeout(const Duration(minutes: 5));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded['error'] == 'This payment is already requested or not pending.') {
          setState(() => statusRequest = StatusRequest.failure);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("هذه الدفعة تم طلبها بالفعل أو ليست بانتظار المعالجة")),
          );
        } else {
          setState(() {
            data = decoded;
            statusRequest = StatusRequest.success;
          });
        }
      } else {
        setState(() => statusRequest = StatusRequest.serverfailure);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("فشل في الاتصال بالخادم")),
        );
      }
    } catch (e) {
      setState(() => statusRequest = StatusRequest.offlinefailure);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("التحقق من الاتصال بالإنترنت")),
      );
    }
  }

  void _initPayment() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) => setState(() => _isLoading = true),
          onPageFinished: (url) => setState(() => _isLoading = false),
          onNavigationRequest: (request) {
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(data!['checkoutUrl']));

    setState(() => _controller = controller);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Syriatel Payment", style: TextStyle(color: Colors.red)),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_outlined, color: Colors.red),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Builder(builder: (context) {
        if (statusRequest == StatusRequest.failure) {
          return const Center(child: Text("فشل في الطلب", style: TextStyle(color: Colors.red)));
        } else if (_controller == null) {
          return const Center(child: CircularProgressIndicator(color: Colors.red));
        } else {
          return Stack(
            children: [
              WebViewWidget(controller: _controller!),
              if (_isLoading)
                const Center(child: CircularProgressIndicator(color: Colors.red)),
            ],
          );
        }
      }),
    );
  }
}
`;

  res.setHeader("Content-Type", "text/plain");
  res.send(reactCode);
}

module.exports = {
  saveServer,
  getToken, // 5
  paymentRequest, // 6
  paymentConfirmation, // 9
  resendOTP, 
  getRedirctUrl, // 10
  getUrl, //1. get url 
  customerPhonePage, //2 rendering first page
  otpVerificationPage, // 8
  getPaymentData, // 4.get transcation data
  exchangeKeys, // 3 exchange public keys 
  getTransactions,
  getTransactionsByProgrammName,
  generateReactCode,
  generateFlutterCode,
};
