/**
 * Twilio Voice: Initiate outbound call to customer and provide admin token to join conference.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
 *          TWILIO_API_KEY_SID, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID
 * TwiML App in Twilio Console must have Voice URL pointing to: {BASE_URL}/api/support/voice/connect-admin
 */
import SupportTicket from "../model/SupportTicket.js";
import SupportCall from "../model/SupportCall.js";
import User from "../model/User.js";

const getBaseUrl = (req) => {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5000";
  return `${proto}://${host}`;
};

/**
 * Admin: Initiate call – Twilio calls customer, admin joins from browser via token
 * POST /api/support/admin/tickets/:id/initiate-call
 */
export const initiateCall = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate(
      "user",
      "name phone email"
    );
    if (!ticket)
      return res.status(404).json({ message: "Ticket not found" });

    const phone =
      ticket.contactPhone ||
      (ticket.user && ticket.user.phone) ||
      "";
    const toNumber = phone.startsWith("+")
      ? phone
      : `+91${phone.replace(/\D/g, "")}`;

    if (!toNumber || toNumber === "+91") {
      return res
        .status(400)
        .json({ message: "Customer phone number is required for call" });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (
      !accountSid ||
      !authToken ||
      !fromNumber ||
      !apiKeySid ||
      !apiKeySecret ||
      !twimlAppSid
    ) {
      return res.status(503).json({
        message:
          "Twilio voice not configured. Set TWILIO_* and TWILIO_TWIML_APP_SID.",
      });
    }

    const conferenceName = `ticket-${ticket._id}-${Date.now()}`;
    const baseUrl = getBaseUrl(req);
    const customerTwimlUrl = `${baseUrl}/api/support/voice/customer-twiml?conferenceName=${encodeURIComponent(conferenceName)}`;

    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const call = await client.calls.create({
      to: toNumber,
      from: fromNumber,
      url: customerTwimlUrl,
      statusCallback: `${baseUrl}/api/support/voice/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      timeout: 30,
    });

    const supportCall = await SupportCall.create({
      ticket: ticket._id,
      callSid: call.sid,
      status: "ringing",
    });

    await SupportTicket.findByIdAndUpdate(ticket._id, {
      status: "CALLING",
      lastMessageAt: new Date(),
    });

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    const identity = `admin-${req.user._id}`;
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl: 3600,
    });
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      outgoingApplicationParams: { To: conferenceName },
    });
    token.addGrant(voiceGrant);
    const accessToken = token.toJwt();

    return res.json({
      success: true,
      data: {
        accessToken,
        conferenceName,
        callSid: call.sid,
        supportCallId: supportCall._id,
      },
    });
  } catch (err) {
    console.error("Initiate call error:", err);
    return res.status(500).json({
      message: err.message || "Failed to initiate call",
    });
  }
};

/**
 * TwiML: When customer answers, put them in conference (public – called by Twilio)
 * GET /api/support/voice/customer-twiml?conferenceName=xxx
 */
export const customerTwiml = (req, res) => {
  const conferenceName =
    req.query.conferenceName || `ticket-${Date.now()}`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference>${escapeXml(conferenceName)}</Conference>
  </Dial>
</Response>`;
  res.type("text/xml").send(twiml);
};

/**
 * TwiML: When admin's browser connects via TwiML App, put them in conference (public)
 * This URL is set as the TwiML App Voice URL. Twilio sends "To" = conferenceName via outgoingApplicationParams.
 * GET or POST /api/support/voice/connect-admin
 */
export const connectAdmin = (req, res) => {
  const conferenceName = req.query.To || req.body.To || `ticket-${Date.now()}`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true">${escapeXml(conferenceName)}</Conference>
  </Dial>
</Response>`;
  res.type("text/xml").send(twiml);
};

/**
 * Twilio status callback – update SupportCall and ticket when call ends
 * POST /api/support/voice/call-status (Twilio calls this)
 */
export const callStatusCallback = async (req, res) => {
  res.type("text/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    const call = await SupportCall.findOne({ callSid: CallSid });
    if (!call) return;
    const updates = { status: mapTwilioStatus(CallStatus) };
    if (CallDuration) updates.duration = parseInt(CallDuration, 10);
    await SupportCall.findByIdAndUpdate(call._id, updates);
    if (CallStatus === "completed" || CallStatus === "busy" || CallStatus === "no-answer" || CallStatus === "failed") {
      await SupportTicket.findByIdAndUpdate(call.ticket, {
        status: "IN_PROGRESS",
      });
    }
  } catch (err) {
    console.error("Call status callback error:", err);
  }
};

function escapeXml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mapTwilioStatus(s) {
  const m = {
    queued: "ringing",
    ringing: "ringing",
    "in-progress": "in-progress",
    completed: "completed",
    busy: "busy",
    "no-answer": "no-answer",
    failed: "failed",
    canceled: "failed",
  };
  return m[s] || "initiating";
}
