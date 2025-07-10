const express = require("express");
const { paymentRequest, getToken, paymentConfirmation, resendOTP, customerPhonePage, otpVerificationPage, getPaymentData, getBaseURL, getUrl, getRedirctUrl, exchangeKeys, saveServer, getTransactions, getTransactionsByCompany,getTransactionsByProgrammName } = require("../controllers/potato");
const limiter = require("../middlewares/limiter");
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
module.exports = router;