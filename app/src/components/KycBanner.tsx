import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

type KycBannerProps = {
  kyc?: "APPROVED" | "PENDING" | "REJECTED" | "BLANK";
};

export function KycBanner({ kyc }: KycBannerProps) {
  if (!kyc || kyc === "APPROVED") return null;

  const isPending = kyc === "PENDING";
  const isBlank = kyc === "BLANK";
  const isRejected = kyc === "REJECTED";

  const handlePress = () => router.push("/kyc");

  return (
    <Pressable
      onPress={handlePress}
      className={`mx-4 mt-3 flex-row items-center rounded-xl p-3 ${
        isBlank ? "bg-amber-100" : isPending ? "bg-blue-50" : "bg-red-50"
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-white/80 items-center justify-center mr-3">
        <Ionicons
          name="shield-checkmark-outline"
          size={22}
          color={isBlank ? "#d97706" : isPending ? "#2563eb" : "#dc2626"}
        />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-black">
          {isBlank && "Complete KYC to order"}
          {isPending && "KYC under review"}
          {isRejected && "KYC verification failed"}
        </Text>
        <Text className="text-sm text-gray-600 mt-0.5">
          {isBlank && "Submit your documents to add to cart and place orders."}
          {isPending && "We are verifying your documents. You can track status in profile."}
          {isRejected && "Please resubmit your documents for verification."}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </Pressable>
  );
}
