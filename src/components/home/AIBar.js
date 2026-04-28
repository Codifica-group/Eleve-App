import React from "react";
import { View, TextInput, StyleSheet, Text, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants/theme";

export default function AIBar({ value, onChangeText }) {
  return (
    <Pressable style={styles.container}>
      <Text style={styles.input}>
        Pergunte a nossa IA
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    padding: 0,
  },
});
