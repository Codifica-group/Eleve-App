import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function Header({ nomeUsuario, onSettingsPress }) {
  const primeiroNome = nomeUsuario.trim().split(" ")[0];

  return (
    <View style={styles.header}>
      <Text style={styles.saudacao}>
        Oi, {primeiroNome}! <Text style={styles.emoji}>😊</Text>
      </Text>
      <TouchableOpacity activeOpacity={0.7} onPress={onSettingsPress}>
        <Image
          source={require("../../../assets/logo_configuracao.png")}
          style={styles.iconConfig}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  saudacao: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  emoji: {
    fontSize: 24,
  },
  iconConfig: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
});
