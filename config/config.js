const mongoose = require("mongoose");

const uri = process.env.CONNECT_MAIN_DATABASE;

const ConnectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ connected to MongoDB");
  } catch (error) {
    console.error("❌ failed to connect to MongoDB");
    console.error(error);
  }
};

module.exports = ConnectDB;
