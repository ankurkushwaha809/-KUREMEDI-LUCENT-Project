import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendOtp, verifyOtp, completeRegistration } from "@/src/api";
import { useAuth } from "@/src/context/AuthContext";
import type { User } from "@/src/context/AuthContext";

type Step = "mobile" | "otp" | "register";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("mobile");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const formatPhone = (val: string) => {
    return val.replace(/\D/g, "").slice(0, 10);
  };

  const handleSendOTP = async () => {
    const cleaned = formatPhone(phone);
    if (cleaned.length < 10) {
      Alert.alert("Invalid", "Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(cleaned);
      setPhone(cleaned);
      setStep("otp");
      setOtp("");
      if (res?.devOtp) setDevOtp(res.devOtp);
      else setDevOtp(null);
      setTempToken(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send OTP";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Invalid", "Enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtp(phone, otp.trim());

      if (res.needsRegistration) {
        setTempToken(res.tempToken);
        setStep("register");
      } else if (res.user && res.token) {
        await login(res.token, res.user as User);
        const u = res.user as User;
        if (u.kyc !== "APPROVED") {
          router.replace("/kyc");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid OTP. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      Alert.alert("Required", "Name and email are required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert("Invalid", "Enter a valid email address");
      return;
    }

    if (!tempToken) {
      Alert.alert("Error", "Session expired. Please start again.");
      return;
    }

    try {
      setLoading(true);
      const res = await completeRegistration(tempToken, {
        name: trimmedName,
        email: trimmedEmail,
        referralCode: referralCode.trim(),
      });

      if (res.user && res.token) {
        await login(res.token, res.user as User);
        const u = res.user as User;
        if (u.kyc !== "APPROVED") {
          router.replace("/kyc");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        Alert.alert("Error", "Registration failed");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("mobile");
      setOtp("");
      setDevOtp(null);
    } else if (step === "register") {
      setStep("otp");
      setTempToken(null);
    } else {
      router.back();
    }
  };

  const renderMobileStep = () => (
    <>
      <Text className="text-[22px] font-bold text-[#111] text-center mb-2">
        Enter your mobile
      </Text>

      <Text className="text-sm text-gray-500 text-center mb-6">
        {"We'll send a verification code to this number"}
      </Text>

      <View className="mb-4">
        <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
          <Text className="text-base font-semibold text-gray-500">+91</Text>
        </View>

        <TextInput
          className="bg-gray-100 rounded-xl px-4 pl-14 py-4 text-base text-[#111]"
          placeholder="10-digit mobile number"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={(t: string) => setPhone(formatPhone(t))}
          editable={!loading}
          autoFocus
        />
      </View>

      <Pressable
        onPress={handleSendOTP}
        disabled={loading}
        className={`mt-2 rounded-2xl min-h-[52px] items-center justify-center bg-[#A0E2E8] ${
          loading ? "opacity-80" : ""
        }`}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-base font-bold text-black">Send OTP</Text>
        )}
      </Pressable>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text className="text-[22px] font-bold text-[#111] text-center mb-2">
        Enter OTP
      </Text>

      <Text className="text-sm text-gray-500 text-center mb-6">
        OTP sent to +91 {phone}
      </Text>

      <View className="mb-4">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 text-center text-[20px] font-semibold tracking-[8px] text-[#111]"
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          editable={!loading}
          autoFocus
        />

        {/* {devOtp && (
          <Text className="text-xs text-gray-400 mt-2 text-center">
            Dev OTP: {devOtp}
          </Text>
        )} */}
      </View>

      <Pressable
        onPress={handleVerifyOTP}
        disabled={loading}
        className={`mt-2 rounded-2xl min-h-[52px] items-center justify-center bg-[#A0E2E8] ${
          loading ? "opacity-80" : ""
        }`}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-base font-bold text-black">Verify & Login</Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleSendOTP}
        disabled={loading}
        className="mt-4 items-center"
      >
        <Text className="text-sm font-semibold text-teal-600">Resend OTP</Text>
      </Pressable>
    </>
  );

  const renderRegisterStep = () => (
    <>
      <Text className="text-[22px] font-bold text-[#111] text-center mb-2">
        Complete Registration
      </Text>

      <Text className="text-sm text-gray-500 text-center mb-6">
        {"You're a new user. Please provide your details."}
      </Text>

      <View className="mb-4">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 text-base text-[#111]"
          placeholder="Full Name *"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 text-base text-[#111]"
          placeholder="Email *"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 text-base text-[#111]"
          placeholder="Referral Code (optional)"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          value={referralCode}
          onChangeText={setReferralCode}
          editable={!loading}
        />
      </View>

      <Pressable
        onPress={handleCompleteRegistration}
        disabled={loading}
        className={`mt-2 rounded-2xl min-h-[52px] items-center justify-center bg-[#A0E2E8] ${
          loading ? "opacity-80" : ""
        }`}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-base font-bold text-black">
            Complete & Login
          </Text>
        )}
      </Pressable>
    </>
  );

  return (
    <View className="flex-1 bg-[#f8faf8]" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-grow px-6 pt-6"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-8">
            <Pressable onPress={handleBack} className="p-1">
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>

            <Text className="text-[18px] font-semibold text-[#111]">Login</Text>

            <View className="w-9" />
          </View>

          <View className="bg-white rounded-[20px] p-6 border border-gray-200">
            <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center self-center mb-5 overflow-hidden">
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
            </View>

            {step === "mobile" && renderMobileStep()}
            {step === "otp" && renderOtpStep()}
            {step === "register" && renderRegisterStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
