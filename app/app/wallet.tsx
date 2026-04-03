import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useAuth } from "@/src/context/AuthContext";
import {
  getWallet,
  createWalletRechargeOrder,
  verifyWalletRecharge,
  type WalletTransaction,
} from "@/src/api";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [recharging, setRecharging] = useState(false);
  const [rechargeWebView, setRechargeWebView] = useState<{
    keyId: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);
  const [receiptPopup, setReceiptPopup] = useState<{
    amount: number;
    newBalance: number;
    receipt: string;
  } | null>(null);

  const fetchBalance = () => {
    getWallet()
      .then((w) => {
        setBalance(w?.balance ?? 0);
        setTransactions(w?.transactions ?? []);
      })
      .catch(() => {
        setBalance(0);
        setTransactions([]);
      });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBalance();
  }, [isAuthenticated]);

  const handleRechargeWebViewMessage = async (event: {
    nativeEvent: { data: string };
  }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        razorpay_order_id?: string;
        cancelled?: boolean;
        error?: string;
      };
      if (data.cancelled || data.error) {
        setRechargeWebView(null);
        setRecharging(false);
        if (data.error) Alert.alert("Payment Failed", data.error);
        return;
      }
      if (
        !rechargeWebView ||
        !data.razorpay_payment_id ||
        !data.razorpay_signature
      )
        return;
      const res = await verifyWalletRecharge({
        razorpayOrderId: rechargeWebView.razorpayOrderId,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
      });
      setRechargeWebView(null);
      setRecharging(false);
      setRechargeAmount("");
      fetchBalance();
      setReceiptPopup({
        amount: res?.amount ?? 0,
        newBalance: res?.newBalance ?? 0,
        receipt: (res?.receipt ?? data.razorpay_payment_id ?? "").slice(0, 40),
      });
    } catch {
      setRechargeWebView(null);
      setRecharging(false);
      Alert.alert("Error", "Failed to verify recharge");
    }
  };

  const handleRecharge = async () => {
    const amt = Math.round(Number(rechargeAmount) || 0);
    if (amt < 1) {
      Alert.alert("Invalid Amount", "Please enter a valid amount (min ₹1)");
      return;
    }
    if (amt > 100000) {
      Alert.alert("Invalid Amount", "Maximum recharge is ₹1,00,000");
      return;
    }

    setRecharging(true);
    try {
      const res = await createWalletRechargeOrder(amt);
      if (!res.razorpayOrderId || !res.keyId) {
        Alert.alert(
          "Error",
          "Payment gateway not configured. Contact support."
        );
        setRecharging(false);
        return;
      }
      setRechargeWebView({
        keyId: res.keyId,
        razorpayOrderId: res.razorpayOrderId,
        amount: res.amount * 100,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create recharge";
      Alert.alert("Error", msg);
      setRecharging(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f8faf8] items-center justify-center px-4"
      >
        <Text className="text-gray-500 mb-4">Please login to view Wallet</Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="bg-teal-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-black text-center -ml-6">
          Wallet
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-6 pt-8 pb-6">
          <View className="w-24 h-24 rounded-full bg-teal-100 items-center justify-center mb-4">
            <Ionicons name="wallet-outline" size={48} color="#0d9488" />
          </View>
          {balance === null ? (
            <ActivityIndicator size="large" color="#0d9488" />
          ) : (
            <Text className="text-2xl font-bold text-black text-center mb-1">
              ₹{balance.toFixed(2)}
            </Text>
          )}
          <Text className="text-gray-500 text-center mb-6">
            Available balance
          </Text>
        </View>

        {/* Recharge section */}
        <View className="px-4">
          <Text className="text-base font-bold text-black mb-3">
            Recharge Wallet
          </Text>
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-gray-600 text-sm mb-2">Enter amount (₹)</Text>
            <TextInput
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
              placeholder="e.g. 500"
              keyboardType="number-pad"
              className="bg-gray-100 rounded-lg px-4 py-3 text-lg font-medium mb-3"
            />
            <View className="flex-row flex-wrap gap-2 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => setRechargeAmount(String(amt))}
                  className={`px-4 py-2 rounded-lg ${
                    rechargeAmount === String(amt)
                      ? "bg-teal-600"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={
                      rechargeAmount === String(amt)
                        ? "text-white font-semibold"
                        : "text-gray-700"
                    }
                  >
                    ₹{amt}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={handleRecharge}
              disabled={recharging || !rechargeAmount}
              className="bg-teal-600 py-3 rounded-xl items-center"
            >
              {recharging ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Recharge ₹{rechargeAmount || "0"}
                </Text>
              )}
            </Pressable>
          </View>

          <View className="bg-teal-50 rounded-xl p-4 mt-4 border border-teal-200">
            <Text className="text-teal-800 text-sm text-center">
              Use your wallet balance at checkout. You can combine wallet with
              Razorpay for the remaining amount. Min ₹1, max ₹1,00,000 per
              recharge.
            </Text>
          </View>

          {/* Recent transactions (referral bonus, recharge, etc.) */}
          <View className="mt-6">
            <Text className="text-base font-bold text-black mb-3">
              Recent transactions
            </Text>
            {transactions.length === 0 ? (
              <View className="bg-white rounded-xl p-6 border border-gray-200 items-center">
                <Ionicons name="receipt-outline" size={40} color="#9ca3af" />
                <Text className="text-gray-500 mt-2">No transactions yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Referral bonus and recharge will appear here
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {transactions.map((tx, i) => {
                  const isCredit = tx.type === "CREDIT";
                  const isReferral = (tx.description || "").toLowerCase().includes("referral");
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "";
                  return (
                    <View
                      key={i}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        i > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      <View className="flex-1">
                        <Text className="font-medium text-black" numberOfLines={1}>
                          {isReferral ? "Referral bonus" : tx.description || (isCredit ? "Credit" : "Debit")}
                        </Text>
                        {dateStr ? (
                          <Text className="text-gray-500 text-sm mt-0.5">{dateStr}</Text>
                        ) : null}
                      </View>
                      <Text
                        className={`font-semibold ${
                          isCredit ? "text-green-600" : "text-gray-800"
                        }`}
                      >
                        {isCredit ? "+" : ""}₹{Math.abs(tx.amount).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Razorpay WebView modal */}
      <Modal
        visible={!!rechargeWebView}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setRechargeWebView(null);
          setRecharging(false);
        }}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-12 bg-white rounded-t-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <Text className="text-lg font-semibold text-black">
                Complete Recharge
              </Text>
              <Pressable
                onPress={() => {
                  setRechargeWebView(null);
                  setRecharging(false);
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
            {rechargeWebView && (
              <WebView
                source={{
                  html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;font-family:system-ui">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function(){
  var key="${rechargeWebView.keyId.replace(/"/g, '\\"')}";
  var amount=${rechargeWebView.amount};
  var orderId="${rechargeWebView.razorpayOrderId.replace(/"/g, '\\"')}";
  var opts={
    key:key,
    amount:amount,
    currency:"INR",
    order_id:orderId,
    name:"Kuremedi",
    description:"Wallet recharge",
    handler:function(response){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          razorpay_payment_id:response.razorpay_payment_id,
          razorpay_signature:response.razorpay_signature,
          razorpay_order_id:response.razorpay_order_id
        }));
      }
    },
    modal:{ondismiss:function(){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({cancelled:true}));
      }
    }}
  };
  var rzp=new Razorpay(opts);
  rzp.open();
})();
</script>
<p style="color:#6b7280;text-align:center">Complete payment to recharge your wallet.</p>
</body></html>`,
                }}
                onMessage={handleRechargeWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Receipt popup after successful recharge */}
      <Modal
        visible={!!receiptPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptPopup(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setReceiptPopup(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-green-100 items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={32} color="#059669" />
              </View>
              <Text className="text-lg font-bold text-black">Recharge Successful</Text>
            </View>
            {receiptPopup && (
              <View className="border-t border-gray-200 pt-4">
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600">Amount</Text>
                  <Text className="font-semibold">₹{receiptPopup.amount.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600">New Balance</Text>
                  <Text className="font-semibold text-teal-600">₹{receiptPopup.newBalance.toFixed(2)}</Text>
                </View>
                <View className="py-2">
                  <Text className="text-gray-600 text-sm mb-1">Receipt</Text>
                  <Text className="font-mono text-sm text-gray-800" numberOfLines={2}>
                    {receiptPopup.receipt || "—"}
                  </Text>
                </View>
              </View>
            )}
            <Pressable
              onPress={() => setReceiptPopup(null)}
              className="bg-teal-600 py-3 rounded-xl items-center mt-4"
            >
              <Text className="text-white font-bold">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
