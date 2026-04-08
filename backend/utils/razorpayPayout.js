const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function toBasicAuth(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function isTruthy(value) {
  return String(value || "").toLowerCase() === "true";
}

function required(field, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`${field} is required`);
  }
  return String(value).trim();
}

function getConfig() {
  const keyId = required("RAZORPAYX_KEY_ID", process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID);
  const keySecret = required(
    "RAZORPAYX_KEY_SECRET",
    process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
  );
  const sourceAccountNumber = required(
    "RAZORPAYX_ACCOUNT_NUMBER",
    process.env.RAZORPAYX_ACCOUNT_NUMBER,
  );

  return {
    enabled: isTruthy(process.env.PAYOUT_AUTOMATION_ENABLED),
    keyId,
    keySecret,
    sourceAccountNumber,
  };
}

async function razorpayRequest({ path, method = "POST", body, config }) {
  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: toBasicAuth(config.keyId, config.keySecret),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.error?.description ||
      data?.error?.reason ||
      data?.message ||
      `Razorpay request failed (${res.status})`;
    const err = new Error(message);
    err.details = data;
    err.status = res.status;
    throw err;
  }

  return data;
}

function mapPayoutStatus(rawStatus) {
  const status = String(rawStatus || "").toLowerCase();
  if (status === "processed") return "PROCESSED";
  if (status === "failed" || status === "rejected" || status === "cancelled") return "FAILED";
  return "PROCESSING";
}

export function isPayoutAutomationEnabled() {
  return isTruthy(process.env.PAYOUT_AUTOMATION_ENABLED);
}

export async function createAgentWithdrawalPayout({ withdrawal, agent, user }) {
  const config = getConfig();

  const accountNumber = required("agent.accountNumber", agent?.accountNumber);
  const ifscCode = required("agent.ifscCode", agent?.ifscCode).toUpperCase();
  const name = required("agent.accountHolderName", agent?.accountHolderName || agent?.name || user?.name);
  const phone = required("user.phone", user?.phone || agent?.phone);

  const amountPaise = Math.round(Number(withdrawal?.amount || 0) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new Error("Withdrawal amount must be at least INR 1");
  }

  const referenceId = `wd_${String(withdrawal?._id || "")}`.slice(0, 40);

  const contact = await razorpayRequest({
    path: "/contacts",
    config,
    body: {
      name,
      email: String(user?.email || agent?.email || "support@kuremedi.com").trim().toLowerCase(),
      contact: String(phone).trim(),
      type: "vendor",
      reference_id: referenceId,
      notes: {
        withdrawalId: String(withdrawal?._id || ""),
        agentId: String(agent?._id || ""),
      },
    },
  });

  const fundAccount = await razorpayRequest({
    path: "/fund_accounts",
    config,
    body: {
      contact_id: contact.id,
      account_type: "bank_account",
      bank_account: {
        name,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    },
  });

  const payout = await razorpayRequest({
    path: "/payouts",
    config,
    body: {
      account_number: config.sourceAccountNumber,
      fund_account_id: fundAccount.id,
      amount: amountPaise,
      currency: "INR",
      mode: "IMPS",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: "Kuremedi withdrawal",
      notes: {
        withdrawalId: String(withdrawal?._id || ""),
        agentPhone: String(phone),
      },
    },
  });

  return {
    payoutId: payout.id,
    payoutStatus: mapPayoutStatus(payout.status),
    payoutRawStatus: payout.status,
    payoutResponse: payout,
  };
}
