import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProducts, getCategories, getBrands } from "../../src/api";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { useWishlist } from "../../src/context/WishlistContext";
import { normalizeProducts, type AppProduct } from "../../src/utils/product";
import { showToast } from "../../src/utils/toast";
import {
  normalizeCategories,
  type AppCategory,
} from "../../src/utils/category";
import { normalizeBrands, type AppBrand } from "../../src/utils/brand";
import { KycBanner } from "../../src/components/KycBanner";
import {
  SkeletonBanner,
  SkeletonCategoryGrid,
  SkeletonBrandGrid,
  SkeletonProductRow,
} from "../../src/components/Skeleton";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.5;
const BANNER_WIDTH = width - 32;

const BANNER_IMAGES = [
  require("@/assets/banner.jpeg"),
  require("@/assets/banner.jpeg"),
  require("@/assets/banner.jpeg"),
];

export default function Home() {
  const insets = useSafeAreaInsets();

  const { addItem, updateItemQty, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();

  const handleAddToCart = async (item: AppProduct, addQty?: number) => {
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
        ],
      );
      return;
    }
    const qty = addQty ?? item.minOrderQty ?? 1;
    try {
      await addItem(
        {
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
        },
        qty,
      );
      showToast("Added to cart");
    } catch {
      showToast("Could not add to cart. Complete KYC if you haven't.", "error");
      router.push("/kyc");
    }
  };

  const handleDecrease = (item: AppProduct) => {
    if (!isAuthenticated) return;
    if (editingQtyId === item._id) setEditingQtyId(null);
    const curr = items.find((i) => i._id === item._id)?.qty ?? 0;
    const minQty = item.minOrderQty ?? 1;
    const newQty = curr <= minQty ? 0 : curr - 1;
    updateItemQty(item._id, newQty);
  };

  const handleIncrease = (item: AppProduct) => {
    if (!isAuthenticated) return;
    if (editingQtyId === item._id) setEditingQtyId(null);
    const curr = items.find((i) => i._id === item._id)?.qty ?? 0;
    const max = item.stockQuantity ?? 9999;
    const newQty = Math.min(max, curr + 1);
    updateItemQty(item._id, newQty);
  };

  const handleQtyFocus = (item: AppProduct) => {
    const val = String(getQty(item._id));
    setEditingQtyId(item._id);
    setEditingQtyVal(val);
    editingQtyValRef.current = val;
  };

  const handleQtyBlur = (item: AppProduct) => {
    setEditingQtyId(null);
    const text = editingQtyValRef.current;
    const n = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(n) || n < 0) {
      updateItemQty(item._id, 0);
      return;
    }
    const minQty = item.minOrderQty ?? 1;
    const max = item.stockQuantity ?? 9999;
    const clamped = n === 0 ? 0 : Math.min(max, Math.max(minQty, n));
    updateItemQty(item._id, clamped);
  };

  const [products, setProducts] = useState<AppProduct[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [brands, setBrands] = useState<AppBrand[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyVal, setEditingQtyVal] = useState("");
  const editingQtyValRef = useRef("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNER_IMAGES.length;
        bannerScrollRef.current?.scrollTo({
          x: next * BANNER_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Single batched load: products, categories, brands in parallel to avoid multiple paints and slow API
  useEffect(() => {
    setLoadingHome(true);
    Promise.all([getProducts(), getCategories(), getBrands()])
      .then(([productsData, categoriesData, brandsData]) => {
        setProducts(normalizeProducts(productsData));
        setCategories(normalizeCategories(categoriesData));
        setBrands(normalizeBrands(brandsData));
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
        setBrands([]);
      })
      .finally(() => setLoadingHome(false));
  }, []);

  const getQty = (id: string) => items.find((i) => i._id === id)?.qty ?? 0;

  const bestSelling = useMemo(() => {
    return [...products].sort((a, b) => {
      const dA = a.discountPercent ?? 0;
      const dB = b.discountPercent ?? 0;
      if (dB !== dA) return dB - dA;
      return (b.price ?? 0) - (a.price ?? 0);
    });
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].sort((a, b) => {
      const tA = new Date(a.createdAt ?? 0).getTime();
      const tB = new Date(b.createdAt ?? 0).getTime();
      return tB - tA;
    });
  }, [products]);

  const healthEssentials = useMemo(() => {
    return [...products].sort((a, b) => {
      const stockA = a.stockQuantity ?? 0;
      const stockB = b.stockQuantity ?? 0;
      if (stockA !== stockB) return stockB - stockA;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }, [products]);

  const renderSlider = (title: string, data: AppProduct[]) => (
    <View className="mb-8">
      <Text className="text-lg font-bold text-black mb-3 px-4">{title}</Text>

      <FlatList
        horizontal
        data={data}
        keyExtractor={(i) => i._id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const qty = getQty(item._id);
          const wished = isInWishlist(item._id);

          return (
            <View
              className="mr-3 bg-white rounded-2xl p-2 border border-gray-200"
              style={{ width: CARD_WIDTH }}
            >
              {/* image */}
              <View className="relative">
                <Pressable onPress={() => router.push(`/product/${item._id}`)}>
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-[110px] rounded-2xl overflow-hidden object-cover object-center bg-gray-100"
                    resizeMode="contain"
                  />
                </Pressable>

                {/* ❤️ wishlist */}
                <Pressable
                  onPress={() =>
                    toggleWishlist({
                      _id: item._id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      unit: item.unit,
                    })
                  }
                  className="absolute top-2 right-2 bg-white rounded-full p-1"
                >
                  <Ionicons
                    name={wished ? "heart" : "heart-outline"}
                    size={16}
                    color={wished ? "#ef4444" : "#374151"}
                  />
                </Pressable>

                {/* add / qty pill */}
                {(item.stockQuantity ?? 1) <= 0 ? (
                  <View className="absolute bottom-2 right-2 bg-gray-400 px-3 py-1 rounded-lg">
                    <Text className="text-white text-xs font-bold">Out</Text>
                  </View>
                ) : qty === 0 ? (
                  <Pressable
                    onPress={() => handleAddToCart(item)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                    className="absolute bottom-2 right-2 bg-white border border-pink-600 px-4 py-1.5 rounded-lg shadow-sm"
                  >
                    <Text className="text-pink-600 text-xs font-bold">ADD</Text>
                  </Pressable>
                ) : (
                  <View className="absolute bottom-2 right-2 flex-row items-center bg-pink-600 rounded-xl overflow-hidden shadow-md">
                    <Pressable
                      onPress={() => handleDecrease(item)}
                      style={({ pressed }) => [
                        { opacity: pressed ? 0.8 : 1 },
                        { paddingHorizontal: 10, paddingVertical: 6 },
                      ]}
                      hitSlop={8}
                    >
                      <Ionicons name="remove" size={16} color="#fff" />
                    </Pressable>

                    <TextInput
                      value={
                        editingQtyId === item._id ? editingQtyVal : String(qty)
                      }
                      onChangeText={(t) => {
                        const v = t.replace(/\D/g, "").slice(0, 4);
                        editingQtyValRef.current = v;
                        setEditingQtyVal(v);
                      }}
                      onFocus={() => handleQtyFocus(item)}
                      onBlur={() => handleQtyBlur(item)}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      className="text-white text-sm font-bold text-center min-w-[36px] py-1 px-0"
                      maxLength={4}
                    />

                    <Pressable
                      onPress={() => handleIncrease(item)}
                      disabled={qty >= (item.stockQuantity ?? 9999)}
                      style={({ pressed }) => [
                        {
                          opacity:
                            qty >= (item.stockQuantity ?? 9999)
                              ? 0.5
                              : pressed
                                ? 0.8
                                : 1,
                        },
                        { paddingHorizontal: 10, paddingVertical: 6 },
                      ]}
                      hitSlop={8}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>

              <Text className="text-green-700 font-bold text-sm mt-2">
                ₹{item.price}
                {item.packing ? (
                  <Text className="text-gray-500 font-normal text-xs">
                    {" "}
                    / {item.packing}
                  </Text>
                ) : null}
              </Text>

              <Text
                numberOfLines={1}
                className="text-sm font-semibold overflow-hidden text-black mt-1"
              >
                {item.name}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#f8faf8]" style={{ paddingTop: insets.top }}>
      {/* Header logo */}
      <View className="px-4 pt-2 pb-2 bg-white">
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 140, height: 28 }}
          resizeMode="contain"
        />
      </View>
      {/* Search - tap to open dedicated search screen */}
      <Pressable
        onPress={() => router.push("/search")}
        className="px-4 py-3 bg-white"
      >
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6b7280" />
          <Text className="flex-1 ml-3 text-base text-gray-500">
            Search medicines, health products...
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#6b7280"
            style={{ marginLeft: 8 }}
          />
        </View>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isAuthenticated && user && <KycBanner kyc={user.kyc} />}
        {loadingHome ? (
          <>
            <View className="mt-4 mx-4">
              <SkeletonBanner />
            </View>
            <View className="flex-row items-center justify-between px-4 pt-6 pb-2">
              <Text className="text-lg font-bold text-black">Categories</Text>
            </View>
            <SkeletonCategoryGrid count={8} />
            <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
              <Text className="text-lg font-bold text-black">Brands</Text>
            </View>
            <SkeletonBrandGrid count={8} />
            <View className="mb-4">
              <Text className="text-lg font-bold text-black mb-3 px-4">Best selling medicine</Text>
              <SkeletonProductRow count={4} />
            </View>
            <View className="mb-4">
              <Text className="text-lg font-bold text-black mb-3 px-4">New added medicine</Text>
              <SkeletonProductRow count={4} />
            </View>
            <View style={{ height: insets.bottom + 24 }} />
          </>
        ) : (
          <>
        {/* Banner slider - auto slide every 2 sec */}
        <View className="mt-4 mx-5 rounded-2xl overflow-hidden">
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / BANNER_WIDTH,
              );
              setBannerIndex(idx);
            }}
            style={{ width: BANNER_WIDTH }}
          >
            {BANNER_IMAGES.map((img, idx) => (
              <ImageBackground
                key={idx}
                source={img}
                resizeMode="cover"
                style={{ width: BANNER_WIDTH, height: 120 }}
                className="items-center justify-center"
              >
                <View className="flex-1 w-full px-5 py-4 flex-row items-center justify-end">
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </View>
              </ImageBackground>
            ))}
          </ScrollView>
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-2">
            {BANNER_IMAGES.map((_, idx) => (
              <View
                key={idx}
                className={`rounded-full ${bannerIndex === idx ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/50"}`}
              />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text className="text-lg font-bold text-black">Categories</Text>
          <Pressable
            onPress={() => router.push("/all-categories")}
            className="flex-row items-center gap-2 border-2 border-teal-600 rounded-full px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-bold text-teal-700">View All</Text>
            <View className="w-6 h-6 rounded-full bg-teal-600 items-center justify-center">
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap justify-between px-4 mb-6">
          {categories.map((item) => (
            <Pressable
              key={item._id}
              className="w-[22%] items-center mb-4"
              onPress={() =>
                router.push({
                  pathname: "/category/[name]",
                  params: { name: item.name },
                })
              }
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-16 h-16 rounded-full mb-2"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-2">
                  <Ionicons name={item.icon} size={28} color="#0d9488" />
                </View>
              )}
              <Text
                numberOfLines={1}
                className="text-xs font-medium text-gray-700"
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Brands */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text className="text-lg font-bold text-black">Brands</Text>
          <Pressable
            onPress={() => router.push("/all-brands")}
            className="flex-row justify-center align-center items-center gap-2 border-2 border-teal-600 rounded-full px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-bold text-teal-700">View All</Text>
            <View className="w-6 h-6 rounded-full bg-teal-600 items-center justify-center">
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap justify-between px-4 mb-6">
          {brands
            .filter((b) => b.isActive)
            .map((item) => (
              <Pressable
                key={item._id}
                className="w-[22%] items-center mb-4"
                onPress={() =>
                  router.push({
                    pathname: "/brand/[name]",
                    params: { name: item.name },
                  })
                }
              >
                {item.logo ? (
                  <Image
                    source={{ uri: item.logo }}
                    className="w-16 h-16 rounded-full mb-2"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-2">
                    <Ionicons
                      name="pricetag-outline"
                      size={28}
                      color="#d97706"
                    />
                  </View>
                )}
                <Text
                  numberOfLines={1}
                  className="text-xs font-medium text-gray-700"
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
        </View>

        {products.length === 0 ? (
          <View className="py-10 items-center">
            <Ionicons name="leaf-outline" size={48} color="#d1d5db" />
            <Text className="mt-2 text-base font-semibold text-gray-500">
              No products found
            </Text>
          </View>
        ) : (
          <>
            {renderSlider("Best selling medicine", bestSelling)}
            {renderSlider("New added medicine", newArrivals)}
            {renderSlider("Health essentials", healthEssentials)}
          </>
        )}

        <View style={{ height: insets.bottom + 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
