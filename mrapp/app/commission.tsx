import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';

const SCREEN_TITLE = 'MR Commission';

type CommissionEntry = {
  _id: string;
  amount: number;
  type: 'REFERRAL' | 'ORDER' | 'BONUS';
  description?: string;
  createdAt: string;
  status: 'PENDING' | 'CREDITED';
};

type CommissionSummary = {
  totalEarned: number;
  pending: number;
  entries: CommissionEntry[];
};

async function fetchCommission(): Promise<CommissionSummary> {
  try {
    const res = await api.get('/auth/commission');
    return res.data;
  } catch {
    return { totalEarned: 0, pending: 0, entries: [] };
  }
}

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}

function typeLabel(t: CommissionEntry['type']) {
  switch (t) {
    case 'REFERRAL': return 'Referral';
    case 'ORDER': return 'Order';
    case 'BONUS': return 'Bonus';
    default: return t;
  }
}

export default function CommissionScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const summary = await fetchCommission();
    setData(summary);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Text style={styles.msgText}>Please login as MR (Agent) to view Commission</Text>
        <Pressable onPress={() => router.replace('/login')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>{SCREEN_TITLE}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />
          }
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="wallet-outline" size={28} color="#0d9488" />
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <Text style={styles.summaryValue}>₹{(data?.totalEarned ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="time-outline" size={28} color="#d97706" />
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, styles.pendingValue]}>₹{(data?.pending ?? 0).toFixed(2)}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>History</Text>
          {data?.entries && data.entries.length > 0 ? (
            data.entries.map((entry) => (
              <View key={entry._id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryType}>{typeLabel(entry.type)}</Text>
                  <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  {entry.description ? (
                    <Text style={styles.entryDesc} numberOfLines={1}>{entry.description}</Text>
                  ) : null}
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryAmount}>+₹{entry.amount.toFixed(2)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      entry.status === 'CREDITED' ? styles.statusCredited : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusText}>{entry.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No commission entries yet</Text>
              <Text style={styles.emptySubtext}>Earn by referring others and completing orders</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  msgText: { color: '#6b7280', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#0d9488', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  screen: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  headerBack: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#000', textAlign: 'center', marginLeft: -36 },
  headerSpacer: { width: 36 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { marginTop: 12, color: '#6b7280' },
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#0d9488', marginTop: 4 },
  pendingValue: { color: '#d97706' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  entryLeft: { flex: 1 },
  entryType: { fontWeight: '600', color: '#111' },
  entryDate: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  entryDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  entryRight: { alignItems: 'flex-end' },
  entryAmount: { fontSize: 16, fontWeight: '700', color: '#059669' },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusCredited: { backgroundColor: '#d1fae5' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: '#6b7280', marginTop: 12 },
  emptySubtext: { color: '#9ca3af', fontSize: 14, marginTop: 4 },
});
