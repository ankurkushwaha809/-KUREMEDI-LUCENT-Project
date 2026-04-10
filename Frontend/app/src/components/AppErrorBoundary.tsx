import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Unexpected startup error";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("AppErrorBoundary caught error:", error, info?.componentStack);
  }

  private retry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
          backgroundColor: "#f8fafc",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 10 }}>
          App crashed on startup
        </Text>
        <Text style={{ fontSize: 14, color: "#475569", textAlign: "center", marginBottom: 18 }}>
          {this.state.message || "A runtime error occurred. Tap retry to restart the app."}
        </Text>
        <Pressable
          onPress={this.retry}
          style={{
            backgroundColor: "#0f172a",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "600" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }
}