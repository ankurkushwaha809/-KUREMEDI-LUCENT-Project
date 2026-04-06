import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const options = {};
    if (process.env.MONGO_DB_NAME) {
      options.dbName = process.env.MONGO_DB_NAME;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    process.exit(1);
  }
};

export default connectDB;
