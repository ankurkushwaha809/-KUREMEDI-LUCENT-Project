import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAgentCommission,
  getWithdrawals,
  requestWithdrawal,
  type CommissionEntry,
  type WithdrawalItem,
} from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';

const MR_TINT = '#0d9488';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function typeLabel(t: CommissionEntry['type']) {
  switch (t) {
    case 'REFERRAL':
      return 'Referral';
    case 'ORDER':
      return 'Order';
    case 'BONUS':
      return 'Bonus';
    case 'PAYOUT':
      return 'Payout';
    default:
      return t;
  }
}

function statusStyle(status: string) {
  switch (status) {
    case 'APPROVED':
      return { bg: '#d1fae5', text: '#047857' };
    case 'REJECTED':
      return { bg: '#fee2e2', text: '#b91c1c' };
    default:
      return { bg: '#fef3c7', text: '#b45309' };
  }
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [commission, setCommission] = useState<{
    totalEarned: number;
    pending: number;
    entries: CommissionEntry[];
  } | null>(null);
  const [withdrawalsData, setWithdrawalsData] = useState<{
    withdrawals: WithdrawalItem[];
    totalEarned: number;
    alreadyWithdrawn: number;
    availableBalance: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [comm, wd] = await Promise.all([
        getAgentCommission().catch(() => ({
          totalEarned: 0,
          pending: 0,
          entries: [],
        })),
        getWithdrawals().catch(() => ({
          withdrawals: [],
          totalEarned: 0,
          alreadyWithdrawn: 0,
          availableBalance: 0,
        })),
      ]);
      setCommission(comm);
      setWithdrawalsData(wd);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [isAuthenticated, load]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) load();
    }, [isAuthenticated, load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const openRequestModal = useCallback(() => {
    setError('');
    setWithdrawAmount(withdrawalsData?.availableBalance?.toString() ?? '');
    setWithdrawNote('');
    setModalVisible(true);
  }, [withdrawalsData?.availableBalance]);

  const submitWithdrawal = useCallback(async () => {
    const amount = parseFloat(withdrawAmount?.replace(/,/g, '') ?? '');
    if (!Number.isFinite(amount) || amount < 1) {
      setError('Enter a valid amount (min ₹1)');
      return;
    }
    const available = withdrawalsData?.availableBalance ?? 0;
    if (amount > available) {
      setError(`Available balance is ₹${available.toFixed(2)}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await requestWithdrawal(amount, withdrawNote.trim() || undefined);
      setModalVisible(false);
      setWithdrawAmount('');
      setWithdrawNote('');
      load();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }, [withdrawAmount, withdrawNote, withdrawalsData?.availableBalance, load]);

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Ionicons name="wallet-outline" size={64} color="#94a3b8" />
        <Text style={styles.msgText}>Sign in as MR to view Wallet</Text>
        <Pressable onPress={() => router.push('/login')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !commission && !withdrawalsData) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MR_TINT} />
        <Text style={styles.loadText}>Loading wallet...</Text>
      </View>
    );
  }

  const available = withdrawalsData?.availableBalance ?? 0;
  const withdrawals = withdrawalsData?.withdrawals ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Text style={styles.headerSubtitle}>Referral earnings & withdrawals</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MR_TINT} />
        }
      >
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={28} color={MR_TINT} />
            <Text style={styles.summaryLabel}>Total earned</Text>
            <Text style={styles.summaryValue}>
              ₹{(commission?.totalEarned ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="wallet-outline" size={28} color="#059669" />
            <Text style={styles.summaryLabel}>Available</Text>
            <Text style={[styles.summaryValue, styles.availableValue]}>
              ₹{available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openRequestModal}
          style={[styles.requestBtn, available < 1 && styles.requestBtnDisabled]}
          disabled={available < 1}
        >
          <Ionicons name="arrow-down-circle-outline" size={22} color="#fff" />
          <Text style={styles.requestBtnText}>Request withdrawal</Text>
        </Pressable>

        {(commission?.totalEarned ?? 0) === 0 && (!commission?.entries?.length) && (
          <View style={styles.zeroHint}>
            <Ionicons name="information-circle-outline" size={20} color="#0d9488" />
            <Text style={styles.zeroHintText}>
              Balance is added when a referred user&apos;s KYC is approved. If your referral&apos;s KYC was already approved but you see ₹0, ask admin to use &quot;Credit referrer&quot; for that retailer in All Retailers.
            </Text>
          </View>
        )}

        {/* Referral amounts (commission entries) - R→R, MR→R, MR→MR per referral rules */}
        <Text style={styles.sectionTitle}>Referral & earnings</Text>
        <Text style={styles.sectionHint}>
          Referral bonus is added when referred users complete KYC (retailer or MR).
        </Text>
        {commission?.entries && commission.entries.length > 0 ? (
          commission.entries.map((entry) => (
            <View key={entry._id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryType}>{typeLabel(entry.type)}</Text>
                <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                {entry.description ? (
                  <Text style={styles.entryDesc} numberOfLines={1}>
                    {entry.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.entryAmount}>+₹{entry.amount.toFixed(2)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: entry.status === 'CREDITED' ? '#d1fae5' : '#fef3c7' },
                  ]}
                >
                  <Text style={styles.statusText}>{entry.status}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color="#9ca3af" />
            <Text style={styles.emptyText}>No referral earnings yet</Text>
          </View>
        )}

        {/* Withdrawal requests */}
        <Text style={styles.sectionTitle}>Withdrawal requests</Text>
        {withdrawals.length > 0 ? (
          withdrawals.map((w) => {
            const st = statusStyle(w.status);
            return (
              <View key={w._id} style={styles.withdrawCard}>
                <View style={styles.withdrawLeft}>
                  <Text style={styles.withdrawAmount}>₹{w.amount.toFixed(2)}</Text>
                  <Text style={styles.withdrawDate}>{formatDate(w.createdAt)}</Text>
                  {w.adminNote ? (
                    <Text style={styles.withdrawAdminNote} numberOfLines={2}>
                      {w.adminNote}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.withdrawBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.withdrawBadgeText, { color: st.text }]}>{w.status}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="list-outline" size={40} color="#9ca3af" />
            <Text style={styles.emptyText}>No withdrawal requests yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Request withdrawal modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !submitting && setModalVisible(false)}
        >
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Request withdrawal</Text>
            <Text style={styles.modalHint}>
              Available: ₹{available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              editable={!submitting}
            />
            <TextInput
              style={[styles.input, styles.inputNote]}
              placeholder="Note (optional)"
              placeholderTextColor="#94a3b8"
              value={withdrawNote}
              onChangeText={setWithdrawNote}
              editable={!submitting}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => !submitting && setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmit, submitting && styles.modalSubmitDisabled]}
                onPress={submitWithdrawal}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  msgText: { color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  loadText: { marginTop: 12, color: '#6b7280' },
  primaryBtn: {
    backgroundColor: MR_TINT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  screen: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 8 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: MR_TINT, marginTop: 4 },
  availableValue: { color: '#059669' },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MR_TINT,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  requestBtnDisabled: { backgroundColor: '#94a3b8', opacity: 0.8 },
  requestBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  zeroHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ccfbf1',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  zeroHintText: { flex: 1, fontSize: 13, color: '#0f766e', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  sectionHint: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  entryLeft: { flex: 1 },
  entryType: { fontWeight: '600', color: '#111' },
  entryDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  entryDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  entryRight: { alignItems: 'flex-end' },
  entryAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  withdrawCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  withdrawLeft: { flex: 1 },
  withdrawAmount: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  withdrawDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  withdrawAdminNote: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  withdrawBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  withdrawBadgeText: { fontSize: 12, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#64748b', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  modalHint: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  inputNote: { marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: '#64748b', fontWeight: '500' },
  modalSubmit: {
    backgroundColor: MR_TINT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSubmitDisabled: { opacity: 0.7 },
  modalSubmitText: { color: '#fff', fontWeight: '600' },
});
