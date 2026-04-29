import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, FONTS, SPACING } from "../constants/theme";
import { montarUrlBackend } from "../api/compartilhado/proxyBackend";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import AgendaCard from "../components/agenda/AgendaCard";
import ModalDetalhesAtendimento from "../components/agenda/ModalDetalhesAtendimento";

export default function AgendaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  useEffect(() => {
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

  function abrirDetalhe(item) {
    setAtendimentoSelecionado(item);
    setModalVisivel(true);
  }

  async function atualizarStatusAgendamento(novoStatus) {
    if (!atendimentoSelecionado) return;
    
    setProcessandoAcao(true);
    try {
      const token = await AsyncStorage.getItem("@eleve:token_acesso");
      const url = montarUrlBackend(`solicitacoes-agenda/${atendimentoSelecionado.id}`);

      const payload = {
        chatId: atendimentoSelecionado.chatId,
        petId: atendimentoSelecionado.pet?.id,
        servicos: atendimentoSelecionado.servicos?.map(s => ({ id: s.id, valor: s.valor || 0.0 })) || [],
        valorDeslocamento: atendimentoSelecionado.valorDeslocamento || 0.0,
        dataHoraInicio: atendimentoSelecionado.dataHoraInicio,
        dataHoraFim: atendimentoSelecionado.dataHoraFim || "",
        dataHoraSolicitacao: atendimentoSelecionado.dataHoraSolicitacao || "",
        status: novoStatus
      };

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar para o status: ${novoStatus}`);
      }

      setModalVisivel(false);
      carregarAgenda();
    } catch (error) {
      console.error("Falha ao atualizar status da agenda:", error);
      Alert.alert("Erro", "Não foi possível alterar o status do agendamento.");
    } finally {
      setProcessandoAcao(false);
    }
  }

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Agendamento</Text>
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
              onPress={() => abrirDetalhe(item)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal Reutilizável de Detalhes */}
      <ModalDetalhesAtendimento
        visible={modalVisivel}
        atendimento={atendimentoSelecionado}
        permiteAcoes={true}
        processando={processandoAcao}
        onClose={() => setModalVisivel(false)}
        onAceitar={() => atualizarStatusAgendamento("CONFIRMADO")}
        onRecusar={() => atualizarStatusAgendamento("RECUSADO_PELO_CLIENTE")}
      />

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