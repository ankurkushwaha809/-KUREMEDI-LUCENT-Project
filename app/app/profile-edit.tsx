import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { updateProfile } from "@/src/api";
import { useAuth } from "@/src/context/AuthContext";

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Text className="text-gray-500 mb-4">Please login to edit profile</Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Login</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      Alert.alert("Required", "Name is required");
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert("Invalid", "Enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        name: trimmedName,
        email: trimmedEmail || undefined,
      });
      await refreshUser();
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Edit Profile
        </Text>
        <View className="w-9" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Full Name
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Enter name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Enter email (optional)"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={loading}
            className="bg-teal-600 py-4 rounded-xl items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
