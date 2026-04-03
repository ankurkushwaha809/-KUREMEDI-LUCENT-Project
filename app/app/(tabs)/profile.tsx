import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { KycBanner } from "@/src/components/KycBanner";

const KYC_STATUS_LABELS: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700" },
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
  BLANK: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout, isLoading, refreshUser } = useAuth();

  const loadProfile = useCallback(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] px-4 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="mt-3 text-base text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View
        style={{ paddingTop: insets.top + 24 }}
        className="flex-1 bg-[#f8faf8] px-4"
      >
        <Text className="text-2xl font-bold text-black mb-6">Profile</Text>

        <View className="bg-white rounded-[20px] p-7 items-center border border-gray-200 shadow-sm">
          <View className="w-[100px] h-[100px] rounded-full bg-teal-100 items-center justify-center mb-4">
            <Ionicons name="person-outline" size={56} color="#0d9488" />
          </View>

          <Text className="text-xl font-bold text-black mb-2 text-center">
            Welcome to Kuremedi
          </Text>

          <Text className="text-sm text-gray-500 text-center mb-6 leading-5 px-2">
            Login to access your profile, orders, and KYC verification
          </Text>

          <Pressable
            onPress={() => router.push("/login")}
            className="flex-row items-center bg-teal-600 px-6 py-3.5 rounded-xl active:opacity-90"
          >
            <Text className="text-white font-semibold text-base mr-2">
              Login with Mobile & OTP
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  const kycStatus = user.kyc || "BLANK";
  const kycColors = KYC_STATUS_LABELS[kycStatus] || KYC_STATUS_LABELS.BLANK;
  const displayName = user.name || "User";
  const displayPhone = user.phone ? `+91 ${user.phone}` : "";

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-[#f8faf8] px-4"
    >
      <Text className="text-2xl font-bold text-black mb-6">Profile</Text>

      <KycBanner kyc={user.kyc} />

      {/* Profile Card */}
      <View className="bg-white rounded-[20px] p-6 mb-4 border border-gray-200 shadow-sm">
        <View className="flex-row items-center">
          <View className="w-20 h-20 rounded-full bg-teal-600 items-center justify-center">
            <Text className="text-white text-3xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-black">{displayName}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{displayPhone}</Text>
            {user.email ? (
              <Text className="text-sm text-gray-500">{user.email}</Text>
            ) : null}
          </View>
        </View>

        {/* KYC Status */}
        <View className="mt-4 pt-4 border-t border-gray-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">
              KYC Status
            </Text>
            <View className={`px-3 py-1.5 rounded-full ${kycColors.bg}`}>
              <Text className={`text-xs font-semibold ${kycColors.text}`}>
                {kycStatus}
              </Text>
            </View>
          </View>
          {user.referralCode ? (
            <Text className="text-xs text-gray-500 mt-2">
              Your referral code: {user.referralCode}
            </Text>
          ) : null}
          {user.referredBy && typeof user.referredBy === "object" && (user.referredBy.name || user.referredBy.referralCode) ? (
            <Text className="text-xs text-gray-500 mt-2">
              Referred by: {user.referredBy.name || user.referredBy.referralCode || "—"}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Menu: KYC, Wallet, Refer & Earn, Profile, Orders */}
      <View className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
        <Pressable
          onPress={() => router.push("/kyc")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            KYC Verification
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/wallet")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="wallet-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Wallet
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/refer-earn")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="gift-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Refer & Earn
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/profile-edit")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="person-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Profile Update
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/orders")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="receipt-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            My Orders
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/supports")}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="headset-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Support
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/faq" as Href)}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="help-circle-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            FAQ
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/privacy-policy" as Href)}
          className="flex-row items-center p-4 border-b border-gray-100 active:bg-gray-50"
        >
          <Ionicons name="shield-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/terms-and-conditions" as Href)}
          className="flex-row items-center p-4 active:bg-gray-50"
        >
          <Ionicons name="document-text-outline" size={22} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base font-medium text-black">
            Terms & Conditions
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        className="flex-row items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50 active:bg-red-100"
      >
        <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        <Text className="ml-2 text-base font-semibold text-red-600">
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}
