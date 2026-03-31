import React from "react";
import { StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../constants/theme";

export default function SafeScreen({
  children,
  style,
  statusBarStyle = "light",
  backgroundColor = COLORS.primary,
  avoidKeyboard = false,
}) {
  const content = (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
