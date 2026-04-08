import { Ionicons } from "@expo/vector-icons";
import { router, Link } from "expo-router";
import { useMemo, useRef, useState } from "react";
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
import { completeRegistration, sendOtp, verifyOtp } from "@/src/api";
import { useAuth } from "@/src/context/AuthContext";
import type { User } from "@/src/context/AuthContext";

type Step = 1 | 2 | 3;

type FieldProps = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  error?: string;
  className?: string;
} & React.ComponentProps<typeof TextInput>;

function Field({ iconName, error, className = "", ...props }: FieldProps) {
  return (
    <View>
      <View className="relative">
        <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
          <Ionicons name={iconName} size={18} color="#94a3b8" />
        </View>
        <TextInput
          {...props}
          placeholderTextColor="#94a3b8"
          className={`w-full rounded-2xl border bg-white px-11 py-3.5 text-sm text-slate-900 ${
            error ? "border-rose-400" : "border-slate-200"
          } ${className}`}
        />
      </View>
      {error ? <Text className="mt-2 text-sm text-rose-600">{error}</Text> : null}
    </View>
  );
}

function OtpInputs({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = useMemo(
    () => Array.from({ length: 6 }, (_, index) => value[index] ?? ""),
    [value],
  );

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const setOtpValue = (nextValue: string, index: number) => {
    const sanitized = nextValue.replace(/\D/g, "");
    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
      return;
    }

    if (sanitized.length > 1) {
      const nextDigits = sanitized.slice(0, 6).split("");
      onChange(nextDigits.join(""));
      const nextIndex = Math.min(nextDigits.length, 5);
      focusInput(nextIndex);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = sanitized;
    onChange(nextDigits.join(""));
    if (index < 5) focusInput(index + 1);
  };

  return (
    <View>
      <View className="flex-row justify-between gap-2">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            editable={!disabled}
            onChangeText={(text) => setOtpValue(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                focusInput(index - 1);
              }
            }}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={1}
            textAlign="center"
            placeholder=""
            className={`h-14 w-11 rounded-2xl border bg-white text-center text-lg font-bold text-slate-900 ${
              error ? "border-rose-400" : "border-slate-200"
            }`}
          />
        ))}
      </View>
      {error ? <Text className="mt-2 text-sm text-rose-600">{error}</Text> : null}
    </View>
  );
}

