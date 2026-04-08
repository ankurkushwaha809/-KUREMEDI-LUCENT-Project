function detectKeyMode(keyId) {
  const key = String(keyId || "").trim();
  if (/^rzp_live_/i.test(key)) return "live";
  if (/^rzp_test_/i.test(key)) return "test";
  return "unknown";
}

export function getValidatedRazorpayConfig() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    const err = new Error("Payment gateway not configured");
    err.code = "PAYMENT_GATEWAY_NOT_CONFIGURED";
    throw err;
  }

  const keyMode = detectKeyMode(keyId);
  const configuredMode = String(process.env.RAZORPAY_MODE || "")
    .trim()
    .toLowerCase();

  if (configuredMode && keyMode !== "unknown" && configuredMode !== keyMode) {
    const err = new Error(
      `Razorpay mode mismatch: key is '${keyMode}' but RAZORPAY_MODE is '${configuredMode}'`
    );
    err.code = "RAZORPAY_MODE_MISMATCH";
    throw err;
  }

  if (String(process.env.NODE_ENV || "").toLowerCase() === "production" && keyMode === "test") {
    const err = new Error("Test Razorpay key is not allowed in production");
    err.code = "RAZORPAY_TEST_KEY_IN_PRODUCTION";
    throw err;
  }

  return { keyId, keySecret, keyMode };
}
