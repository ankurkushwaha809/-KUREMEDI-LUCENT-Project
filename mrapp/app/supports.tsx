import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
  sendSupportMessage,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketCategory,
} from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { useSupportWebSocket } from '@/src/hooks/useSupportWebSocket';

const MR_TINT = '#0d9488';
const BG = '#f0f9ff';
const CARD_BG = '#fff';
const BORDER = '#e0f2fe';

const QUICK_QUESTIONS: { label: string; message: string; category: SupportTicketCategory }[] = [
  { label: 'Commission / Payout', message: 'I have a query about commission or payout.', category: 'PAYMENT' },
  { label: 'Referral / KYC', message: 'I need help with referral or KYC verification.', category: 'KYC' },
  { label: 'Wallet / Balance', message: 'I need help with my wallet or balance.', category: 'WALLET' },
  { label: 'Something else', message: 'I have another question.', category: 'OTHER' },
];

const WELCOME_MESSAGE =
  'Hi! How can we help you today? Type your question below or choose a topic. Our team will reply here and may call you if needed.';

function formatTime(s?: string) {
  if (!s) return '';
  return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function statusStyle(status: SupportTicket['status']) {
  switch (status) {
    case 'OPEN':
      return { bg: '#fef3c7', text: '#b45309' };
    case 'IN_PROGRESS':
      return { bg: '#dbeafe', text: '#1d4ed8' };
    case 'RESOLVED':
      return { bg: '#d1fae5', text: '#047857' };
    case 'CLOSED':
      return { bg: '#e5e7eb', text: '#374151' };
    default:
      return { bg: '#f3f4f6', text: '#4b5563' };
  }
}

export default function SupportsScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token } = useAuth();
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
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
    handleRealtimeMessage
  );

  useEffect(() => {
    if (!activeTicket?._id || !isAuthenticated) return;
    const interval = setInterval(() => {
      getSupportTicketById(activeTicket._id)
        .then((r) => {
          const payload = (r as { data?: { messages?: SupportMessage[] } })?.data;
          const list = Array.isArray(payload?.messages) ? payload.messages : [];
          setMessages((prev) => {
            const serverIds = new Set(list.map((m) => m._id?.toString?.() ?? m._id));
            const fromPrev = prev.filter((m) => !serverIds.has(m._id?.toString?.() ?? m._id));
            const merged = [...list, ...fromPrev].sort(
              (a, b) =>
                new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
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
          r && typeof r === 'object' && 'data' in r && Array.isArray((r as { data: SupportTicket[] }).data)
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

  const loadTicketChat = useCallback((ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setMessages([]);
    setView('chat');
    setLoadingChat(true);
    getSupportTicketById(ticket._id)
      .then((r) => {
        const wrap = r as {
          data?: { ticket?: SupportTicket; messages?: SupportMessage[] };
          ticket?: SupportTicket;
          messages?: SupportMessage[];
        };
        const payload = wrap?.data ?? wrap;
        const msgList = Array.isArray(payload?.messages) ? payload.messages : [];
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
        if (!activeTicket || activeTicket.status === 'CLOSED') {
          const res = await createSupportTicket({
            message: body,
            category: category || 'OTHER',
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
            Alert.alert('Error', 'Could not start conversation. Please try again.');
          }
        } else {
          const ticketId = activeTicket._id?.toString?.() ?? activeTicket._id;
          const res = await sendSupportMessage(ticketId, body);
          const raw = res as { data?: SupportMessage };
          const newMsg = (raw?.data ?? res) as SupportMessage | undefined;
          if (
            newMsg &&
            typeof newMsg === 'object' &&
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
          'Failed to send. Check your connection and try again.';
        Alert.alert('Error', errMsg);
      } finally {
        setSending(false);
      }
    },
    [activeTicket, fetchTickets]
  );

  const handleSend = useCallback(() => {
    const body = input.trim();
    if (!body || sending) return;
    setInput('');
    sendUserMessage(body);
  }, [input, sending, sendUserMessage]);

  const handleQuickQuestion = useCallback(
    (item: (typeof QUICK_QUESTIONS)[0]) => {
      setInput('');
      sendUserMessage(item.message, item.category);
    },
    [sendUserMessage]
  );

  const startNewChat = useCallback(() => {
    setActiveTicket(null);
    setMessages([]);
    setInput('');
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Text style={styles.pleaseLogin}>Please login to use Support</Text>
        <Pressable onPress={() => router.replace('/login')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (view === 'history' ? setView('chat') : router.back())}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Support</Text>
        <Pressable onPress={() => setView(view === 'chat' ? 'history' : 'chat')} style={styles.headerBtn}>
          <Ionicons
            name={view === 'chat' ? 'list' : 'chatbubble-ellipses'}
            size={24}
            color={MR_TINT}
          />
        </Pressable>
      </View>

      {view === 'history' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.historyContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={startNewChat} style={styles.newChatBtn}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.newChatBtnText}>New conversation</Text>
          </Pressable>
          {loadingTickets ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={MR_TINT} />
            </View>
          ) : tickets.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={56} color="#9ca3af" />
              <Text style={styles.emptyText}>No conversations yet. Start by asking a question in the chat.</Text>
            </View>
          ) : (
            <View style={styles.ticketList}>
              {tickets.map((t) => {
                const st = statusStyle(t.status);
                return (
                  <Pressable
                    key={t._id}
                    onPress={() => loadTicketChat(t)}
                    style={styles.ticketCard}
                  >
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>
                        {t.subject}
                      </Text>
                      <View style={[styles.ticketBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.ticketBadgeText, { color: st.text }]}>
                          {t.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ticketPreview} numberOfLines={2}>
                      {t.initialMessage}
                    </Text>
                    <Text style={styles.ticketMeta}>
                      {formatDate(t.lastMessageAt || t.createdAt)} · {t.category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {view === 'chat' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={insets.top + 0}
          style={styles.chatWrap}
        >
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() =>
              chatScrollRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.chatInner}>
              {!activeTicket && (
                <>
                  <View style={styles.welcomeBubble}>
                    <View style={styles.welcomeHeader}>
                      <View style={styles.welcomeIcon}>
                        <Ionicons name="headset" size={18} color={MR_TINT} />
                      </View>
                      <Text style={styles.welcomeTitle}>Support</Text>
                    </View>
                    <Text style={styles.welcomeBody}>{WELCOME_MESSAGE}</Text>
                    <Text style={styles.welcomeTime}>Now</Text>
                  </View>
                  <Text style={styles.chooseLabel}>Choose a topic or type your question:</Text>
                  <View style={styles.chipWrap}>
                    {QUICK_QUESTIONS.map((q) => (
                      <Pressable
                        key={q.label}
                        onPress={() => handleQuickQuestion(q)}
                        disabled={sending}
                        style={styles.chip}
                      >
                        <Text style={styles.chipText}>{q.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {activeTicket && loadingChat && (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="small" color={MR_TINT} />
                </View>
              )}

              {activeTicket && !loadingChat && (
                <>
                  <View style={styles.msgRowRight}>
                    <View style={styles.bubbleRight}>
                      <Text style={styles.bubbleRightText}>{activeTicket.initialMessage}</Text>
                      <Text style={styles.bubbleMeta}>
                        You · {formatTime(activeTicket.createdAt)} {formatDate(activeTicket.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {messages.map((m) => (
                    <View
                      key={m._id}
                      style={[styles.msgRow, m.isFromAdmin ? styles.msgRowLeft : styles.msgRowRight]}
                    >
                      <View
                        style={[
                          m.isFromAdmin ? styles.bubbleLeft : styles.bubbleRight,
                          m.type === 'call_note' && styles.bubbleCallNote,
                        ]}
                      >
                        {m.type === 'call_note' && (
                          <Text style={styles.callNoteLabel}>Call note</Text>
                        )}
                        <Text style={m.isFromAdmin ? styles.bubbleLeftText : styles.bubbleRightText}>
                          {m.body}
                        </Text>
                        <Text style={styles.bubbleMeta}>
                          {m.isFromAdmin ? 'Support' : 'You'} · {formatTime(m.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {activeTicket.status === 'CLOSED' && (
                    <View style={styles.closedBubble}>
                      <Text style={styles.closedText}>
                        This conversation is closed. Start a new one from History.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {(!activeTicket || activeTicket.status !== 'CLOSED') && (
            <View
              style={[
                styles.inputBar,
                {
                  paddingBottom: keyboardVisible ? 8 : Math.max(0, insets.bottom),
                },
              ]}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your question..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={1000}
                style={styles.input}
                editable={!sending}
                onSubmitEditing={handleSend}
              />
              <Pressable
                onPress={handleSend}
                disabled={sending || !input.trim()}
                style={styles.sendBtn}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={22} color="#fff" />
                )}
              </Pressable>
            </View>
          )}

          {activeTicket?.status === 'CLOSED' && (
            <View style={styles.closedBar}>
              <Pressable onPress={startNewChat}>
                <Text style={styles.startNewText}>Start new conversation</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  centerScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pleaseLogin: { color: '#6b7280', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: MR_TINT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  scroll: { flex: 1 },
  historyContent: { paddingHorizontal: 16, paddingTop: 16 },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MR_TINT,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  newChatBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loaderWrap: { paddingVertical: 24, alignItems: 'center' },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { color: '#6b7280', marginTop: 12, textAlign: 'center', paddingHorizontal: 16 },
  ticketList: { gap: 12 },
  ticketCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ticketSubject: { flex: 1, fontWeight: '600', color: '#111', fontSize: 15 },
  ticketBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ticketBadgeText: { fontSize: 11, fontWeight: '600' },
  ticketPreview: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  ticketMeta: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  chatWrap: { flex: 1 },
  chatScroll: { flex: 1, backgroundColor: BG },
  chatContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  chatInner: { flex: 1 },
  welcomeBubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f9ff',
  },
  welcomeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  welcomeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: { fontWeight: '600', color: '#374151' },
  welcomeBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  welcomeTime: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  chooseLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: { fontSize: 14, fontWeight: '500', color: MR_TINT },
  msgRow: { marginBottom: 12, maxWidth: '85%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  bubbleLeft: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0f9ff',
  },
  bubbleRight: {
    backgroundColor: MR_TINT,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  bubbleCallNote: { borderWidth: 1, borderColor: '#5eead4', borderStyle: 'dashed' },
  callNoteLabel: { fontSize: 11, fontWeight: '600', color: MR_TINT, marginBottom: 4 },
  bubbleLeftText: { fontSize: 14, color: '#111' },
  bubbleRightText: { fontSize: 14, color: '#fff' },
  bubbleMeta: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  closedBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  closedText: { fontSize: 14, color: '#6b7280' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    maxHeight: 96,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MR_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  startNewText: {
    color: MR_TINT,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
