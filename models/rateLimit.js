const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  points: { type: Number },
  lastReset: { type: Date, default: Date.now },
  ipList: [
    {
      ip: { type: String },
      time: { type: Date },
    }
  ],
  blockedUntil: { type: Date, default: null }, // ⛔ وقت انتهاء الحظر إن وجد
});

module.exports = mongoose.model("RateLimit", rateLimitSchema);
