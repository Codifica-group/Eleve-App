import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

function getDiaSemana(ano, mes, dia) {
  const date = new Date(ano, mes, dia);
  return date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

export default function AgendaCard({ item, onPress }) {
  const dataAtendimento = new Date(item.dataHoraInicio);
  const anoAtendimento = dataAtendimento.getFullYear();
  const mesAtendimento = dataAtendimento.getMonth();
  const diaAtendimento = dataAtendimento.getDate();
  const horaAtendimento = dataAtendimento.getHours();
  const minutoAtendimento = dataAtendimento.getMinutes();

  const diaSemana = getDiaSemana(anoAtendimento, mesAtendimento, diaAtendimento);

  let stringHorario = `${String(horaAtendimento).padStart(2, "0")}:${String(minutoAtendimento).padStart(2, "0")}`;
  if (item.dataHoraFim) {
    const dataFim = new Date(item.dataHoraFim);
    stringHorario += ` - ${String(dataFim.getHours()).padStart(2, "0")}:${String(dataFim.getMinutes()).padStart(2, "0")}`;
  }

  let corCard = COLORS.accent;
  let corDia = COLORS.primary;
  let statusTexto = "Aguardando";

  switch (item.status) {
    case "RECUSADO_PELO_PETSHOP":
      corCard = "#E57373";
      corDia = "#C62828";
      statusTexto = "Recusado pelo Petshop";
      break;
    case "RECUSADO_PELO_CLIENTE":
      corCard = "#E57373";
      corDia = "#C62828";
      statusTexto = "Recusado";
      break;
    case "ACEITO_PELO_PETSHOP":
      corCard = "#FFE082";
      corDia = "#FFB300";
      statusTexto = "Aceito pelo Petshop";
      break;
    case "CONFIRMADO":
      corCard = "#81C784";
      corDia = "#388E3C";
      statusTexto = "Confirmado";
      break;
    case "AGUARDANDO_RESPOSTA_PETSHOP":
      statusTexto = "Aguardando Resposta";
      break;
    default:
      statusTexto = item.status || "Status Desconhecido";
      break;
  }

  const nomesServicos = item.servicos ? item.servicos.map((s) => s.nome).join(" e ") : "Serviço";

  const exibirValor = item.valorTotal && item.valorTotal > 0.00 ? true : false;


  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: corCard }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.cardDia, { backgroundColor: corDia }]}>
        <Text style={styles.cardDiaSemana}>{diaSemana}</Text>
        <Text style={styles.cardDiaNumero}>
          {String(diaAtendimento).padStart(2, "0")}
        </Text>
        <Text style={styles.cardHorario}>{stringHorario}</Text>
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardServico} numberOfLines={1}>
          {item.pet?.nome || "Pet não informado"} - {nomesServicos}
        </Text>
        
        {exibirValor && (
          <Text style={styles.cardValor}>
            R$ {item.valorTotal.toFixed(2).replace(".", ",")}
          </Text>
        )}
        
        <View style={styles.statusContainer}>
          <Text style={[styles.statusBadge, { color: corDia }]}>
            {statusTexto}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardDia: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
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
  cardHorario: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginTop: 4,
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
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
  },
});