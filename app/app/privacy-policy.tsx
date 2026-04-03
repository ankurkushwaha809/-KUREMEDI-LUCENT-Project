import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide directly (name, phone, email, address), order and payment details, and information from your device such as IP address and app usage data to provide and improve our pharmacy services.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Your information is used to process orders, verify KYC, manage your wallet, send order updates, provide customer support, and improve our services. We may also use it for promotional communications if you have opted in.",
  },
  {
    title: "Data Sharing",
    content:
      "We do not sell your personal data. We may share information with service providers (payment processors, delivery partners) strictly to fulfil your orders. We comply with applicable laws and only share when necessary.",
  },
  {
    title: "Data Security",
    content:
      "We implement industry-standard security measures to protect your data. Sensitive information such as health-related details and payment data is encrypted and stored securely.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications. Contact our support team for any privacy-related requests.",
  },
  {
    title: "Updates",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or email. Continued use of the app after changes constitutes acceptance.",
  },
];

export default function PrivacyPolicy() {
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
          Privacy Policy
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
          Last updated: {new Date().toLocaleDateString("en-IN")}. Kuremedi
          respects your privacy. This policy describes how we collect, use, and
          protect your information.
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
          For questions, contact us through Support in the app.
        </Text>
      </ScrollView>
    </View>
  );
}
