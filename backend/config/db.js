import mongoose from "mongoose";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const maxRetries = Number(process.env.MONGO_MAX_RETRIES || 5);
  const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const options = {
        serverSelectionTimeoutMS: Number(
          process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000
        ),
      };

      if (process.env.MONGO_DB_NAME) {
        options.dbName = process.env.MONGO_DB_NAME;
      }

      const conn = await mongoose.connect(process.env.MONGO_URI, options);
      console.log(`MongoDB Connected: ${conn.connection.name}`);
      return;
    } catch (error) {
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${maxRetries}) ❌`,
        error.message
      );

      if (attempt === maxRetries) {
        console.error("Exhausted MongoDB retries. Exiting process.");
        process.exit(1);
      }

      await wait(retryDelayMs);
    }
  }
};

export default connectDB;
