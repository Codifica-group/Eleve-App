import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importação do AsyncStorage
import { COLORS, FONTS } from "../../constants/theme";

export default function Header({ nomeUsuario }) {
  const { t, i18n } = useTranslation();
  const primeiroNome = nomeUsuario.trim().split(" ")[0];

  const alternarIdioma = async () => {
    try {
      const proximoIdioma = i18n.language === "pt" ? "es" : "pt";
      
      await i18n.changeLanguage(proximoIdioma);
      
      await AsyncStorage.setItem("@eleve:idioma", proximoIdioma);
    } catch (error) {
      console.error("Erro ao salvar o idioma no AsyncStorage:", error);
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.saudacao}>
        {t("home.greeting", { name: primeiroNome })} <Text style={styles.emoji}>😊</Text>
      </Text>
      <TouchableOpacity activeOpacity={0.7} onPress={alternarIdioma}>
        <Image
          source={require("../../../assets/traducao.png")}
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
