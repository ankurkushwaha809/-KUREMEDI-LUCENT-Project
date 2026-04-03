import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADMIN_AGENT_CONTEXT, APP_NAME, ENTITY_FULL } from '../constants';
import { useAuth } from '@/src/context/AuthContext';

const KYC_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#d1fae5', text: '#047857' },
  PENDING: { bg: '#fef3c7', text: '#b45309' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c' },
  BLANK: { bg: '#f3f4f6', text: '#4b5563' },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout, isLoading, refreshUser } = useAuth();

  const load = useCallback(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.title}>MR Profile</Text>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={56} color="#0d9488" />
          </View>
          <Text style={styles.welcomeTitle}>{APP_NAME}</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in as an {ENTITY_FULL} to access KYC, referrals, and commission
          </Text>
          <Pressable onPress={() => router.push('/login')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const kycStatus = user.kyc || 'BLANK';
  const kycStyle = KYC_STATUS_STYLES[kycStatus] ?? KYC_STATUS_STYLES.BLANK;
  const displayName = user.name || 'User';
  const displayPhone = user.phone ? `+91 ${user.phone}` : '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>Partner</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileMeta}>{displayPhone}</Text>
              {user.email ? <Text style={styles.profileMeta}>{user.email}</Text> : null}
            </View>
          </View>
          <View style={styles.kycRow}>
            <Text style={styles.kycLabel}>KYC Status</Text>
            <View style={[styles.kycBadge, { backgroundColor: kycStyle.bg }]}>
              <Text style={[styles.kycBadgeText, { color: kycStyle.text }]}>{kycStatus}</Text>
            </View>
          </View>
          {user.referralCode ? (
            <Text style={styles.refCode}>Referral Code: {user.referralCode}</Text>
          ) : null}
          <Text style={styles.adminNote}>{ADMIN_AGENT_CONTEXT}</Text>
        </View>
        <View style={styles.menu}>
          <Pressable onPress={() => router.push('/kyc')} style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#6b7280" />
            <Text style={styles.menuText}>KYC Verification</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
          <Pressable onPress={() => router.push('/refer-earn')} style={styles.menuItem}>
            <Ionicons name="gift-outline" size={22} color="#6b7280" />
            <Text style={styles.menuText}>Refer & Earn</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
          <Pressable onPress={() => router.push('/commission')} style={styles.menuItem}>
            <Ionicons name="wallet-outline" size={22} color="#6b7280" />
            <Text style={styles.menuText}>Commission</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
          <Pressable onPress={() => router.push('/supports')} style={styles.menuItem}>
            <Ionicons name="headset-outline" size={22} color="#6b7280" />
            <Text style={styles.menuText}>Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  content: { paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadText: { marginTop: 12, color: '#6b7280' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', flex: 1 },
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
    padding: 24,
    marginBottom: 16,
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
    alignSelf: 'center',
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#111' },
  profileMeta: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f9ff',
  },
  kycLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  kycBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  kycBadgeText: { fontSize: 12, fontWeight: '600' },
  refCode: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  adminNote: { fontSize: 11, color: '#9ca3af', marginTop: 12, fontStyle: 'italic' },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f9ff',
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500', color: '#111' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  logoutText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#dc2626' },
});
