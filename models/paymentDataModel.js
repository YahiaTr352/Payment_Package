const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  publicIDs: {
    phonePage: { type: String, required: true },
    otpPage: { type: String, required: true },
  },
  transactionID: { type: String, required: true, unique: true },
  companyName: {type : String},
  programmName:{type : String},
  code: Number,
  merchantMSISDN: {type : String},
  customerMSISDN: {type : String},
  amount:{type : Number},
  otp: { type: String, default: null },
  paymentSuccess: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});

const paymentData = mongoose.model("Transaction", transactionSchema);

module.exports = paymentData;
