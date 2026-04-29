import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, FONTS, SPACING } from "../constants/theme";
import { montarUrlBackend } from "../api/compartilhado/proxyBackend";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import AgendaCard from "../components/agenda/AgendaCard";

export default function AgendaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Atualiza a lista sempre que a tela ganha foco
    const unsubscribe = navigation.addListener("focus", () => {
      carregarAgenda();
    });
    return unsubscribe;
  }, [navigation]);

  async function carregarAgenda() {
    setLoading(true);
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const token = await AsyncStorage.getItem("@eleve:token_acesso");
      
      // Monta a URL dinamicamente caso precise, usando o clienteId (ou fallback para 1)
      const url = montarUrlBackend(`solicitacoes-agenda/chat/${clienteId || 1}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar solicitações da agenda.");
      }

      const dados = await response.json();
      setAgendamentos(dados || []);
    } catch (error) {
      console.error("Falha ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Agenda</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : agendamentos.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioTexto}>
              Não há nenhuma solicitação de agendamento no momento.
            </Text>
          </View>
        ) : (
          agendamentos.map((item, index) => (
            <AgendaCard 
              key={item.id || index} 
              item={item} 
              onPress={() => {
                // Futura navegação para detalhes, caso queira implementar
              }} 
            />
          ))
        )}
      </ScrollView>

      {/* Botão Novo Agendamento flutuante/fixo acima do menu */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.botaoNovo}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("NovoAgendamentoTab")}
        >
          <Text style={styles.botaoNovoTexto}>+ Novo Agendamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titulo: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  vazioContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  vazioTexto: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  botaoNovo: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  botaoNovoTexto: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});