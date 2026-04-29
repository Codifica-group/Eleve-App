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
import AgendaCard from "../components/agenda/AgendaCard";

import { montarUrlBackend } from "../api/compartilhado/proxyBackend";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";

import { SERVICOS, MENSAGENS, PROMOS } from "../constants/data";
import { COLORS, FONTS, SPACING } from "../constants/theme";

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const insets = useSafeAreaInsets();

  const [nomeUsuario, setNomeUsuario] = useState(params.nomeUsuario || "Usuário");
  const [mensagem] = useState(
    () => MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]
  );
  
  const [proximoAgendamento, setProximoAgendamento] = useState(null);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      carregarAgendaHomeScreen();
    });
    return unsubscribe;
  }, [navigation]);

  async function carregarAgendaHomeScreen() {
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const token = await AsyncStorage.getItem("@eleve:token_acesso");
      
      const url = montarUrlBackend(`solicitacoes-agenda/chat/${clienteId || 1}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar solicitações da agenda na Home.");
      }

      const dados = await response.json();

      if (dados && dados.length > 0) {
        const agora = new Date();

        const agendamentosFuturos = dados.filter(item => new Date(item.dataHoraInicio) > agora);

        const prioridades = {
          "AGUARDANDO_RESPOSTA_PETSHOP": 3,
          "ACEITO_PELO_PETSHOP": 2,
          "CONFIRMADO": 1
        };

        const agendamentosRelevantes = agendamentosFuturos.filter(item => prioridades[item.status]);

        if (agendamentosRelevantes.length > 0) {
          agendamentosRelevantes.sort((a, b) => {
            if (prioridades[a.status] !== prioridades[b.status]) {
              return prioridades[a.status] - prioridades[b.status];
            }
            return new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio);
          });

          setProximoAgendamento(agendamentosRelevantes[0]);
        } else {
          setProximoAgendamento(null);
        }
      } else {
        setProximoAgendamento(null);
      }
    } catch (error) {
      console.error("Falha ao carregar agenda na HomeScreen:", error);
      setProximoAgendamento(null);
    }
  }
  
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

        <AIBar />

        {/* Renderização Condicional: AgendaCard se houver prioridade, senão MessageCard */}
        {proximoAgendamento ? (
          <AgendaCard 
            item={proximoAgendamento} 
            onPress={() => navigation.navigate("AgendaTab")}
          />
        ) : (
          <MessageCard mensagem={mensagem} />
        )}

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