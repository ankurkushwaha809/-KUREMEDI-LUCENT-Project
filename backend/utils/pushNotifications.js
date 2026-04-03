import { Expo } from "expo-server-sdk";
import User from "../model/User.js";

const expo = new Expo();

/**
 * Send push notification to a user (by userId) for support reply.
 * @param {ObjectId} userId - User._id
 * @param {string} title - e.g. ticket subject
 * @param {string} body - message preview
 */
export async function sendSupportPushNotification(userId, title, body) {
  if (!userId) return;
  const user = await User.findById(userId).select("expoPushTokens").lean();
  const tokens = user?.expoPushTokens?.filter(Boolean) || [];
  if (tokens.length === 0) return;

  const messages = tokens.map((pushToken) => {
    if (!Expo.isExpoPushToken(pushToken)) return null;
    return {
      to: pushToken,
      sound: "default",
      title: title ? `Support: ${String(title).slice(0, 40)}` : "Support",
      body: body ? String(body).slice(0, 100) : "New reply from support",
      data: { type: "support", screen: "supports" },
    };
  }).filter(Boolean);

  if (messages.length === 0) return;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
