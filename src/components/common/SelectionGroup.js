import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function SelectionGroup({ label, opcoes, valor, onChange }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.opcoesBotoes}>
        {opcoes.map((op) => (
          <TouchableOpacity
            key={op}
            style={[styles.opcaoBotao, valor === op && styles.opcaoBotaoAtivo]}
            onPress={() => onChange(op)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.opcaoBotaoTexto,
                valor === op && styles.opcaoBotaoTextoAtivo,
              ]}
            >
              {op}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  opcoesBotoes: {
    flexDirection: "row",
    gap: 10,
  },
  opcaoBotao: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  opcaoBotaoAtivo: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  opcaoBotaoTexto: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  opcaoBotaoTextoAtivo: {
    color: COLORS.primaryMedium,
  },
});
