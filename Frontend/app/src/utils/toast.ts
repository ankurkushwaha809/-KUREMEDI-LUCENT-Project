import Toast from "react-native-toast-message";

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "success",
  title?: string
) {
  Toast.show({
    type,
    text1: title ?? (type === "error" ? "Error" : type === "info" ? "Info" : "Success"),
    text2: message,
    visibilityTime: 3000,
  });
}
