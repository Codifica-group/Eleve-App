import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants/theme";

export default function Input({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  keyboardType,
  secureTextEntry,
  erro,
  tocado,
  autoCapitalize = "none",
}) {
  const exibirErro = tocado && erro;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, exibirErro && styles.inputErro]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType || "default"}
        secureTextEntry={secureTextEntry || false}
        autoCapitalize={autoCapitalize}
      />
      {exibirErro && (
        <View style={styles.erroRow}>
          <FontAwesome name="exclamation-circle" size={12} color={COLORS.warning} />
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.labelColor,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  inputErro: {
    borderColor: COLORS.warning,
    backgroundColor: "rgba(255,224,102,0.15)",
  },
  erroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  erroTexto: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.warning,
  },
});
