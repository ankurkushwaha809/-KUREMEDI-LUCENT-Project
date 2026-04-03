import express from "express";
import Config from "../model/Config.js";

const router = express.Router();

const REFERRAL_AMOUNT_KEY = "referralBonusAmount";
const REFERRAL_REWARDS_KEY = "referralRewards";

const DEFAULT_REWARDS = {
  retailerReferrer: 50,       // Retailer → Retailer: referrer gets ₹50
  retailerReferee: 50,        // Retailer → Retailer: referee gets ₹50
  mrToRetailerMr: 500,        // MR → Retailer: MR gets ₹500
  mrToRetailerRetailer: 50,   // MR → Retailer: retailer gets ₹50
  mrToMr: 700,                // MR → MR: legacy single amount (kept for backward compatibility)
  mrToMrReferrer: 700,        // MR → MR: default referrer MR amount
  mrToMrReferee: 500,         // MR → MR: default new MR amount
};

async function getReferralRewards() {
  const doc = await Config.findOne({ key: REFERRAL_REWARDS_KEY });
  const v = doc?.value;
  if (v && typeof v === "object") {
    return { ...DEFAULT_REWARDS, ...v };
  }
  return { ...DEFAULT_REWARDS };
}

/**
 * GET /api/config/referral-amount
 * Get single referral bonus amount (legacy - used by app)
 */
router.get("/referral-amount", async (req, res) => {
  try {
    const rewards = await getReferralRewards();
    res.json({ amount: Number(rewards.retailerReferee) });
  } catch (err) {
    console.error("get referral amount:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/config/referral-amount
 * Admin: Set single amount (legacy - updates retailerReferee and retailerReferrer)
 */
router.put("/referral-amount", async (req, res) => {
  try {
    const amount = Math.round(Number(req.body.amount) || 0);
    if (amount < 0 || amount > 100000) {
      return res.status(400).json({
        message: "Amount must be between 0 and ₹1,00,000",
      });
    }
    const rewards = await getReferralRewards();
    rewards.retailerReferrer = amount;
    rewards.retailerReferee = amount;
    await Config.findOneAndUpdate(
      { key: REFERRAL_REWARDS_KEY },
      { value: rewards },
      { upsert: true, new: true }
    );
    res.json({ message: "Referral amount updated", amount });
  } catch (err) {
    console.error("set referral amount:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/config/referral-rewards
 * Admin: Get all referral reward amounts
 */
router.get("/referral-rewards", async (req, res) => {
  try {
    const rewards = await getReferralRewards();
    res.json(rewards);
  } catch (err) {
    console.error("get referral rewards:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/config/referral-rewards
 * Admin: Set all referral reward amounts
 * Body: {
 *   retailerReferrer, retailerReferee,
 *   mrToRetailerMr, mrToRetailerRetailer,
 *   mrToMr,               // optional legacy (applied to mrToMrReferrer if provided)
 *   mrToMrReferrer,       // MR → MR: referrer amount
 *   mrToMrReferee         // MR → MR: referee amount
 * }
 */
router.put("/referral-rewards", async (req, res) => {
  try {
    const rewards = await getReferralRewards();
    const clamp = (n, def) => Math.max(0, Math.min(100000, Math.round(Number(n)) || def));
    rewards.retailerReferrer = clamp(req.body.retailerReferrer, rewards.retailerReferrer);
    rewards.retailerReferee = clamp(req.body.retailerReferee, rewards.retailerReferee);
    rewards.mrToRetailerMr = clamp(req.body.mrToRetailerMr, rewards.mrToRetailerMr);
    rewards.mrToRetailerRetailer = clamp(
      req.body.mrToRetailerRetailer,
      rewards.mrToRetailerRetailer
    );

    // MR → MR: support both legacy single amount (mrToMr) and separate referrer/referee amounts
    if (req.body.mrToMrReferrer != null || req.body.mrToMrReferee != null) {
      rewards.mrToMrReferrer = clamp(
        req.body.mrToMrReferrer,
        rewards.mrToMrReferrer ?? rewards.mrToMr
      );
      rewards.mrToMrReferee = clamp(
        req.body.mrToMrReferee,
        rewards.mrToMrReferee ?? rewards.mrToMr
      );
      // keep mrToMr in sync with referrer for backwards compatibility
      rewards.mrToMr = rewards.mrToMrReferrer;
    } else if (req.body.mrToMr != null) {
      const v = clamp(req.body.mrToMr, rewards.mrToMr);
      rewards.mrToMr = v;
      // if separate fields not set yet, mirror legacy into both sides
      if (rewards.mrToMrReferrer == null) rewards.mrToMrReferrer = v;
      if (rewards.mrToMrReferee == null) rewards.mrToMrReferee = v;
    }
    await Config.findOneAndUpdate(
      { key: REFERRAL_REWARDS_KEY },
      { value: rewards },
      { upsert: true, new: true }
    );
    res.json({ message: "Referral rewards updated", rewards });
  } catch (err) {
    console.error("set referral rewards:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
