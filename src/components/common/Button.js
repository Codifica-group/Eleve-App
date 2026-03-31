import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  style,
}) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 40,
    gap: 8,
  },
  primary: {
    backgroundColor: COLORS.white,
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  text: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  primaryText: {
    color: COLORS.primaryMedium,
  },
  secondaryText: {
    color: COLORS.white,
  },
});
