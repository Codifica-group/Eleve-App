import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  style,
  desabilitado = false,
  carregando = false,
}) {
  const isPrimary = variant === "primary";
  const bloqueado = desabilitado || carregando;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        bloqueado && styles.desabilitado,
        style,
      ]}
      onPress={bloqueado ? undefined : onPress}
      activeOpacity={bloqueado ? 1 : 0.8}
    >
      {carregando ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? COLORS.primaryMedium : COLORS.white}
        />
      ) : (
        icon
      )}
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
  desabilitado: {
    opacity: 0.65,
  },
});
