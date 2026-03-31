import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
  sendSupportMessage,
  registerSupportPushToken,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketCategory,
} from "@/src/api";
import Constants from "expo-constants";
import { useAuth } from "@/src/context/AuthContext";
import { useSupportWebSocket } from "@/src/hooks/useSupportWebSocket";

const QUICK_QUESTIONS: {
  label: string;
  message: string;
  category: SupportTicketCategory;
}[] = [
  {
    label: "Order status",
    message: "I have a query about my order status.",
    category: "ORDER",
  },
  {
    label: "Payment issue",
    message: "I need help with a payment issue.",
    category: "PAYMENT",
  },
  {
    label: "Product enquiry",
    message: "I have a question about a product.",
    category: "PRODUCT",
  },
  {
    label: "Wallet / Balance",
    message: "I need help with my wallet or balance.",
    category: "WALLET",
  },
  {
    label: "KYC / Verification",
    message: "I need help with KYC or account verification.",
    category: "KYC",
  },
  {
    label: "Something else",
    message: "I have another question.",
    category: "OTHER",
  },
];

const WELCOME_MESSAGE =
  "Hi! How can we help you today? Type your question below or choose a topic. Our team will reply here and may call you if needed.";

function formatTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusColor(status: SupportTicket["status"]) {
  switch (status) {
    case "OPEN":
      return "bg-amber-100 text-amber-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    case "CLOSED":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function SupportsScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token } = useAuth();
  const [view, setView] = useState<"chat" | "history">("chat");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleRealtimeMessage = useCallback((msg: SupportMessage) => {
    setMessages((prev) => {
      const id = msg._id?.toString?.() ?? msg._id;
      if (prev.some((m) => (m._id?.toString?.() ?? m._id) === id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useSupportWebSocket(
    activeTicket?._id != null ? String(activeTicket._id) : null,
    token,
    handleRealtimeMessage,
  );

  useEffect(() => {
    if (!activeTicket?._id || !isAuthenticated) return;
    const interval = setInterval(() => {
      getSupportTicketById(activeTicket._id)
        .then((r) => {
          const payload = (r as { data?: { messages?: SupportMessage[] } })
            ?.data;
          const list = Array.isArray(payload?.messages) ? payload.messages : [];
          setMessages((prev) => {
            const serverIds = new Set(
              list.map((m) => m._id?.toString?.() ?? m._id),
            );
            const fromPrev = prev.filter(
              (m) => !serverIds.has(m._id?.toString?.() ?? m._id),
            );
            const merged = [...list, ...fromPrev].sort(
              (a, b) =>
                new Date(a.createdAt ?? 0).getTime() -
                new Date(b.createdAt ?? 0).getTime(),
            );
            return merged;
          });
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTicket?._id, isAuthenticated]);

  const fetchTickets = useCallback(() => {
    setLoadingTickets(true);
    getMySupportTickets()
      .then((r) => {
        const list =
          r &&
          typeof r === "object" &&
          "data" in r &&
          Array.isArray((r as { data: SupportTicket[] }).data)
            ? (r as { data: SupportTicket[] }).data
            : [];
        setTickets(list);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTickets();
  }, [isAuthenticated, fetchTickets]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (Constants.appOwnership === "expo") return;
    let cancelled = false;
    (async () => {
      try {
        const Notifications = await import("expo-notifications").catch(
          () => null,
        );
        if (!Notifications || cancelled) return;
        const { status } = await Notifications.requestPermissionsAsync();
        if (cancelled || status !== "granted") return;
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const pushToken = tokenData?.data;
        if (cancelled || !pushToken) return;
        await registerSupportPushToken(pushToken);
      } catch {
        // ignore: push not configured or permission denied
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadTicketChat = useCallback((ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setMessages([]);
    setView("chat");
    setLoadingChat(true);
    getSupportTicketById(ticket._id)
      .then((r) => {
        const wrap = r as {
          data?: { ticket?: SupportTicket; messages?: SupportMessage[] };
          ticket?: SupportTicket;
          messages?: SupportMessage[];
        };
        const payload = wrap?.data ?? wrap;
        const msgList = Array.isArray(payload?.messages)
          ? payload.messages
          : [];
        const tkt = payload?.ticket ?? ticket;
        setMessages(msgList);
        setActiveTicket(tkt);
      })
      .catch(() => setLoadingChat(false))
      .finally(() => setLoadingChat(false));
  }, []);

  const sendUserMessage = useCallback(
    async (text: string, category?: SupportTicketCategory) => {
      const body = text.trim();
      if (!body) return;

      setSending(true);
      try {
        if (!activeTicket || activeTicket.status === "CLOSED") {
          const res = await createSupportTicket({
            message: body,
            category: category || "OTHER",
          });
          const raw = res as { data?: SupportTicket; ticket?: SupportTicket };
          const newTicket = (raw?.data ?? raw?.ticket ?? res) as SupportTicket;
          const id = newTicket?._id ?? (newTicket as { id?: string })?.id;
          if (newTicket && id) {
            const ticket = { ...newTicket, _id: id?.toString?.() ?? id };
            setActiveTicket(ticket);
            setMessages([]);
            fetchTickets();
          } else {
            Alert.alert(
              "Error",
              "Could not start conversation. Please try again.",
            );
          }
        } else {
          const ticketId = activeTicket._id?.toString?.() ?? activeTicket._id;
          const res = await sendSupportMessage(ticketId, body);
          const raw = res as { data?: SupportMessage };
          const newMsg = (raw?.data ?? res) as SupportMessage | undefined;
          if (
            newMsg &&
            typeof newMsg === "object" &&
            (newMsg._id || (newMsg as { id?: string }).id)
          ) {
            setMessages((prev) => [...prev, newMsg as SupportMessage]);
          }
          fetchTickets();
        }
      } catch (e: unknown) {
        const err = e as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to send. Check your connection and try again.";
        Alert.alert("Error", errMsg);
      } finally {
        setSending(false);
      }
    },
    [activeTicket, fetchTickets],
  );

  const handleSend = useCallback(() => {
    const body = input.trim();
    if (!body || sending) return;
    setInput("");
    sendUserMessage(body);
  }, [input, sending, sendUserMessage]);

  const handleQuickQuestion = useCallback(
    (item: (typeof QUICK_QUESTIONS)[0]) => {
      setInput("");
      sendUserMessage(item.message, item.category);
    },
    [sendUserMessage],
  );

  const startNewChat = useCallback(() => {
    setActiveTicket(null);
    setMessages([]);
    setInput("");
  }, []);

  if (!isAuthenticated) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Text className="text-gray-500 mb-4">Please login to use Support</Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f0f4f8]">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => {
            if (view === "history") {
              setView("chat");
            } else {
              router.back();
            }
          }}
          hitSlop={12}
          className="p-1"
        >
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Support Chat
        </Text>
        <Pressable
          onPress={() => setView(view === "chat" ? "history" : "chat")}
          className="p-2"
        >
          <Ionicons
            name={view === "chat" ? "list" : "chatbubble-ellipses"}
            size={24}
            color="#0d9488"
          />
        </Pressable>
      </View>

      {view === "history" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={startNewChat}
            className="mb-4 bg-teal-600 py-3 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text className="text-white font-bold text-base">
              New conversation
            </Text>
          </Pressable>
          {loadingTickets ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#0d9488" />
            </View>
          ) : tickets.length === 0 ? (
            <View className="py-12 items-center">
              <Ionicons name="chatbubbles-outline" size={56} color="#9ca3af" />
              <Text className="text-gray-500 mt-3 text-center">
                No conversations yet. Start by asking a question in the chat.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {tickets.map((t) => (
                <Pressable
                  key={t._id}
                  onPress={() => loadTicketChat(t)}
                  className="bg-white rounded-xl p-4 border border-gray-200 active:opacity-80"
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <Text
                      className="flex-1 font-semibold text-black"
                      numberOfLines={1}
                    >
                      {t.subject}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded ${statusColor(t.status)}`}
                    >
                      <Text className="text-xs font-medium">
                        {t.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-sm" numberOfLines={2}>
                    {t.initialMessage}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">
                    {formatDate(t.lastMessageAt || t.createdAt)} · {t.category}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {view === "chat" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          keyboardVerticalOffset={insets.top + 56}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={chatScrollRef}
            className="flex-1 bg-[#f0f4f8]"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            onContentSizeChange={() =>
              chatScrollRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1 }}>
            {!activeTicket && (
              <>
                <View className="mb-4 self-start max-w-[85%]">
                  <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center">
                        <Ionicons name="headset" size={18} color="#0d9488" />
                      </View>
                      <Text className="font-semibold text-gray-800">
                        Support
                      </Text>
                    </View>
                    <Text className="text-gray-700 text-sm leading-5">
                      {WELCOME_MESSAGE}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xs mt-1 ml-1">Now</Text>
                </View>
                <Text className="text-gray-500 text-sm mb-2 px-1">
                  Choose a topic or type your question:
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {QUICK_QUESTIONS.map((q) => (
                    <Pressable
                      key={q.label}
                      onPress={() => handleQuickQuestion(q)}
                      disabled={sending}
                      className="bg-white px-4 py-2.5 rounded-full border border-teal-200 active:opacity-80"
                    >
                      <Text className="text-teal-700 font-medium text-sm">
                        {q.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {activeTicket && loadingChat && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#0d9488" />
              </View>
            )}

            {activeTicket && !loadingChat && (
              <>
                <View className="mb-3 self-end max-w-[85%]">
                  <View className="bg-teal-600 rounded-2xl rounded-tr-sm px-4 py-2">
                    <Text className="text-white text-sm">
                      {activeTicket.initialMessage}
                    </Text>
                    <Text className="text-teal-200 text-xs mt-1">
                      You · {formatTime(activeTicket.createdAt)}{" "}
                      {formatDate(activeTicket.createdAt)}
                    </Text>
                  </View>
                </View>
                {messages.map((m) => (
                  <View
                    key={m._id}
                    className={`mb-3 max-w-[85%] ${m.isFromAdmin ? "self-start" : "self-end"}`}
                  >
                    <View
                      className={`rounded-2xl px-4 py-2 ${
                        m.isFromAdmin
                          ? "bg-white rounded-tl-sm shadow-sm border border-gray-100"
                          : "bg-teal-600 rounded-tr-sm"
                      } ${m.type === "call_note" ? "border border-dashed border-teal-400" : ""}`}
                    >
                      {m.type === "call_note" && (
                        <Text
                          className={`text-xs font-medium mb-1 ${m.isFromAdmin ? "text-teal-700" : "text-teal-200"}`}
                        >
                          Call note
                        </Text>
                      )}
                      <Text
                        className={`text-sm ${m.isFromAdmin ? "text-gray-800" : "text-white"}`}
                      >
                        {m.body}
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${m.isFromAdmin ? "text-gray-500" : "text-teal-200"}`}
                      >
                        {m.isFromAdmin ? "Support" : "You"} ·{" "}
                        {formatTime(m.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
                {activeTicket.status === "CLOSED" && (
                  <View className="self-start bg-gray-100 rounded-xl px-4 py-2 mb-2">
                    <Text className="text-gray-600 text-sm">
                      This conversation is closed. Start a new one from History.
                    </Text>
                  </View>
                )}
              </>
            )}
            </View>
          </ScrollView>

          {(!activeTicket || activeTicket.status !== "CLOSED") && (
            <View
              style={{
                paddingBottom: keyboardVisible ? 0 : Math.max(8, insets.bottom),
                paddingTop: 8,
              }}
              className="flex-row items-end gap-2 px-4 bg-white border-t border-gray-200"
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your question..."
                multiline
                maxLength={1000}
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-black max-h-24"
                placeholderTextColor="#9ca3af"
                editable={!sending}
                onSubmitEditing={handleSend}
              />
              <Pressable
                onPress={handleSend}
                disabled={sending || !input.trim()}
                className="bg-teal-600 w-12 h-12 rounded-full items-center justify-center"
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={22} color="#fff" />
                )}
              </Pressable>
            </View>
          )}

          {activeTicket?.status === "CLOSED" && (
            <View className="px-4 py-3 bg-gray-100 border-t border-gray-200">
              <Pressable onPress={startNewChat} className="py-2">
                <Text className="text-teal-600 font-semibold text-center">
                  Start new conversation
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
