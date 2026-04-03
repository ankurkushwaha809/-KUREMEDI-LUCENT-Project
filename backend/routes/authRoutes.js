import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../model/User.js";
import Agent from "../model/Agent.js";
import Otp from "../model/Otp.js";
import { protect } from "../middleware/protect.js";
import { authorizeRoles } from "../middleware/authorize.js";
import { requireAgent } from "../middleware/requireAgent.js";
import { sendOtpSms } from "../utils/smsService.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Multer config for KYC uploads
const kycDir = "uploads/kyc";
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, kycDir),
  filename: (req, file, cb) => {
    const raw = file.originalname || "";
    const ext = path.extname(raw) || ".pdf";
    const name = `${Date.now()}-${crypto.randomInt(1000, 9999)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const generateToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();
const stripPassword = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// ----------------------
// 1. SEND OTP (phone only - no user check)
// ----------------------
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !String(phone).trim())
      return res.status(400).json({ message: "Phone number is required" });

    const normalizedPhone = String(phone).trim();
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phone: normalizedPhone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send SMS via Twilio
    const smsResult = await sendOtpSms(normalizedPhone, otp);
    if (!smsResult.success) {
      console.error("Twilio SMS failed:", smsResult.error);
      if (process.env.NODE_ENV !== "production") {
        return res.json({
          message: "OTP generated (Twilio not configured - use devOtp for testing)",
          devOtp: otp,
        });
      }
      return res.status(503).json({ message: "Failed to send OTP" });
    }

    res.json({
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// 2. VERIFY OTP (phone + otp) -> login if exists, else needsRegistration
// ----------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required" });

    const normalizedPhone = String(phone).trim();
    const otpDoc = await Otp.findOne({
      phone: normalizedPhone,
      otp: String(otp).trim(),
    });

    if (!otpDoc)
      return res.status(401).json({ message: "Invalid or expired OTP" });
    if (new Date() > otpDoc.expiresAt)
      return res.status(401).json({ message: "OTP has expired" });

    await Otp.deleteOne({ _id: otpDoc._id });

    const user = await User.findOne({ phone: normalizedPhone });
    if (user) {
      const isMrApp = String(req.headers["x-app"] || "").toLowerCase() === "mr";
      if (isMrApp && user.role !== "agent") {
        return res.status(403).json({
          message: "This app is for agents only. Your number is registered as a customer.",
          code: "NOT_AGENT",
        });
      }
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({
        message: "Login successful",
        user: userObj,
        token: generateToken({ id: user._id }),
      });
    }

    // First-time user: return tempToken for complete-registration
    const tempToken = generateToken(
      { phone: normalizedPhone, verified: true },
      "10m"
    );
    res.json({
      message: "Complete registration",
      needsRegistration: true,
      phone: normalizedPhone,
      tempToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// 3. COMPLETE REGISTRATION (first-time user: name, email, referralCode)
// Retailer app (no x-app): role "user", referredBy from agent's referralCode.
// MR app (x-app: mr): role "agent", create Agent, referralCode from Agent.
// ----------------------
router.post("/complete-registration", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Temp token required" });

    let decoded;
    try {
      decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    if (!decoded.verified || !decoded.phone)
      return res.status(401).json({ message: "Invalid token" });

    const { name, email, password, referralCode } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });

    const normalizedEmail = normalizeEmail(email);
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail)
      return res.status(400).json({ message: "Email already registered" });

    const existingPhone = await User.findOne({ phone: decoded.phone });
    if (existingPhone)
      return res.status(400).json({ message: "Phone already registered" });

    // Resolve referrer by referral code: check User first, then Agent (so both agent MRxxx and retailer REFxxx codes work)
    let referredBy = null;
    const code = referralCode != null ? String(referralCode).trim() : "";
    if (code) {
      const codeUpper = code.toUpperCase();
      let referrerUser = await User.findOne({ referralCode: codeUpper });
      if (referrerUser) {
        referredBy = referrerUser._id;
      } else {
        const referrerAgent = await Agent.findOne({ referralCode: codeUpper });
        if (referrerAgent && referrerAgent.user) {
          referredBy = referrerAgent.user;
          // Sync Agent's code to User so future lookups work
          await User.findByIdAndUpdate(referrerAgent.user, { referralCode: codeUpper });
        }
      }
    }

    const isMrApp = String(req.headers["x-app"] || "").toLowerCase() === "mr";
    const trimmedPassword = password != null ? String(password).trim() : "";
    if (trimmedPassword && trimmedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const passwordToStore = trimmedPassword || crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(passwordToStore, 10);

    if (isMrApp) {
      // MR app: create agent + Agent
      const newUser = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        phone: decoded.phone,
        password: hashedPassword,
        referredBy,
        role: "agent",
      });

      let referredByAgent = null;
      if (referredBy) {
        const refAgent = await Agent.findOne({ user: referredBy });
        if (refAgent) referredByAgent = refAgent._id;
      }

      const agent = await Agent.create({
        user: newUser._id,
        name: String(name).trim(),
        email: normalizedEmail,
        phone: decoded.phone,
        referredBy: referredByAgent,
      });
      newUser.referralCode = agent.referralCode;
      await newUser.save();

      return res.status(201).json({
        message: "Registration complete",
        user: stripPassword(newUser),
        token: generateToken({ id: newUser._id }),
      });
    }

    // Retailer app: create user only, set referredBy from referral code
    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: decoded.phone,
      password: hashedPassword,
      referredBy,
      role: "user",
    });

    res.status(201).json({
      message: "Registration complete",
      user: stripPassword(newUser),
      token: generateToken({ id: newUser._id }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// PASSWORD RESET FLOW (phone OTP -> new password)
// ----------------------
router.post("/password-reset/send-otp", async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "No account found for this phone number" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    const smsResult = await sendOtpSms(phone, otp);
    if (!smsResult.success) {
      if (process.env.NODE_ENV !== "production") {
        return res.json({
          message: "OTP generated (Twilio not configured - use devOtp for testing)",
          devOtp: otp,
        });
      }
      return res.status(503).json({ message: "Failed to send OTP" });
    }

    res.json({
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/password-reset/verify-otp", async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const otp = String(req.body?.otp || "").trim();
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const otpDoc = await Otp.findOne({ phone, otp });
    if (!otpDoc) return res.status(401).json({ message: "Invalid or expired OTP" });
    if (new Date() > otpDoc.expiresAt) return res.status(401).json({ message: "OTP has expired" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "No account found for this phone number" });

    await Otp.deleteOne({ _id: otpDoc._id });

    const tempToken = generateToken({ phone, userId: user._id, passwordReset: true }, "10m");
    res.json({
      message: "OTP verified",
      tempToken,
      user: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/password-reset/complete", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Temp token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!decoded.passwordReset || !decoded.phone || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { password, email } = req.body;
    const trimmedPassword = String(password || "").trim();
    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email != null && String(email).trim() !== ""
      ? normalizeEmail(email)
      : "";

    const user = await User.findById(decoded.userId);
    if (!user || normalizePhone(user.phone) !== normalizePhone(decoded.phone)) {
      return res.status(404).json({ message: "User not found" });
    }

    if (normalizedEmail) {
      const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      user.email = normalizedEmail;
    }

    user.password = await bcrypt.hash(trimmedPassword, 10);
    await user.save();

    res.json({
      message: "Password updated successfully",
      user: stripPassword(user),
      token: generateToken({ id: user._id }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// SIGNUP (email + password, optional referralCode)
// ----------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;

    if (!name || !email || !password || !phone)
      return res.status(400).json({ message: "All fields are required" });

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });
    if (existingUser) {
      if (existingUser.email === normalizedEmail)
        return res.status(400).json({ message: "Email already exists" });
      return res.status(400).json({ message: "Phone already exists" });
    }

    let referredBy = null;
    if (referralCode && String(referralCode).trim()) {
      const referrer = await User.findOne({
        referralCode: String(referralCode).trim().toUpperCase(),
      });
      if (referrer) referredBy = referrer._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      referredBy,
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      message: "Signup successful",
      user: userObj,
      token: generateToken({ id: newUser._id }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// LOGIN (email + password)
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.password)
      return res.status(401).json({
        message: "This account uses OTP login. Use phone + OTP.",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: stripPassword(user),
      token: generateToken({ id: user._id }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// KYC Submission (protected, upload docs)
// ----------------------
router.put(
  "/kyc",
  protect,
  upload.fields([
    { name: "aadharDoc", maxCount: 1 },
    { name: "drugLicenseDoc", maxCount: 1 },
    { name: "gstDoc", maxCount: 1 },
    { name: "panDoc", maxCount: 1 },
    { name: "shopImage", maxCount: 1 },
    { name: "cancelChequeDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const {
        aadharNumber,
        drugLicenseNumber,
        gstNumber,
        panNumber,
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
      } = req.body;

      if (aadharNumber) user.aadharNumber = aadharNumber;
      if (drugLicenseNumber) user.drugLicenseNumber = drugLicenseNumber;
      if (gstNumber) user.gstNumber = gstNumber;
      if (panNumber) user.panNumber = panNumber;
      if (bankName) user.bankName = bankName;
      if (accountHolderName) user.accountHolderName = accountHolderName;
      if (accountNumber) user.accountNumber = accountNumber;
      if (ifscCode) user.ifscCode = ifscCode;

      const files = req.files;
      if (files?.aadharDoc)
        user.aadharDoc = `kyc/${files.aadharDoc[0].filename}`;
      if (files?.drugLicenseDoc)
        user.drugLicenseDoc = `kyc/${files.drugLicenseDoc[0].filename}`;
      if (files?.gstDoc)
        user.gstDoc = `kyc/${files.gstDoc[0].filename}`;
      if (files?.panDoc)
        user.panDoc = `kyc/${files.panDoc[0].filename}`;
      if (files?.shopImage)
        user.shopImage = `kyc/${files.shopImage[0].filename}`;
      if (files?.cancelChequeDoc)
        user.cancelChequeDoc = `kyc/${files.cancelChequeDoc[0].filename}`;

      user.kyc = "PENDING";
      await user.save();

      const agent = await Agent.findOne({ user: user._id });
      if (agent) {
        agent.aadharNumber = user.aadharNumber;
        agent.panNumber = user.panNumber;
        agent.drugLicenseNumber = user.drugLicenseNumber;
        agent.gstNumber = user.gstNumber;
        agent.bankName = user.bankName;
        agent.accountHolderName = user.accountHolderName;
        agent.accountNumber = user.accountNumber;
        agent.ifscCode = user.ifscCode;
        agent.kycStatus = "PENDING";
        if (files?.aadharDoc) agent.aadharDoc = `kyc/${files.aadharDoc[0].filename}`;
        if (files?.panDoc) agent.panDoc = `kyc/${files.panDoc[0].filename}`;
        if (files?.cancelChequeDoc) agent.cancelChequeDoc = `kyc/${files.cancelChequeDoc[0].filename}`;
        if (files?.drugLicenseDoc) agent.drugLicenseDoc = `kyc/${files.drugLicenseDoc[0].filename}`;
        if (files?.gstDoc) agent.gstDoc = `kyc/${files.gstDoc[0].filename}`;
        await agent.save();
      }

      const userObj = user.toObject();
      delete userObj.password;

      res.json({ message: "KYC submitted successfully", user: userObj });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------
// Get commission summary + history (MR app; uses Agent + Commission)
// ----------------------
router.get("/commission", protect, requireAgent, async (req, res) => {
  try {
    const agent = await Agent.findOne({ user: req.user._id });
    if (!agent) {
      return res.json({ totalEarned: 0, pending: 0, entries: [] });
    }
    const Commission = (await import("../model/Commission.js")).default;
    const entries = await Commission.find({ agent: agent._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({
      totalEarned: agent.totalEarned ?? 0,
      pending: agent.totalPending ?? 0,
      entries: entries.map((e) => ({
        _id: e._id,
        amount: e.amount,
        type: e.type,
        description: e.description,
        status: e.status,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Get my profile (includes referralCode, referredBy)
// For agents: ensure referralCode is set from Agent if missing on User
// ----------------------
router.get("/me", protect, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .select("-password")
      .populate("referredBy", "name referralCode");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "agent" && !user.referralCode) {
      const agent = await Agent.findOne({ user: user._id });
      if (agent && agent.referralCode) {
        user.referralCode = agent.referralCode;
        await user.save();
      }
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Update my profile (name, email)
// ----------------------
router.put("/me", protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = String(name).trim();
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: "Email already in use" });
      user.email = normalizedEmail;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Get all users (admin only)
// ----------------------
router.get("/users", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("referredBy", "name referralCode")
      .sort({ createdAt: -1 });
    res.json({ total: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Update KYC status (admin only)
// ----------------------
router.put("/kyc-status/:userId", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    let status = req.body?.status ?? req.body?.kycStatus;
    if (status === undefined && typeof req.body?.isVerified === "boolean")
      status = req.body.isVerified ? "APPROVED" : "REJECTED";
    const valid = ["APPROVED", "REJECTED", "PENDING", "BLANK"];
    if (!status || !valid.includes(status))
      return res
        .status(400)
        .json({ message: `Status must be one of: ${valid.join(", ")}` });

    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const wasApproved = user.kyc === "APPROVED";
    user.kyc = status;
    user.isVerified = status === "APPROVED";
    await user.save();

    // Referral rewards when KYC approved first time (referee = user whose KYC was just approved)
    // R→R: both get ₹50; MR→R: MR ₹500, retailer ₹50; MR→MR: both MRs get ₹700
    if (status === "APPROVED" && !wasApproved && user.referredBy && !user.referralBonusCredited) {
      const Wallet = (await import("../model/Wallet.js")).default;
      const Config = (await import("../model/Config.js")).default;
      const Commission = (await import("../model/Commission.js")).default;
      const Agent = (await import("../model/Agent.js")).default;
      const configDoc = await Config.findOne({ key: "referralRewards" });
      const rewards = configDoc?.value && typeof configDoc.value === "object"
        ? {
            retailerReferrer: 50,
            retailerReferee: 50,
            mrToRetailerMr: 500,
            mrToRetailerRetailer: 50,
            mrToMr: 700,
            mrToMrReferrer: 700,
            mrToMrReferee: 500,
            ...configDoc.value,
          }
        : {
            retailerReferrer: 50,
            retailerReferee: 50,
            mrToRetailerMr: 500,
            mrToRetailerRetailer: 50,
            mrToMr: 700,
            mrToMrReferrer: 700,
            mrToMrReferee: 500,
          };
      const referrerId = user.referredBy?._id ?? user.referredBy;
      const refereeId = user._id;
      const refereeName = user.name || user.phone || "User";

      const creditWallet = async (userId, amount, desc) => {
        if (!amount || amount <= 0) return;
        let w = await Wallet.findOne({ user: userId });
        if (!w) w = await Wallet.create({ user: userId, balance: 0 });
        const newBal = (w.balance ?? 0) + amount;
        w.balance = newBal;
        w.transactions.push({
          amount,
          type: "CREDIT",
          description: desc,
          reference: `REF-${refereeId}`,
          balanceAfter: newBal,
        });
        await w.save();
      };

      const referrer = await User.findById(referrerId);
      const referrerAgent = referrer ? await Agent.findOne({ user: referrerId }) : null;
      const refereeAgent = await Agent.findOne({ user: refereeId });

      if (referrerAgent && refereeAgent) {
        // MR → MR: separate amounts for referrer and new MR
        const refAmt = Number(
          rewards.mrToMrReferrer ?? rewards.mrToMr
        ) || 0;
        const newAmt = Number(
          rewards.mrToMrReferee ?? rewards.mrToMr
        ) || 0;

        if (refAmt > 0) {
          const referrerName = (referrer && (referrer.name || referrer.phone)) || "MR";

          // Referrer MR
          referrerAgent.totalEarned = (referrerAgent.totalEarned || 0) + refAmt;
          await referrerAgent.save();
          await Commission.create({
            agent: referrerAgent._id,
            amount: refAmt,
            type: "REFERRAL",
            description: `Referred MR: ${refereeName}`,
            status: "CREDITED",
            reference: String(refereeId),
          });
          await creditWallet(referrerId, refAmt, "Referral bonus (MR referred)");
        }

        if (newAmt > 0) {
          const referrerName = (referrer && (referrer.name || referrer.phone)) || "MR";

          // New MR (referee)
          refereeAgent.totalEarned = (refereeAgent.totalEarned || 0) + newAmt;
          await refereeAgent.save();
          await Commission.create({
            agent: refereeAgent._id,
            amount: newAmt,
            type: "BONUS",
            description: `Signup bonus via MR referral: ${referrerName}`,
            status: "CREDITED",
            reference: String(referrerId),
          });
          await creditWallet(
            refereeId,
            newAmt,
            "Referral bonus (Joined with MR referral)"
          );
        }
      } else if (referrerAgent && !refereeAgent) {
        // MR → Retailer: MR gets ₹500, retailer gets ₹50 (Commission + Wallet for both)
        const mrAmt = Number(rewards.mrToRetailerMr) || 0;
        const retailAmt = Number(rewards.mrToRetailerRetailer) || 0;
        if (mrAmt > 0) {
          referrerAgent.retailersOnboarded = (referrerAgent.retailersOnboarded || 0) + 1;
          referrerAgent.totalEarned = (referrerAgent.totalEarned || 0) + mrAmt;
          await referrerAgent.save();
          await Commission.create({
            agent: referrerAgent._id,
            amount: mrAmt,
            type: "REFERRAL",
            description: `Retailer KYC approved: ${refereeName}`,
            status: "CREDITED",
            reference: String(refereeId),
          });
          await creditWallet(referrerId, mrAmt, "Referral bonus (Retailer KYC approved)");
        }
        if (retailAmt > 0) {
          await creditWallet(refereeId, retailAmt, "Referral bonus (KYC completed)");
        }
      } else {
        // Retailer → Retailer: both get ₹50
        const referrerAmt = Number(rewards.retailerReferrer) || 0;
        const refereeAmt = Number(rewards.retailerReferee) || 0;
        if (referrerAmt > 0) {
          await creditWallet(referrerId, referrerAmt, "Referral bonus (KYC completed)");
        }
        if (refereeAmt > 0) {
          await creditWallet(refereeId, refereeAmt, "Referral bonus (KYC completed)");
        }
      }

      user.referralBonusCredited = true;
      await user.save();
    }

    const obj = user.toObject();
    delete obj.password;

    res.json({ message: "KYC status updated", user: obj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// Admin: reprocess referral reward for a user (e.g. KYC was approved but reward was not credited)
// ----------------------

router.post(
  "/reprocess-referral-reward/:userId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.kyc !== "APPROVED")
        return res.status(400).json({ message: "User KYC is not APPROVED" });
      if (!user.referredBy)
        return res.status(400).json({ message: "User was not referred by anyone" });
      if (user.referralBonusCredited)
        return res.status(400).json({ message: "Referral bonus already credited for this user" });

      const Wallet = (await import("../model/Wallet.js")).default;
      const Config = (await import("../model/Config.js")).default;
      const Commission = (await import("../model/Commission.js")).default;
      const Agent = (await import("../model/Agent.js")).default;
      const configDoc = await Config.findOne({ key: "referralRewards" });
      const rewards = configDoc?.value && typeof configDoc.value === "object"
        ? { retailerReferrer: 50, retailerReferee: 50, mrToRetailerMr: 500, mrToRetailerRetailer: 50, mrToMr: 700, ...configDoc.value }
        : { retailerReferrer: 50, retailerReferee: 50, mrToRetailerMr: 500, mrToRetailerRetailer: 50, mrToMr: 700 };
      const referrerId = user.referredBy?._id ?? user.referredBy;
      const refereeId = user._id;
      const refereeName = user.name || user.phone || "User";

      const creditWallet = async (userId, amount, desc) => {
        if (!amount || amount <= 0) return;
        let w = await Wallet.findOne({ user: userId });
        if (!w) w = await Wallet.create({ user: userId, balance: 0 });
        const newBal = (w.balance ?? 0) + amount;
        w.balance = newBal;
        w.transactions.push({
          amount,
          type: "CREDIT",
          description: desc,
          reference: `REF-${refereeId}`,
          balanceAfter: newBal,
        });
        await w.save();
      };

      const referrer = await User.findById(referrerId);
      const referrerAgent = referrer ? await Agent.findOne({ user: referrerId }) : null;
      const refereeAgent = await Agent.findOne({ user: refereeId });

      if (referrerAgent && refereeAgent) {
        const amt = Number(rewards.mrToMr) || 0;
        if (amt > 0) {
          const referrerName = (referrer && (referrer.name || referrer.phone)) || "MR";

          // Referrer MR
          referrerAgent.totalEarned = (referrerAgent.totalEarned || 0) + amt;
          await referrerAgent.save();
          await Commission.create({
            agent: referrerAgent._id,
            amount: amt,
            type: "REFERRAL",
            description: `Referred MR: ${refereeName}`,
            status: "CREDITED",
            reference: String(refereeId),
          });
          await creditWallet(referrerId, amt, "Referral bonus (MR referred)");

          // New MR (referee)
          refereeAgent.totalEarned = (refereeAgent.totalEarned || 0) + amt;
          await refereeAgent.save();
          await Commission.create({
            agent: refereeAgent._id,
            amount: amt,
            type: "BONUS",
            description: `Signup bonus via MR referral: ${referrerName}`,
            status: "CREDITED",
            reference: String(referrerId),
          });
          await creditWallet(refereeId, amt, "Referral bonus (Joined with MR referral)");
        }
      } else if (referrerAgent && !refereeAgent) {
        const mrAmt = Number(rewards.mrToRetailerMr) || 0;
        const retailAmt = Number(rewards.mrToRetailerRetailer) || 0;
        if (mrAmt > 0) {
          referrerAgent.retailersOnboarded = (referrerAgent.retailersOnboarded || 0) + 1;
          referrerAgent.totalEarned = (referrerAgent.totalEarned || 0) + mrAmt;
          await referrerAgent.save();
          await Commission.create({
            agent: referrerAgent._id,
            amount: mrAmt,
            type: "REFERRAL",
            description: `Retailer KYC approved: ${refereeName}`,
            status: "CREDITED",
            reference: String(refereeId),
          });
          await creditWallet(referrerId, mrAmt, "Referral bonus (Retailer KYC approved)");
        }
        if (retailAmt > 0) {
          await creditWallet(refereeId, retailAmt, "Referral bonus (KYC completed)");
        }
      } else {
        const referrerAmt = Number(rewards.retailerReferrer) || 0;
        const refereeAmt = Number(rewards.retailerReferee) || 0;
        if (referrerAmt > 0) {
          await creditWallet(referrerId, referrerAmt, "Referral bonus (KYC completed)");
        }
        if (refereeAmt > 0) {
          await creditWallet(refereeId, refereeAmt, "Referral bonus (KYC completed)");
        }
      }

      user.referralBonusCredited = true;
      await user.save();

      res.json({
        message: "Referral reward credited successfully",
        credited: true,
        user: { _id: user._id, referralBonusCredited: user.referralBonusCredited },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
