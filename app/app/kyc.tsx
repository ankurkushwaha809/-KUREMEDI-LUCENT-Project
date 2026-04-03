import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import { submitKyc } from "@/src/api";
import { useAuth } from "@/src/context/AuthContext";

type PickedFile = { uri: string; name: string; mimeType: string } | null;

export default function KycScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { user, isAuthenticated, refreshUser, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drugLicenseNumber, setDrugLicenseNumber] = useState("");
  const [drugLicenseDoc, setDrugLicenseDoc] = useState<PickedFile>(null);
  const [gstNumber, setGstNumber] = useState("");
  const [gstDoc, setGstDoc] = useState<PickedFile>(null);
  const [shopImage, setShopImage] = useState<PickedFile>(null);
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [cancelChequeDoc, setCancelChequeDoc] = useState<PickedFile>(null);

  const pickFile = async (
    type: "drugLicense" | "gst" | "shopImage" | "cancelCheque",
  ): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:
          type === "shopImage" ? ["image/*"] : ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const picked: PickedFile = {
        uri: file.uri,
        name: file.name || "document",
        mimeType: file.mimeType || "application/pdf",
      };
      if (type === "drugLicense") setDrugLicenseDoc(picked);
      else if (type === "gst") setGstDoc(picked);
      else if (type === "shopImage") setShopImage(picked);
      else if (type === "cancelCheque") setCancelChequeDoc(picked);
    } catch {
      Alert.alert("Error", "Could not pick document");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Text className="text-gray-500 mb-4">Please login to access KYC</Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Login</Text>
        </Pressable>
      </View>
    );
  }

  if (user.kyc === "APPROVED") {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] px-4"
      >
        <Pressable onPress={() => router.back()} className="py-2 -ml-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
            <Ionicons name="shield-checkmark" size={40} color="#059669" />
          </View>
          <Text className="text-xl font-bold text-black">KYC Approved</Text>
          <Text className="text-gray-500 mt-2 text-center">
            Your KYC verification is complete.
          </Text>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    const hasDoc =
      drugLicenseDoc != null || gstDoc != null || shopImage != null;
    if (!hasDoc) {
      Alert.alert(
        "Documents required",
        "Please upload at least one document (drug license, GST, or shop photo).",
      );
      return;
    }

    if (!token) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      const append = (key: string, value: string) => {
        if (value.length > 0) formData.append(key, value);
      };
      append("drugLicenseNumber", drugLicenseNumber.trim());
      append("gstNumber", gstNumber.trim());
      append("bankName", bankName.trim());
      append("accountHolderName", accountHolderName.trim());
      append("accountNumber", accountNumber.trim());
      append("ifscCode", ifscCode.trim());
      formData.append("_", "1");

      const filePart = (file: PickedFile) => {
        if (!file) return null;
        const uri =
          Platform.OS === "ios" ? file.uri.replace(/^file:\/\//, "") : file.uri;
        return {
          uri,
          name: file.name,
          type: file.mimeType,
        } as unknown as Blob;
      };
      if (drugLicenseDoc) {
        const part = filePart(drugLicenseDoc);
        if (part) formData.append("drugLicenseDoc", part);
      }
      if (gstDoc) {
        const part = filePart(gstDoc);
        if (part) formData.append("gstDoc", part);
      }
      if (shopImage) {
        const part = filePart(shopImage);
        if (part) formData.append("shopImage", part);
      }
      if (cancelChequeDoc) {
        const part = filePart(cancelChequeDoc);
        if (part) formData.append("cancelChequeDoc", part);
      }

      await submitKyc(formData, token);
      await refreshUser();
      Alert.alert("Success", "KYC submitted successfully. Status: Pending.");
      if (params.redirect === "checkout") {
        router.replace("/checkout");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      };
      const dataMsg =
        e?.response?.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data
          ? String((e.response.data as { message?: unknown }).message)
          : null;
      const isNetworkError =
        !e?.response &&
        (e?.message === "Network Error" ||
          e?.code === "ECONNABORTED" ||
          e?.code === "ERR_NETWORK");
      const msg =
        dataMsg ||
        (e?.response?.status === 413
          ? "Files too large (max 5MB each)"
          : null) ||
        (e?.response?.status === 401 ? "Please log in again" : null) ||
        (e?.response?.status
          ? `Request failed (${e.response.status})`
          : null) ||
        (isNetworkError
          ? "Cannot reach server. Check Wi‑Fi, ensure the server is running, and try again."
          : null) ||
        e?.message ||
        "Failed to submit KYC. Check network and try again.";
      Alert.alert("KYC submit failed", msg);
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
          KYC Verification
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
          <Text className="text-gray-600 text-sm mb-4">
            Fill in your details and upload drug license, GST and shop photo for
            KYC verification.
          </Text>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Drug License Number
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Enter drug license number"
              placeholderTextColor="#9ca3af"
              value={drugLicenseNumber}
              onChangeText={setDrugLicenseNumber}
            />
            <Pressable
              onPress={() => pickFile("drugLicense")}
              className="flex-row items-center gap-2 mt-3 py-2.5 px-3 bg-teal-50 rounded-xl border border-teal-200"
            >
              <Ionicons name="document-attach" size={20} color="#0d9488" />
              <Text className="text-sm text-teal-700 flex-1">
                {drugLicenseDoc
                  ? drugLicenseDoc.name
                  : "Upload drug license document"}
              </Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              GST Number
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base"
              placeholder="Enter GST number"
              placeholderTextColor="#9ca3af"
              value={gstNumber}
              onChangeText={setGstNumber}
            />
            <Pressable
              onPress={() => pickFile("gst")}
              className="flex-row items-center gap-2 mt-3 py-2.5 px-3 bg-teal-50 rounded-xl border border-teal-200"
            >
              <Ionicons name="document-attach" size={20} color="#0d9488" />
              <Text className="text-sm text-teal-700 flex-1">
                {gstDoc ? gstDoc.name : "Upload GST document"}
              </Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Shop photo
            </Text>
            <Pressable
              onPress={() => pickFile("shopImage")}
              className="flex-row items-center gap-2 py-2.5 px-3 bg-teal-50 rounded-xl border border-teal-200"
            >
              <Ionicons name="camera" size={20} color="#0d9488" />
              <Text className="text-sm text-teal-700 flex-1">
                {shopImage ? shopImage.name : "Upload shop / store photo"}
              </Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-800 mb-3">
              Bank Details
            </Text>
            <View className="gap-3">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                  placeholder="e.g. SBI, HDFC"
                  placeholderTextColor="#9ca3af"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                  placeholder="As per bank account"
                  placeholderTextColor="#9ca3af"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                  placeholder="Bank account number"
                  placeholderTextColor="#9ca3af"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                  placeholder="e.g. SBIN0001234"
                  placeholderTextColor="#9ca3af"
                  value={ifscCode}
                  onChangeText={(text) => setIfscCode(text.toUpperCase())}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Cancel Cheque / Passbook
                </Text>
                <Pressable
                  onPress={() => pickFile("cancelCheque")}
                  className="flex-row items-center gap-2 py-2.5 px-3 bg-teal-50 rounded-xl border border-teal-200"
                >
                  <Ionicons name="document-attach" size={20} color="#0d9488" />
                  <Text className="text-sm text-teal-700 flex-1">
                    {cancelChequeDoc
                      ? cancelChequeDoc.name
                      : "Upload cancel cheque"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={{ minHeight: 52, marginTop: 8 }}
            className="bg-teal-600 py-4 rounded-xl items-center justify-center active:opacity-80"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Submit KYC</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
