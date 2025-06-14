const mongoose = require('mongoose');

let keysConnection;
const uri = process.env.CONNECT_SECONDARY_DATABASE;

const connectKeysDB = () => {
  if (keysConnection) return keysConnection;

  keysConnection = mongoose.createConnection(uri);

  keysConnection.on('connected', () => {
    console.log('✅ Connected to Keys DB');
  });

  keysConnection.on('error', (err) => {
    console.error('❌ Error in Keys DB connection:', err);
  });

  return keysConnection;
};

module.exports = connectKeysDB;
