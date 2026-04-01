import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAQ_ITEMS = [
  {
    q: "How do I place an order?",
    a: "Browse products, add to cart, and proceed to checkout. Enter your delivery address and choose a payment method. For prescription medicines, upload a valid prescription when prompted.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI, debit/credit cards, net banking, and wallet payments. You can also use your Kuremedi wallet balance for orders.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery timelines vary by location. Standard delivery is typically 2–5 business days. Express delivery options may be available in select areas.",
  },
  {
    q: "Why is KYC required?",
    a: "KYC verification is mandatory for regulated products and to ensure secure transactions. It helps us comply with applicable laws and prevent misuse.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your referral code with friends. When they sign up and complete their first qualifying order, both you and your friend earn wallet credits as per our current referral terms.",
  },
  {
    q: "Can I return or cancel an order?",
    a: "Yes. You can cancel before dispatch. For returns after delivery, our return policy applies—some items like prescription medicines may have restrictions. Check order details for eligibility.",
  },
  {
    q: "How do I contact support?",
    a: "Go to Profile → Support to start a chat. You can also use quick topics for order, payment, wallet, or KYC queries. Our team will respond as soon as possible.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use encryption and secure protocols to protect your personal and payment information. Read our Privacy Policy for full details.",
  },
];

export default function FAQ() {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

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
          FAQ
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
          Find answers to common questions about Kuremedi.
        </Text>

        {FAQ_ITEMS.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <Pressable
              key={index}
              onPress={() => setExpandedIndex(isExpanded ? null : index)}
              className="bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden active:opacity-95"
            >
              <View className="flex-row items-center justify-between p-4">
                <Text
                  className="flex-1 text-base font-semibold text-black pr-2"
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {item.q}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={22}
                  color="#0d9488"
                />
              </View>
              {isExpanded && (
                <View className="px-4 pb-4 pt-0">
                  <Text className="text-sm text-gray-600 leading-5">
                    {item.a}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
