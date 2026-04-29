import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, FONTS, SPACING } from "../constants/theme";
import { montarUrlBackend } from "../api/compartilhado/proxyBackend";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";

function getNomeMes(mes) {
  const date = new Date(2026, mes, 1);
  const nome = date.toLocaleDateString("pt-BR", { month: "long" });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function getDiaSemana(ano, mes, dia) {
  const date = new Date(ano, mes, dia);
  return date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

function formatarDataIsoString(data) {
  return data.toISOString().split("T")[0];
}

export default function HistoricoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const hoje = new Date();

  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modal
  const [modalVisivel, setModalVisivel] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);

  useEffect(() => {
    carregarAgendas();
  }, [paginaAtual]);

  async function carregarAgendas() {
    setLoading(true);
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const token = await AsyncStorage.getItem('@eleve:token_acesso');

      const dataInicio = new Date(hoje);
      dataInicio.setFullYear(hoje.getFullYear() - 1);
      
      const dataFim = new Date(hoje);
      dataFim.setFullYear(hoje.getFullYear() + 1);

      const url = montarUrlBackend(`agendas/filtrar?offset=${paginaAtual}&size=10`);
      
      const payload = {
        dataInicio: formatarDataIsoString(dataInicio),
        dataFim: formatarDataIsoString(dataFim),
        clienteId: clienteId,
        petId: null,
        racaId: null,
        servicoId: []
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar histórico.");
      }

      const json = await response.json();
      setAtendimentos(json.dados || []);
      setTotalPaginas(json.totalPaginas > 0 ? json.totalPaginas : 1);

    } catch (error) {
      console.error("Falha ao carregar agendas:", error);
    } finally {
      setLoading(false);
    }
  }

  function paginaAnterior() {
    if (paginaAtual > 0) {
      setPaginaAtual((p) => p - 1);
    }
  }

  function paginaSeguinte() {
    if (paginaAtual < totalPaginas - 1) {
      setPaginaAtual((p) => p + 1);
    }
  }

  function abrirDetalhe(item) {
    setAtendimentoSelecionado(item);
    setModalVisivel(true);
  }

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Histórico</Text>
        <FontAwesome name="gear" size={26} color={COLORS.primaryMedium} />
      </View>

      <View style={styles.paginacaoContainer}>
        <TouchableOpacity onPress={paginaAnterior} hitSlop={12} disabled={paginaAtual === 0 || loading}>
          <Text style={[styles.seta, (paginaAtual === 0 || loading) && styles.setaDesabilitada]}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.paginacaoTexto}>
          Página {paginaAtual + 1} de {totalPaginas}
        </Text>
        <TouchableOpacity onPress={paginaSeguinte} hitSlop={12} disabled={paginaAtual >= totalPaginas - 1 || loading}>
          <Text style={[styles.seta, (paginaAtual >= totalPaginas - 1 || loading) && styles.setaDesabilitada]}>
            {">"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : atendimentos.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioTexto}>
              Nenhum atendimento encontrado.
            </Text>
          </View>
        ) : (
          atendimentos.map((item, index) => {
            const dataAtendimento = new Date(item.dataHoraInicio);
            const anoAtendimento = dataAtendimento.getFullYear();
            const mesAtendimento = dataAtendimento.getMonth();
            const diaAtendimento = dataAtendimento.getDate();
            const horaAtendimento = dataAtendimento.getHours();
            const minutoAtendimento = dataAtendimento.getMinutes();

            const dataFimAtendimento = new Date(item.dataHoraFim);
            const horaFimAtendimento = dataFimAtendimento.getHours();
            const minutoFimAtendimento = dataFimAtendimento.getMinutes();
            
            const diaSemana = getDiaSemana(anoAtendimento, mesAtendimento, diaAtendimento);
            
            const diffMeses =
              (hoje.getFullYear() - anoAtendimento) * 12 +
              (hoje.getMonth() - mesAtendimento);

            // Verde = futuro, Vermelho = 2+ meses atrás, padrão = accent/primary
            let corCard = COLORS.accent;
            let corDia = COLORS.primary;
            if (dataAtendimento > hoje) {
              corCard = "#4CAF50";
              corDia = "#388E3C";
            } else if (diffMeses >= 2 || (diffMeses === 1 && hoje.getDate() >= diaAtendimento)) {
              corCard = "#E57373";
              corDia = "#C62828";
            }

            const nomesServicos = item.servicos ? item.servicos.map(s => s.nome).join(" e ") : "Serviço";

            return (
              <TouchableOpacity
                key={item.id || index}
                style={[styles.card, { backgroundColor: corCard }]}
                activeOpacity={0.8}
                onPress={() => abrirDetalhe(item)}
              >
                <View style={[styles.cardDia, { backgroundColor: corDia }]}>
                  <Text style={styles.cardDiaSemana}>{diaSemana}</Text>
                  <Text style={styles.cardDiaNumero}>
                    {String(diaAtendimento).padStart(2, "0")}
                  </Text>
                  <Text style={styles.cardValor}>{String(horaAtendimento).padStart(2, "0")}:{String(minutoAtendimento).padStart(2, "0")} - {String(horaFimAtendimento).padStart(2, "0")}:{String(minutoFimAtendimento).padStart(2, "0")}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardServico} numberOfLines={1}>
                    {item.pet?.nome || "Pet não informado"} - {nomesServicos}
                  </Text>
                  <Text style={styles.cardValor}>
                    R$ {item.valorTotal.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisivel(false)}
        >
          <View style={styles.modalContent}>
            {atendimentoSelecionado && (() => {
              const dataModal = new Date(atendimentoSelecionado.dataHoraInicio);
              const dataFimModal = new Date(atendimentoSelecionado.dataHoraFim);
              const nomesServicosModal = atendimentoSelecionado.servicos 
                ? atendimentoSelecionado.servicos.map(s => s.nome).join(", ") 
                : "Não informado";
                
              return (
                <>
                  <Text style={styles.modalTitulo}>Detalhes do Atendimento</Text>
                  <View style={styles.modalDivisor} />
                  
                  <Text style={styles.modalLabel}>Data e Hora</Text>
                  <Text style={styles.modalValor}>
                    {String(dataModal.getDate()).padStart(2, "0")} de{" "}
                    {getNomeMes(dataModal.getMonth())} de {dataModal.getFullYear()} às {String(dataModal.getHours()).padStart(2, "0")}:{String(dataModal.getMinutes()).padStart(2, "0")} - {String(dataFimModal.getHours()).padStart(2, "0")}:{String(dataFimModal.getMinutes()).padStart(2, "0")}
                  </Text>
                  
                  <Text style={styles.modalLabel}>Pet</Text>
                  <Text style={styles.modalValor}>
                    {atendimentoSelecionado.pet?.nome || "Não informado"}
                  </Text>
                  
                  <Text style={styles.modalLabel}>Serviços</Text>
                  <Text style={styles.modalValor}>
                    {nomesServicosModal}
                  </Text>
                  
                  <Text style={styles.modalLabel}>Valor Total</Text>
                  <Text style={styles.modalValor}>
                    R$ {atendimentoSelecionado.valorTotal.toFixed(2).replace('.', ',')}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.modalBotao}
                    onPress={() => setModalVisivel(false)}
                  >
                    <Text style={styles.modalBotaoTexto}>Fechar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  paginacaoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 10,
  },
  seta: {
    fontSize: 22,
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
    paddingHorizontal: 8,
  },
  setaDesabilitada: {
    color: COLORS.gray,
    opacity: 0.5,
  },
  paginacaoTexto: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.dark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: SPACING.xl,
  },
  vazioContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  vazioTexto: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardDia: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  cardDiaSemana: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 4,
  },
  cardDiaNumero: {
    fontSize: 36,
    fontFamily: FONTS.extraBold,
    color: COLORS.white,
  },
  cardInfo: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardServico: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  cardValor: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    width: "82%",
  },
  modalTitulo: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    textAlign: "center",
    marginBottom: 12,
  },
  modalDivisor: {
    height: 1,
    backgroundColor: COLORS.background,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 10,
  },
  modalValor: {
    fontSize: 17,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    marginTop: 2,
  },
  modalBotao: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
  },
  modalBotaoTexto: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});