export default function Signup() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const redirectAfterLogin = async (user: User, token: string) => {
    await login(token, user);
    if (user.kyc !== "APPROVED") {
      router.replace("/kyc");
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSendOtp = async () => {
    const cleanedPhone = normalizePhone(phone);
    if (cleanedPhone.length !== 10) {
      setErrors({ phone: "Enter a valid 10-digit mobile number" });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await sendOtp(cleanedPhone);
      setPhone(cleanedPhone);
      setOtp("");
      setTempToken(null);
      setStep(2);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send OTP";
      setErrors({ phone: message });
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanedOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (cleanedOtp.length !== 6) {
      setErrors({ otp: "Enter the 6-digit OTP" });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const data = await verifyOtp(phone, cleanedOtp);

      if (data?.needsRegistration) {
        setTempToken(data.tempToken || null);
        setStep(3);
        return;
      }

      if (data?.token && data?.user) {
        await redirectAfterLogin(data.user as User, data.token as string);
        return;
      }

      throw new Error(data?.message || "OTP verification failed");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid OTP. Please try again.";
      setErrors({ otp: message });
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();
    const trimmedReferralCode = referralCode.trim();
    const nextErrors: Record<string, string> = {};

    if (!tempToken) nextErrors.otp = "Session expired. Verify OTP again.";
    if (!trimmedName) nextErrors.name = "Name is required";
    if (!trimmedEmail) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!trimmedPassword) nextErrors.password = "Password is required";
    else if (trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const data = await completeRegistration(tempToken as string, {
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        referralCode: trimmedReferralCode,
      });

      if (data?.token && data?.user) {
        await redirectAfterLogin(data.user as User, data.token as string);
        return;
      }

      throw new Error(data?.message || "Registration failed");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed. Please try again.";
      setErrors({ password: message });
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setTempToken(null);
      return;
    }

    if (step === 2) {
      setStep(1);
      setOtp("");
      return;
    }

    router.back();
  };

  const handleClose = () => {
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-[#f8fafc]" style={{ paddingTop: insets.top }}>
      <View className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-cyan-200 opacity-40" />
      <View className="absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-emerald-100 opacity-60" />
      <View className="absolute right-10 bottom-32 h-20 w-20 rounded-full bg-amber-100 opacity-70" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingTop: 20,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full max-w-[460px]">
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                <Ionicons name="chevron-back" size={22} color="#0f172a" />
              </Pressable>

              <View className="rounded-full bg-white px-3 py-1 border border-slate-200">
                <Text className="text-xs font-semibold text-slate-600">Step {step}/3</Text>
              </View>

              <Pressable onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                <Ionicons name="close" size={22} color="#0f172a" />
              </Pressable>
            </View>

            <View
              className="rounded-[28px] border border-white/80 bg-white px-5 py-6"
              style={{
                shadowColor: "#0f172a",
                shadowOpacity: 0.08,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 16 },
                elevation: 6,
              }}
            >
              <View className="w-16 h-16 rounded-full bg-cyan-100 items-center justify-center self-center mb-4 overflow-hidden">
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={{ width: 64, height: 64 }}
                  resizeMode="cover"
                />
              </View>

              <Text className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700 text-center">
                Signup
              </Text>
              <Text className="mt-2 text-3xl font-black tracking-tight text-slate-950 text-center">
                Create your account
              </Text>
              <Text className="mt-3 text-sm leading-6 text-slate-600 text-center">
                Use your mobile number to verify, then complete your account details.
              </Text>

              <View className="mt-6 flex-row gap-2">
                <View className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-cyan-500" : "bg-slate-200"}`} />
                <View className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-cyan-500" : "bg-slate-200"}`} />
                <View className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-cyan-500" : "bg-slate-200"}`} />
              </View>

              <View className="mt-7">
                {step === 1 ? (
                  <View className="gap-5">
                    <Field
                      iconName="call-outline"
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      error={errors.phone}
                      editable={!loading}
                      onChangeText={(text) => setPhone(normalizePhone(text))}
                    />

                    <Pressable
                      onPress={handleSendOtp}
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5"
                      style={{ minHeight: 54 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-sm font-semibold text-white">Send OTP</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}

                {step === 2 ? (
                  <View className="gap-5">
                    <View className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
                      <Text className="text-sm text-cyan-900">OTP sent to +91 {phone}</Text>
                    </View>

                    <OtpInputs
                      value={otp}
                      onChange={setOtp}
                      error={errors.otp}
                      disabled={loading}
                    />

                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => {
                          setStep(1);
                          setOtp("");
                        }}
                        disabled={loading}
                        className="w-1/2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5"
                        style={{ minHeight: 54 }}
                      >
                        <Text className="text-center text-sm font-semibold text-slate-700">
                          Change number
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={handleVerifyOtp}
                        disabled={loading}
                        className="w-1/2 rounded-2xl bg-slate-950 px-5 py-3.5"
                        style={{ minHeight: 54 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-center text-sm font-semibold text-white">
                            Verify OTP
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {step === 3 ? (
                  <View className="gap-5">
                    <Field
                      iconName="person-outline"
                      placeholder="Full name"
                      value={name}
                      error={errors.name}
                      editable={!loading}
                      onChangeText={setName}
                    />

                    <Field
                      iconName="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Email address"
                      value={email}
                      error={errors.email}
                      editable={!loading}
                      onChangeText={setEmail}
                    />

                    <View>
                      <View className="relative">
                        <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                        </View>

                        <TextInput
                          placeholder="Create password"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="none"
                          autoCorrect={false}
                          secureTextEntry={!showPassword}
                          value={password}
                          editable={!loading}
                          onChangeText={setPassword}
                          className={`w-full rounded-2xl border bg-white px-11 py-3.5 pr-12 text-sm text-slate-900 ${
                            errors.password ? "border-rose-400" : "border-slate-200"
                          }`}
                        />

                        <Pressable
                          onPress={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2"
                        >
                          <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#64748b"
                          />
                        </Pressable>
                      </View>
                      {errors.password ? (
                        <Text className="mt-2 text-sm text-rose-600">{errors.password}</Text>
                      ) : null}
                    </View>

                    <Field
                      iconName="pricetag-outline"
                      placeholder="Referral code (optional)"
                      autoCapitalize="characters"
                      value={referralCode}
                      error={errors.referralCode}
                      editable={!loading}
                      onChangeText={setReferralCode}
                    />

                    <Pressable
                      onPress={handleCompleteRegistration}
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5"
                      style={{ minHeight: 54 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-sm font-semibold text-white">
                          Complete Signup
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View className="mt-7 items-center">
                <Text className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-cyan-700">
                    Login
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}