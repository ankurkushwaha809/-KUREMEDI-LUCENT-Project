import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content:
      "By using the Kuremedi app, you agree to these Terms and Conditions. If you do not agree, please do not use the app. We reserve the right to modify these terms at any time.",
  },
  {
    title: "Eligibility",
    content:
      "You must be at least 18 years of age to use this app. You must provide accurate information during registration and KYC verification. Use is limited to individuals who can legally enter into binding contracts.",
  },
  {
    title: "Account & KYC",
    content:
      "You are responsible for maintaining the confidentiality of your account. KYC verification is required to access certain features. You agree to provide genuine identity and address proofs as required by applicable regulations.",
  },
  {
    title: "Orders & Payments",
    content:
      "All orders are subject to availability. Prices and taxes are as displayed at checkout. Payment must be made through supported methods. We reserve the right to cancel orders in case of fraud or policy violations.",
  },
  {
    title: "Returns & Refunds",
    content:
      "Returns and refunds are subject to our return policy and applicable regulations. Prescription medicines may have different return rules. Please refer to individual product and order details for eligibility.",
  },
  {
    title: "Prohibited Use",
    content:
      "You must not misuse the app for illegal purposes, falsify prescriptions, resell products commercially without authorization, or attempt to circumvent security measures. Violations may result in account suspension.",
  },
  {
    title: "Limitation of Liability",
    content:
      "Kuremedi shall not be liable for any indirect, incidental, or consequential damages arising from use of the app or services. Our liability is limited to the amount paid for the specific order in question.",
  },
];

export default function TermsAndConditions() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-[#f8faf8]"
    >
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Terms & Conditions
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-gray-600 mb-6 leading-5">
          Please read these Terms and Conditions carefully before using the
          Kuremedi app and services.
        </Text>

        {SECTIONS.map((section, index) => (
          <View
            key={index}
            className="bg-white rounded-xl p-4 mb-4 border border-gray-200"
          >
            <Text className="text-base font-bold text-black mb-2">
              {section.title}
            </Text>
            <Text className="text-sm text-gray-600 leading-5">
              {section.content}
            </Text>
          </View>
        ))}

        <Text className="text-xs text-gray-500 text-center mt-4 mb-6">
          For queries, reach us via Support in the app.
        </Text>
      </ScrollView>
    </View>
  );
}
