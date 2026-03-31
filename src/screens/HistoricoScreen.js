import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING } from "../constants/theme";

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

// Dados mockados de histórico por mês (chave: "YYYY-MM")
const HISTORICO_MOCK = {
  "2026-01": [
    { dia: 3, servico: "Banho e Hidratação", valor: "R$ 100,00" },
    { dia: 11, servico: "Banho e Tosa", valor: "R$ 150,00" },
    { dia: 18, servico: "Banho", valor: "R$ 80,00" },
    { dia: 25, servico: "Banho e Tosa", valor: "R$ 150,00" },
  ],
  "2026-02": [
    { dia: 5, servico: "Banho", valor: "R$ 80,00" },
    { dia: 14, servico: "Tosa", valor: "R$ 70,00" },
    { dia: 22, servico: "Banho e Hidratação", valor: "R$ 100,00" },
  ],
  "2026-03": [
    { dia: 2, servico: "Banho e Tosa", valor: "R$ 150,00" },
    { dia: 10, servico: "Hidratação", valor: "R$ 60,00" },
    { dia: 17, servico: "Banho", valor: "R$ 80,00" },
    { dia: 24, servico: "Banho e Tosa", valor: "R$ 150,00" },
    { dia: 30, servico: "Banho e Hidratação", valor: "R$ 100,00" },
  ],
};

function formatMesKey(ano, mes) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export default function HistoricoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const hoje = new Date();

  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [modalVisivel, setModalVisivel] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const chave = formatMesKey(anoAtual, mesAtual);
  const atendimentos = HISTORICO_MOCK[chave] || [];

  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
  }

  function mesSeguinte() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
  }

  function abrirDetalhe(item) {
    setDiaSelecionado(item);
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

      {/* Seletor de mês */}
      <View style={styles.mesSelector}>
        <TouchableOpacity onPress={mesAnterior} hitSlop={12}>
          <Text style={styles.seta}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.mesTexto}>
          {getNomeMes(mesAtual)} - {anoAtual}
        </Text>
        <TouchableOpacity onPress={mesSeguinte} hitSlop={12}>
          <Text style={styles.seta}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de atendimentos */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {atendimentos.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioTexto}>
              Nenhum atendimento neste mês.
            </Text>
          </View>
        ) : (
          atendimentos.map((item, index) => {
            const diaSemana = getDiaSemana(anoAtual, mesAtual, item.dia);
            const dataAtendimento = new Date(anoAtual, mesAtual, item.dia);
            const diffMs = dataAtendimento - hoje;
            const diffMeses =
              (hoje.getFullYear() - anoAtual) * 12 +
              (hoje.getMonth() - mesAtual);

            // Verde = futuro, Vermelho = 2+ meses atrás, padrão = accent/primary
            let corCard = COLORS.accent;
            let corDia = COLORS.primary;
            if (dataAtendimento > hoje) {
              corCard = "#4CAF50";
              corDia = "#388E3C";
            } else if (diffMeses >= 2 || (diffMeses === 1 && hoje.getDate() >= item.dia)) {
              corCard = "#E57373";
              corDia = "#C62828";
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.card, { backgroundColor: corCard }]}
                activeOpacity={0.8}
                onPress={() => abrirDetalhe(item)}
              >
                <View style={[styles.cardDia, { backgroundColor: corDia }]}>
                  <Text style={styles.cardDiaSemana}>{diaSemana}</Text>
                  <Text style={styles.cardDiaNumero}>
                    {String(item.dia).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardServico}>{item.servico}</Text>
                  <Text style={styles.cardValor}>{item.valor}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de detalhe */}
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
            {diaSelecionado && (
              <>
                <Text style={styles.modalTitulo}>Detalhes do Atendimento</Text>
                <View style={styles.modalDivisor} />
                <Text style={styles.modalLabel}>Data</Text>
                <Text style={styles.modalValor}>
                  {String(diaSelecionado.dia).padStart(2, "0")} de{" "}
                  {getNomeMes(mesAtual)} de {anoAtual}
                </Text>
                <Text style={styles.modalLabel}>Serviço</Text>
                <Text style={styles.modalValor}>
                  {diaSelecionado.servico}
                </Text>
                <Text style={styles.modalLabel}>Valor</Text>
                <Text style={styles.modalValor}>
                  {diaSelecionado.valor}
                </Text>
                <TouchableOpacity
                  style={styles.modalBotao}
                  onPress={() => setModalVisivel(false)}
                >
                  <Text style={styles.modalBotaoTexto}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
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
  mesSelector: {
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
  mesTexto: {
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
  // Modal
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
