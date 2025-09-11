const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Connected to MongoDB`);
  } catch (error) {
    console.error(" DB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDb;