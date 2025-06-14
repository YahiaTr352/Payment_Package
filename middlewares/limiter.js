const RateLimit = require("../models/rateLimit");

const skipLimiterForStatic = (req) => {
  return (
    req.method === "OPTIONS" ||
    req.path === "/favicon.ico" ||
    req.path.match(/\.(js|css|png|jpg|ico|svg|map|woff2?)$/)
  );
};

const rateLimiterMiddleware = async (req, res, next) => {
  console.log(`🔥 rateLimiterMiddleware triggered for IP: ${req.ip}`);

  if (skipLimiterForStatic(req)) return next();

  const ip = req.ip || "";
  const userID = req.cookies?.userID || "";
  const key = userID ? `cookie_${userID}` : `ip_${ip}`;
  const isUser = userID !== "";

  try {
    let rateLimitData = await RateLimit.findOne({ key });

    if (!rateLimitData) {
      rateLimitData = new RateLimit({
        key,
        ipList: [],
        points: isUser ? 1000 : 50,
        lastReset: new Date(),
        blockedUntil: null,
      });
    }

    // ✅ تحقق إذا المستخدم محظور حالياً
    if (rateLimitData.blockedUntil && rateLimitData.blockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (rateLimitData.blockedUntil - new Date()) / (60 * 1000)
      );
      console.log(`🚫 User ${key} is currently blocked for another ${minutesLeft} min`);
      return res.status(403).json({
        errorCode: -403,
        errorDesc: `You are blocked. Try again in ${minutesLeft} minutes.`,
      });
    }

    const currentTime = new Date();
    const elapsedTime = (currentTime - rateLimitData.lastReset) / 1000;

    // ✅ Reset كل ساعة
    if (elapsedTime > 60 * 60) {
      rateLimitData.points = isUser ? 1000 : 50;
      rateLimitData.lastReset = currentTime;
      rateLimitData.ipList = [];

      // ✅ فقط نشيل الحظر إذا فعلاً انتهى
      if (!rateLimitData.blockedUntil || rateLimitData.blockedUntil <= currentTime) {
        rateLimitData.blockedUntil = null;
      }
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    rateLimitData.ipList = rateLimitData.ipList || [];

    // ✅ إذا هذا الـ IP غير موجود ضمن آخر 5 دقائق، ضيفه
    const alreadyRecorded = rateLimitData.ipList.some(
      (entry) => entry.ip === ip && entry.time > fiveMinutesAgo
    );

    if (!alreadyRecorded) {
      rateLimitData.ipList.push({ ip, time: now });
      console.log(`📥 New IP (${ip}) recorded for user: ${key}`);
    }

    // ✅ عدّ IPات مختلفة خلال آخر 5 دقايق
    const recentIPs = rateLimitData.ipList
      .filter((entry) => entry.time > fiveMinutesAgo)
      .map((entry) => entry.ip);

    const uniqueIPs = [...new Set(recentIPs)];

    console.log(`📊 Unique IPs for user ${key} in last 5 min:`, uniqueIPs.length);

    // ⛔ الحظر إذا أكثر من 3 IPs خلال 5 دقائق
    if (uniqueIPs.length >= 5) {
      const blockDurationMs = 60 * 60 * 1000; // ساعة
      rateLimitData.blockedUntil = new Date(Date.now() + blockDurationMs);

      console.log(`⛔ Blocking user ${key} for 1 hour due to IP switching`);
      await rateLimitData.save();

      return res.status(403).json({
        errorCode: -403,
        errorDesc: `Too many IP changes detected. You are blocked for 1 hour.`,
      });
    }

    // ⛔ تجاوز عدد النقاط المسموح به
    if (rateLimitData.points <= 0) {
      return res.status(429).json({
        errorCode: -429,
        errorDesc: "Too many requests. Please try again later.",
      });
    }

    // ✅ خصم نقطة وحفظ البيانات
    rateLimitData.points -= 1;
    await rateLimitData.save();

    next();
  } catch (err) {
    console.error("Rate limiting error:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = rateLimiterMiddleware;
