import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginWithPassword } from "@/src/api";
import { useAuth } from "@/src/context/AuthContext";
import type { User } from "@/src/context/AuthContext";

function Field({
  iconName,
  error,
  className = "",
  ...props
}: {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  error?: string;
  className?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <View className="relative">
        <View className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Ionicons name={iconName} size={18} color="#94a3b8" />
        </View>
        <TextInput
          {...props}
          placeholderTextColor="#94a3b8"
          className={`w-full rounded-2xl border bg-white px-11 py-3.5 text-sm text-slate-900 outline-none transition ${
            error ? "border-rose-400" : "border-slate-200"
          } ${className}`}
        />
      </View>
      {error ? <Text className="mt-2 text-sm text-rose-600">{error}</Text> : null}
    </View>
  );
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const { token, login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [token]);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const handleLogin = async () => {
    const email = normalizeEmail(form.email);
    const password = form.password.trim();
    const nextErrors: { email?: string; password?: string } = {};

    if (!email) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!password) nextErrors.password = "Password is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const data = await loginWithPassword(email, password);

      if (data?.token && data?.user) {
        await login(data.token, data.user as User);
        router.replace((data.user as User)?.kyc !== "APPROVED" ? "/kyc" : "/(tabs)");
        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password";
      setErrors({ password: message });
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    Alert.alert(
      "Need help?",
      "Use the signup page if you are new, or contact support if you cannot access your account.",
    );
  };

  const handleClose = () => {
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-[#f8fafc]" style={{ paddingTop: insets.top }}>
      <View className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-cyan-200 opacity-40" />
      <View className="absolute -left-20 bottom-16 h-64 w-64 rounded-full bg-emerald-100 opacity-60" />
      <View className="absolute right-10 bottom-32 h-20 w-20 rounded-full bg-amber-100 opacity-70" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
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
            <View className="mb-4 flex-row justify-end">
              <Pressable onPress={handleClose} className="h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                <Ionicons name="close" size={22} color="#0f172a" />
              </Pressable>
            </View>

            <View
              className="rounded-[28px] border border-white/80 bg-white px-6 py-8"
              style={{
                shadowColor: "#0f172a",
                shadowOpacity: 0.08,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 16 },
                elevation: 6,
              }}
            >
              <Text className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Login</Text>
              <Text className="mt-2 text-4xl font-black tracking-tight text-slate-950">Welcome back</Text>
              <Text className="mt-3 text-sm leading-6 text-slate-600">
                Login with your email and password. If you forget either, use recovery to reset on a separate page.
              </Text>

              <View className="mt-7 gap-4">
                <Field
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  placeholder="Email address"
                  value={form.email}
                  error={errors.email}
                  editable={!loading}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                />

                <View>
                  <View className="relative">
                    <View className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                    </View>

                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={!showPassword}
                      value={form.password}
                      editable={!loading}
                      onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
                      className={`w-full rounded-2xl border bg-white px-11 py-3.5 pr-12 text-sm text-slate-900 outline-none transition ${
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
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>
                  {errors.password ? <Text className="mt-2 text-sm text-rose-600">{errors.password}</Text> : null}
                </View>

                <View className="flex-row items-center justify-between gap-4">
                  <Pressable onPress={handleForgot}>
                    <Text className="text-sm font-semibold text-[#d97706]">Forgot email or password?</Text>
                  </Pressable>

                  <Link href="/signup" className="text-sm font-semibold text-cyan-700">
                    Create account
                  </Link>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5"
                  style={{ minHeight: 54 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base font-semibold text-white">Login</Text>
                  )}
                  {!loading ? <Ionicons name="arrow-forward" size={18} color="#fff" /> : null}
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}