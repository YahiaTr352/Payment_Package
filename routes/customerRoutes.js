const express = require("express");
const limiter = require("../middlewares/limiter");
const { customerPhonePage, otpVerificationPage } = require("../controllers/pageRenderController");
const { getPaymentData, getTransactions, getTransactionsByProgrammName } = require("../controllers/transactionController");
const { generateReactCode, generateFlutterCode } = require("../controllers/codeGeneratorController");
const { exchangeKeys } = require("../controllers/encryptionController");
const { saveServer } = require("../controllers/serverHealthController.");
const { getRedirctUrl, getUrl, paymentConfirmation, resendOTP, paymentRequest, getToken } = require("../controllers/customerController");
const router = express.Router();


router.post("/save-server" , saveServer);
router.post("/get-token" ,getToken);
router.post("/payment-request" ,paymentRequest);
router.post("/payment-confirmation" ,paymentConfirmation);
router.post("/resend-otp" ,resendOTP);
router.post("/getRedirct-url" ,getRedirctUrl);
router.post("/get-url" ,getUrl);
router.post("/exchange-keys" ,exchangeKeys);
router.get("/customerPhone-page/:publicID", customerPhonePage);
router.get("/otpVerification-page/:publicID", otpVerificationPage);
router.post("/payment-data" ,getPaymentData);
router.get("/get-transactions" ,getTransactions);
router.get("/transactionsByProgrammName" ,getTransactionsByProgrammName);
router.get("/generateReactCode" ,generateReactCode);
router.get("/generateFlutterCode" ,generateFlutterCode);
module.exports = router;