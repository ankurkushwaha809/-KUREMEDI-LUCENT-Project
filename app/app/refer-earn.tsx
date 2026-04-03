import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";

export default function ReferEarn() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Text className="text-gray-500 mb-4">
          Please login to view Refer & Earn
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Login</Text>
        </Pressable>
      </View>
    );
  }

  const referralCode = user.referralCode || "—";

  const handleCopy = async () => {
    if (referralCode && referralCode !== "—") {
      Alert.alert("Referral code", referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode && referralCode !== "—") {
      try {
        await Share.share({
          message: `Use my referral code ${referralCode} on Pharmacy App to get rewards!`,
          title: "Referral Code",
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Refer & Earn
        </Text>
        <View className="w-9" />
      </View>

      <View className="flex-1 px-4 pt-8">
        <View className="bg-teal-50 rounded-2xl p-6 border border-teal-200 mb-6">
          <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-4 self-center">
            <Ionicons name="gift-outline" size={32} color="#0d9488" />
          </View>
          <Text className="text-xl font-bold text-black text-center mb-2">
            Invite Friends, Earn Rewards
          </Text>
          <Text className="text-gray-600 text-center text-sm">
            Share your referral code with friends. When they sign up and place
            an order, you both earn rewards!
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-gray-200">
          <Text className="text-sm font-medium text-gray-600 mb-2">
            Your Referral Code
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleCopy}
              className="flex-1 flex-row items-center justify-between bg-gray-100 rounded-xl px-4 py-4"
            >
              <Text className="text-lg font-bold text-teal-600 tracking-widest">
                {referralCode}
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name={copied ? "checkmark-circle" : "copy-outline"}
                  size={22}
                  color={copied ? "#059669" : "#0d9488"}
                />
                <Text className="ml-2 text-teal-600 font-semibold text-sm">
                  {copied ? "Copied" : "Copy"}
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="flex-row items-center bg-teal-100 rounded-xl px-4 py-4"
            >
              <Ionicons name="share-outline" size={22} color="#0d9488" />
              <Text className="ml-2 text-teal-600 font-semibold text-sm">
                Share
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-6 bg-white rounded-2xl p-5 border border-gray-200">
          <Text className="text-base font-semibold text-black mb-2">
            How it works
          </Text>
          <View className="flex-row items-start mb-3">
            <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center mr-3">
              <Text className="text-teal-600 font-bold">1</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-black">Share your code</Text>
              <Text className="text-gray-500 text-sm">
                Send your referral code to friends and family
              </Text>
            </View>
          </View>
          <View className="flex-row items-start mb-3">
            <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center mr-3">
              <Text className="text-teal-600 font-bold">2</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-black">They sign up</Text>
              <Text className="text-gray-500 text-sm">
                Friends use your code when registering
              </Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center mr-3">
              <Text className="text-teal-600 font-bold">3</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium text-black">You both earn</Text>
              <Text className="text-gray-500 text-sm">
                Get rewards when they place their first order
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
