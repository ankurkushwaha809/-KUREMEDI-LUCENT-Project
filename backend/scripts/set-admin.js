/**
 * Set a user as admin by email. Run from backend folder:
 *   node scripts/set-admin.js your@email.com
 *
 * The user must already exist (e.g. created via app login). Then log in to the
 * admin panel with this email and your password to access Agent Management etc.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../model/User.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.js <email>");
  process.exit(1);
}

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error("No user found with email:", email);
      process.exit(1);
    }
    user.role = "admin";
    await user.save();
    console.log("Done. User", email, "is now an admin. Log in to the admin panel with this email.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setAdmin();
