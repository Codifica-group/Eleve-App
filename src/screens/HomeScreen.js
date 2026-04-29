import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Header from "../components/home/Header";
import ServiceCard from "../components/home/ServiceCard";
import AIBar from "../components/home/AIBar";
import MessageCard from "../components/home/MessageCard";
import PromoCarousel from "../components/home/PromoCarousel";

import { SERVICOS, MENSAGENS, PROMOS } from "../constants/data";
import { COLORS, FONTS, SPACING } from "../constants/theme";

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const insets = useSafeAreaInsets();

  const [nomeUsuario, setNomeUsuario] = useState(params.nomeUsuario || "Usuário");
  const [mensagem] = useState(
    () => MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
  );

  useEffect(() => {
    async function carregarNomeUsuario() {
      const nome = await AsyncStorage.getItem("@eleve:nome_usuario");
      if (nome) {
        setNomeUsuario(nome);
      }
    }
    if (!params.nomeUsuario) {
      carregarNomeUsuario();
    }
  }, [params.nomeUsuario]);
  
  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header nomeUsuario={nomeUsuario} onSettingsPress={() => {}} />

        <Text style={styles.pergunta}>
          Do que seu pet precisa hoje?
        </Text>

        {/* Serviços */}
        <View style={styles.servicosRow}>
          {SERVICOS.map((s) => (
            <ServiceCard 
              key={s.key} 
              servico={s} 
              onPress={(id) => navigation.navigate("NovoAgendamentoTab", { servicoInicial: id })}
            />
          ))}
        </View>

        {/* Instanciamento limpo do AIBar */}
        <AIBar />

        <MessageCard mensagem={mensagem} />

        <PromoCarousel data={PROMOS} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  pergunta: {
    fontSize: 17,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    marginTop: 10,
    marginBottom: 20,
  },
  servicosRow: {
    flexDirection: "row",
    marginBottom: 20,
    marginHorizontal: -5,
  },
});