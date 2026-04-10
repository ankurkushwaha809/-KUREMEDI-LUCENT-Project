import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppErrorBoundary } from "@/src/components/AppErrorBoundary";
import { CartProvider } from "@/src/context/CartContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { WishlistProvider } from "@/src/context/WishlistContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="login"
                      options={{
                        title: "Login",
                        presentation: "card",
                      }}
                    />
                    <Stack.Screen
                      name="signup"
                      options={{
                        title: "Signup",
                        presentation: "card",
                      }}
                    />
                    <Stack.Screen
                      name="kyc"
                      options={{ title: "KYC", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="orders"
                      options={{ title: "Orders", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="profile-edit"
                      options={{ title: "Edit Profile", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="refer-earn"
                      options={{ title: "Refer & Earn", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="wallet"
                      options={{ title: "Wallet", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="search"
                      options={{ title: "Search", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="all-categories"
                      options={{ title: "All Categories", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="all-brands"
                      options={{ title: "All Brands", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="checkout"
                      options={{ title: "Checkout", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal", title: "Modal" }}
                    />
                    <Stack.Screen
                      name="privacy-policy"
                      options={{ title: "Privacy Policy", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="terms-and-conditions"
                      options={{ title: "Terms & Conditions", presentation: "card" }}
                    />
                    <Stack.Screen
                      name="faq"
                      options={{ title: "FAQ", presentation: "card" }}
                    />
                  </Stack>
                  <Toast />
                  <StatusBar style="auto" />
                </>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
