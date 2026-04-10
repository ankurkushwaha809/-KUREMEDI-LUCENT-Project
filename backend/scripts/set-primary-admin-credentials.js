import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../model/User.js";

dotenv.config();

const emailArg = String(process.argv[2] || "").trim().toLowerCase();
const passwordArg = String(process.argv[3] || "").trim();

if (!emailArg || !passwordArg) {
  console.error("Usage: node scripts/set-primary-admin-credentials.js <email> <password>");
  process.exit(1);
}

async function run() {
  try {
    const options = {};
    if (process.env.MONGO_DB_NAME) {
      options.dbName = process.env.MONGO_DB_NAME;
    }

    await mongoose.connect(process.env.MONGO_URI, options);

    const configuredPrimary = String(
      process.env.PRIMARY_ADMIN_EMAIL || "kuremedi370@gmail.com"
    )
      .trim()
      .toLowerCase();

    let user = await User.findOne({ email: configuredPrimary });
    if (!user) {
      user = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
    }

    if (!user) {
      console.error("No admin user found to update.");
      process.exit(1);
    }

    user.email = emailArg;
    user.password = await bcrypt.hash(passwordArg, 10);
    user.role = "admin";
    await user.save();

    console.log(`Updated admin credentials for user: ${user._id}`);
    console.log(`New admin email: ${user.email}`);
  } catch (error) {
    console.error("Failed to update admin credentials:", error?.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
