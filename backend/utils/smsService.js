/**
 * Twilio SMS Service - Send OTP via SMS
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
export const sendOtpSms = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    const to = phone.startsWith("+")
      ? phone
      : `+91${phone.replace(/\D/g, "")}`;
    const message = await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
      from: fromNumber,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
