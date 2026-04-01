import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyReferrals, type MyReferralsResponse } from '@/src/api';
import { APP_NAME } from './constants';
import { useAuth } from '@/src/context/AuthContext';

export default function ReferEarnScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralsData, setReferralsData] = useState<MyReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReferrals = useCallback(async () => {
    try {
      const data = await getMyReferrals();
      setReferralsData(data);
    } catch {
      setReferralsData({ count: 0, kycApproved: 0, referrals: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadReferrals();
  }, [isAuthenticated, loadReferrals]);

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Text style={styles.msgText}>Please login as MR (Agent) to view Refer & Earn</Text>
        <Pressable onPress={() => router.replace('/login')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </Pressable>
      </View>
    );
  }

  const referralCode = user.referralCode || '—';

  const handleCopy = () => {
    if (referralCode && referralCode !== '—') {
      Alert.alert('Referral code', referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode && referralCode !== '—') {
      try {
        await Share.share({
          message: `Use my referral code ${referralCode} on ${APP_NAME} to get rewards!`,
          title: 'Referral Code',
        });
      } catch {
        // User cancelled
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferrals();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: 24, paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift-outline" size={32} color="#0d9488" />
          </View>
          <Text style={styles.heroTitle}>Invite Retailers, Earn per KYC</Text>
          <Text style={styles.heroSubtitle}>
            Share your code with retailers. When they sign up and complete KYC, you get 1 referral count and credit (amount set by admin).
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralsData?.count ?? (loading ? '…' : '0')}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralsData?.kycApproved ?? (loading ? '…' : '0')}</Text>
            <Text style={styles.statLabel}>KYC Approved</Text>
          </View>
        </View>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Pressable onPress={handleCopy} style={styles.codeBox}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <View style={styles.codeActions}>
                <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={22} color={copied ? '#059669' : '#0d9488'} />
                <Text style={styles.codeActionText}>{copied ? 'Copied' : 'Copy'}</Text>
              </View>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={22} color="#0d9488" />
              <Text style={styles.shareBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { step: 1, title: 'Share your code', desc: 'Send your referral code to retailers' },
            { step: 2, title: 'They sign up', desc: 'Retailers use your code when registering in the app' },
            { step: 3, title: 'They complete KYC', desc: 'When their KYC is approved, you get 1 referral count and credit' },
          ].map(({ step, title, desc }) => (
            <View key={step} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{step}</Text>
              </View>
              <View style={styles.howTextWrap}>
                <Text style={styles.howRowTitle}>{title}</Text>
                <Text style={styles.howRowDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>My Referral Tracking</Text>
          {loading ? (
            <ActivityIndicator color="#0d9488" style={{ marginVertical: 16 }} />
          ) : referralsData?.referrals && referralsData.referrals.length > 0 ? (
            referralsData.referrals.map((r) => (
              <View key={r._id} style={styles.trackingRow}>
                <View style={styles.trackingLeft}>
                  <Text style={styles.trackingName}>{r.name}</Text>
                  <Text style={styles.trackingPhone}>{r.phone}</Text>
                </View>
                <View style={styles.trackingRight}>
                  <View style={[
                    styles.kycBadge,
                    r.kyc === 'APPROVED' ? styles.kycApproved : r.kyc === 'REJECTED' ? styles.kycRejected : styles.kycPending,
                  ]}>
                    <Text style={styles.kycBadgeText}>
                      {r.kyc === 'APPROVED' ? 'KYC Done' : r.kyc === 'PENDING' ? 'Pending' : r.kyc === 'REJECTED' ? 'Rejected' : r.kyc || '—'}
                    </Text>
                  </View>
                  {r.credited && <Text style={styles.creditedText}>Credited</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.trackingEmpty}>No referrals yet. Share your code to get started.</Text>
          )}
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0d9488' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  heroCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  codeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e0f2fe' },
  codeLabel: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  codeText: { fontSize: 18, fontWeight: '700', color: '#0d9488', letterSpacing: 2 },
  codeActions: { flexDirection: 'row', alignItems: 'center' },
  codeActionText: { marginLeft: 8, color: '#0d9488', fontWeight: '600', fontSize: 14 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  shareBtnText: { marginLeft: 8, color: '#0d9488', fontWeight: '600', fontSize: 14 },
  howCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e0f2fe' },
  howTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  howNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  howNumText: { color: '#0d9488', fontWeight: '700' },
  howTextWrap: { flex: 1 },
  howRowTitle: { fontWeight: '500', color: '#000' },
  howRowDesc: { color: '#6b7280', fontSize: 14, marginTop: 2 },
  trackingCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  trackingTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  trackingLeft: {},
  trackingName: { fontWeight: '600', color: '#111' },
  trackingPhone: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  trackingRight: { alignItems: 'flex-end' },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  kycApproved: { backgroundColor: '#d1fae5' },
  kycPending: { backgroundColor: '#fef3c7' },
  kycRejected: { backgroundColor: '#fee2e2' },
  kycBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  creditedText: { fontSize: 11, color: '#059669', marginTop: 4 },
  trackingEmpty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
});
