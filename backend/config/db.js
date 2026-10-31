const mongoose = require('mongoose');
module.exports = async (uri) => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('DB connection error', err);
    throw err;
  }
};
