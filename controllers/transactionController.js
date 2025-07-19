const EncryptionKeyModel = require("../models/keysModel");
const paymentData = require("../models/paymentDataModel");

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
module.exports = {
  getPaymentData, // 4.get transcation data
  getTransactions,
  getTransactionsByProgrammName,
};
