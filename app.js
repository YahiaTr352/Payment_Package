const express = require("express");
const potatoRoutes = require("./routes/potato");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const userAgentFilter = require("./middlewares/userAgentFilter");
const cookieParser = require("cookie-parser");
const ConnectDB = require("./config/config");
const rateLimiterMiddleware = require("./middlewares/limiter");
const connectKeysDB = require("./config/keysDatabase");
require("dotenv").config(); // تحميل متغيرات البيئة من .env

const app = express();
const port = process.env.PORT || 3001;

// ✅ ضروري للسيرفرات خلف proxy مثل Vercel أو Heroku
app.set('trust proxy', true);

// ✅ ملفات ثابتة (CSS, JS, صور)
app.use(express.static(path.join(__dirname, "public")));

// ✅ CORS قبل أي middleware يتعامل مع request
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}));

// ✅ مهم جداً لترتيب الطلبات بشكل صحيح
app.use(cookieParser());
app.use(express.json());

// ✅ Log أولي لتأكيد وصول الطلب للسيرفر
app.use((req, res, next) => {
  console.log(`📥 Incoming Request: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

// ✅ middleware التحديد والفلترة
app.use(rateLimiterMiddleware);

// ✅ بعد limiter (ما يعيق التنفيذ)
app.use(userAgentFilter);

// ✅ محرك العرض
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ الاتصال بقاعدة البيانات
ConnectDB();
connectKeysDB();

// ✅ إعدادات الجلسة
const sessionSecret = process.env.SESSION_SECRET || "default_session_secret";
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax"
  }
}));

// ✅ تعريف الراوتات
app.use("/api/clients", potatoRoutes);

// ✅ بدء تشغيل السيرفر
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
