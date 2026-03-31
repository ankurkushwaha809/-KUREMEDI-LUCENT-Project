import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProductById } from "../../src/api";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { normalizeProductDetail, type ProductDetail } from "../../src/utils/product";
import { SkeletonProductDetail } from "../../src/components/Skeleton";
import { showToast } from "../../src/utils/toast";

function InfoRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-100 last:border-0">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className={`text-sm font-medium text-black ${valueClass}`} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(id)
      .then((data) => {
        const p = normalizeProductDetail(data) ?? null;
        setProduct(p);
        if (p?.minOrderQty && p.minOrderQty > 1) setQty(p.minOrderQty);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading && id) {
    return (
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f8faf8]">
        <SkeletonProductDetail />
      </View>
    );
  }
  if (!loading && !product && id) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-[#f0fdfa] items-center justify-center"
      >
        <Text className="text-base text-gray-500">Product not found</Text>
      </View>
    );
  }

  if (!id || !product) return null;

  const minQty = product.minOrderQty ?? 1;
  const maxQty = Math.min(product.stockQuantity ?? 9999, 999);
  const total = product.price * qty;
  const screenWidth = Dimensions.get("window").width;
  const imageWidth = screenWidth;
  const imageList = product.images?.length ? product.images : [product.image].filter(Boolean);
  const discount = product.discountPercent ?? (product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / imageWidth);
    setActiveSlide(Math.min(index, imageList.length - 1));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.kyc !== "APPROVED") {
      Alert.alert(
        "KYC Required",
        "Complete KYC verification to add items to cart.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Complete KYC", onPress: () => router.push("/kyc") },
        ]
      );
      return;
    }
    try {
      const addQty = Math.max(minQty, Math.min(qty, maxQty));
      await addItem(
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        addQty
      );
      showToast("Added to cart");
      router.back();
    } catch {
      showToast("Could not add to cart.", "error");
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-[#f0fdfa]">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-2 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>

        <Text className="text-lg font-semibold text-black">Pharmacy </Text>

        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator className="flex-1">
        {/* Image carousel with dots inside */}
        <View className="bg-teal-600 rounded-b-3xl overflow-hidden min-h-[260px]">
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onMomentumScrollEnd={onScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={imageWidth}
            snapToAlignment="start"
            style={{ width: screenWidth }}
          >
            {imageList.map((uri, idx) =>
              uri ? (
                <View
                  key={`${uri}-${idx}`}
                  style={{ width: imageWidth, height: 240 }}
                  className="items-center justify-center px-4"
                >
                  <View className="w-full flex-1 max-h-[200px] rounded-2xl overflow-hidden bg-white shadow-lg items-center justify-center">
                    <Image
                      source={{ uri }}
                      resizeMode="contain"
                      className="w-full h-full"
                      style={{ width: "100%", height: 200 }}
                    />
                  </View>
                </View>
              ) : null,
            )}
          </ScrollView>
          {/* Dot indicators inside image area */}
          {imageList.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center gap-1.5">
              {imageList.map((_, idx) => (
                <View
                  key={idx}
                  className={`rounded-full ${activeSlide === idx ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/50"}`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Card */}
        <View className="bg-white mx-4 -mt-4 rounded-2xl p-5 shadow-lg">
          {/* Badges row */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {product.categoryName && (
              <View className="bg-teal-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-teal-700">
                  {product.categoryName}
                </Text>
              </View>
            )}
            {product.prescriptionRequired && (
              <View className="bg-amber-100 px-3 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="medical" size={12} color="#b45309" />
                <Text className="text-xs font-semibold text-amber-800">
                  Prescription required
                </Text>
              </View>
            )}
            {discount > 0 && (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-green-700">
                  {discount}% off
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-start justify-between mb-4">
            <Text
              className="text-[22px] font-bold text-black flex-1"
              numberOfLines={2}
            >
              {product.name}
            </Text>
            {(product.brandName || product.brandLogo) && (
              <View className="flex-row items-center ml-2">
                {product.brandLogo ? (
                  <Image
                    source={{ uri: product.brandLogo }}
                    className="w-10 h-10 rounded-lg"
                    resizeMode="contain"
                  />
                ) : null}
                {product.brandName ? (
                  <Text
                    className="text-xs text-gray-500 ml-1"
                    numberOfLines={1}
                  >
                    {product.brandName}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Price row */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-xl font-bold text-teal-600">
              ₹{product.price}
            </Text>
            {product.mrp != null && product.mrp > product.price && (
              <Text className="text-sm text-gray-400 line-through">
                ₹{product.mrp}
              </Text>
            )}
            <Text className="text-sm text-gray-500">/ {product.unit}</Text>
          </View>

          {/* Specs grid */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-black mb-3">
              Product Details
            </Text>
            {product.manufacturer ? (
              <InfoRow label="Manufacturer" value={product.manufacturer} />
            ) : null}
            {product.composition ? (
              <InfoRow label="Composition" value={product.composition} />
            ) : null}
            {product.batchNumber ? (
              <InfoRow label="Batch No" value={product.batchNumber} />
            ) : null}
            {product.expiryDate ? (
              <InfoRow label="Expiry" value={product.expiryDate} />
            ) : null}
            {product.hsnCode ? (
              <InfoRow label="HSN Code" value={product.hsnCode} />
            ) : null}
            {product.gstPercent != null ? (
              <InfoRow label="GST" value={`${product.gstPercent}%`} />
            ) : null}
            {product.stockQuantity != null ? (
              <InfoRow
                label="Stock"
                value={
                  product.stockQuantity > 0
                    ? `${product.stockQuantity} available`
                    : "Out of stock"
                }
                valueClass={product.stockQuantity > 0 ? "" : "text-red-600"}
              />
            ) : null}
            {product.minOrderQty != null ? (
              <InfoRow
                label="Min order"
                value={`${product.minOrderQty} units`}
              />
            ) : null}
            {product.packing ? (
              <InfoRow label="Packing" value={product.packing} />
            ) : null}
          </View>

          {/* Description */}
          {(product.description || product.categoryDesc) && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-black mb-2">
                Description
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                {product.description || product.categoryDesc || "—"}
              </Text>
            </View>
          )}

          {/* Qty selector: min/max, inc-dec, type */}

          {/* Total */}
          <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-gray-200">
            <Text className="text-lg font-bold text-black">Total</Text>
            <Text className="text-2xl font-extrabold text-teal-600">
              ₹{total}
            </Text>
          </View>
        </View>

        <View className="h-[120px]" />
      </ScrollView>

      {/* Footer: Qty left, Add to Cart right */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 bg-white border-t border-gray-200"
      >
        <View className="flex-row items-center gap-3">
          {/* Left: Quantity selector */}
          <View className="flex-1">
            
            <View className="flex-row items-center border-2 border-teal-600 rounded-xl overflow-hidden bg-white">
              <Pressable
                onPress={() => setQty((q) => Math.max(minQty, q - 1))}
                className="px-3 py-3 bg-teal-50"
              >
                <Ionicons name="remove" size={20} color="#0d9488" />
              </Pressable>
              <TextInput
                value={String(qty)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/\D/g, ""), 10);
                  if (!isNaN(n)) setQty(Math.max(minQty, Math.min(maxQty, n)));
                  else if (t === "") setQty(minQty);
                }}
                onBlur={() => {
                  if (qty < minQty) setQty(minQty);
                  if (qty > maxQty) setQty(maxQty);
                }}
                keyboardType="number-pad"
                className="flex-1 text-center text-base font-bold text-teal-600 py-3 min-w-[48px]"
                selectTextOnFocus
              />
              <Pressable
                onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="px-3 py-3 bg-teal-50"
              >
                <Ionicons name="add" size={20} color="#0d9488" />
              </Pressable>
            </View>
          </View>

          {/* Right: Add to Cart */}
          <View className="flex-1">
           
            <Pressable
              onPress={handleAddToCart}
              disabled={(product.stockQuantity ?? 1) <= 0}
              className={`flex-row items-center justify-center px-4 py-4 rounded-xl ${(product.stockQuantity ?? 1) <= 0 ? "bg-gray-400" : "bg-teal-600"}`}
            >
              <Ionicons name="cart-outline" size={22} color="#fff" />
              <Text className="ml-2 text-base font-bold text-white">
                {(product.stockQuantity ?? 1) <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
