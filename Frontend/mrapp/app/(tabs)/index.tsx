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
import { getMyReferrals, type MyReferralsResponse } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { APP_NAME, ENTITY_FULL } from '@/src/constants/app';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [referralsData, setReferralsData] = useState<MyReferralsResponse | null>(null);
  const [refLoading, setRefLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReferrals = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (isRefresh) setRefreshing(true);
    else setRefLoading(true);
    try {
      const data = await getMyReferrals();
      setReferralsData(data);
    } catch {
      setReferralsData({ count: 0, kycApproved: 0, referrals: [] });
    } finally {
      setRefLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const onRefresh = useCallback(() => {
    loadReferrals(true);
  }, [loadReferrals]);

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <View style={styles.crossV} />
            <View style={styles.crossH} />
          </View>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>{ENTITY_FULL}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={56} color="#0d9488" />
          </View>
          <Text style={styles.welcomeTitle}>Hello there!</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in as an MR (Agent) to access KYC, referrals, and commission.
          </Text>
          <Pressable onPress={() => router.push('/login')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />
      }
    >
      <View style={styles.logoWrap}>
        <View style={styles.logoIcon}>
          <View style={styles.crossV} />
          <View style={styles.crossH} />
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>{ENTITY_FULL}</Text>
      </View>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>Hi, {user.name || 'User'}!</Text>
        <View style={styles.partnerBadge}>
          <Text style={styles.partnerBadgeText}>Partner</Text>
        </View>
      </View>

      {/* Referral summary & list on dashboard */}
      <View style={styles.referralBlock}>
        <Text style={styles.referralBlockTitle}>Referrals</Text>
        {refLoading ? (
          <ActivityIndicator size="small" color="#0d9488" style={styles.refLoader} />
        ) : (
          <>
            <View style={styles.referralStats}>
              <View style={styles.referralStat}>
                <Text style={styles.referralStatValue}>{referralsData?.count ?? 0}</Text>
                <Text style={styles.referralStatLabel}>Total</Text>
              </View>
              <View style={styles.referralStat}>
                <Text style={styles.referralStatValue}>{referralsData?.kycApproved ?? 0}</Text>
                <Text style={styles.referralStatLabel}>KYC Done</Text>
              </View>
            </View>
            {referralsData?.referrals && referralsData.referrals.length > 0 ? (
              <View style={styles.referralListWrap}>
                <Text style={styles.referralListTitle}>Recent</Text>
                {referralsData.referrals.slice(0, 5).map((r) => (
                  <View key={r._id} style={styles.referralRow}>
                    <View style={styles.referralRowLeft}>
                      <Text style={styles.referralRowName} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.referralRowPhone}>{r.phone}</Text>
                    </View>
                    <View style={[styles.referralBadge, r.kyc === 'APPROVED' ? styles.referralBadgeDone : r.kyc === 'REJECTED' ? styles.referralBadgeRejected : styles.referralBadgePending]}>
                      <Text style={styles.referralBadgeText}>
                        {r.kyc === 'APPROVED' ? 'KYC ✓' : r.kyc === 'PENDING' ? 'Pending' : r.kyc === 'REJECTED' ? 'Rejected' : r.kyc || '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={() => router.push('/refer-earn')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllBtnText}>View all & track</Text>
              <Ionicons name="chevron-forward" size={18} color="#0d9488" />
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => router.push('/kyc')} style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#0d9488" />
          </View>
          <Text style={styles.quickLabel}>KYC</Text>
          <Text style={styles.quickSub}>Verification</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/refer-earn')} style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name="gift-outline" size={28} color="#0d9488" />
          </View>
          <Text style={styles.quickLabel}>Refer & Earn</Text>
          <Text style={styles.quickSub}>Share code</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/commission')} style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name="wallet-outline" size={28} color="#0d9488" />
          </View>
          <Text style={styles.quickLabel}>Commission</Text>
          <Text style={styles.quickSub}>Track earnings</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/supports')} style={styles.quickCard}>
          <View style={styles.quickIcon}>
            <Ionicons name="headset-outline" size={28} color="#0d9488" />
          </View>
          <Text style={styles.quickLabel}>Support</Text>
          <Text style={styles.quickSub}>Chat with admin</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  content: { paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 16 },
  logoIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  crossV: { position: 'absolute', width: 3, height: 28, backgroundColor: '#0d9488', borderRadius: 2 },
  crossH: { position: 'absolute', width: 24, height: 3, backgroundColor: '#67b8e3', borderRadius: 2 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  greeting: { fontSize: 16, color: '#6b7280', flex: 1 },
  partnerBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  partnerBadgeText: { fontSize: 12, fontWeight: '600', color: '#0f766e' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 8 },
  referralBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  referralBlockTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 12 },
  refLoader: { marginVertical: 8 },
  referralStats: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  referralStat: {},
  referralStatValue: { fontSize: 22, fontWeight: '700', color: '#0d9488' },
  referralStatLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  referralListWrap: { marginTop: 12, marginBottom: 8 },
  referralListTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f9ff',
  },
  referralRowLeft: { flex: 1 },
  referralRowName: { fontSize: 14, fontWeight: '600', color: '#111' },
  referralRowPhone: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  referralBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  referralBadgeDone: { backgroundColor: '#d1fae5' },
  referralBadgePending: { backgroundColor: '#fef3c7' },
  referralBadgeRejected: { backgroundColor: '#fee2e2' },
  referralBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 4,
  },
  viewAllBtnText: { fontSize: 14, fontWeight: '600', color: '#0d9488', marginRight: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  quickCard: {
    width: '47%',
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontWeight: '600', color: '#111' },
  quickSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
