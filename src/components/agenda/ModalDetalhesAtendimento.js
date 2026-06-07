import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { useTranslation } from "react-i18next";

function getNomeMes(mes, locale) {
  const date = new Date(2026, mes, 1);
  const nome = date.toLocaleDateString(locale, { month: "long" });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export default function ModalDetalhesAtendimento({
  visible,
  onClose,
  atendimento,
  permiteAcoes = false,
  onAceitar,
  onRecusar,
  processando = false
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'es' ? 'es-ES' : 'pt-BR';
  if (!atendimento) return null;

  const dataModal = new Date(atendimento.dataHoraInicio);
  const dataFimModal = atendimento.dataHoraFim ? new Date(atendimento.dataHoraFim) : null;
  const nomesServicosModal = atendimento.servicos
    ? atendimento.servicos.map((s) => {
        const chave = s.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return t(`data.services.${chave}`, s.nome);
      }).join(", ")
    : t("agenda.modal.notInformed", "Não informado");

    let statusTexto = t("agenda.status.waitingReply", "Aguardando");
  switch (atendimento.status) {
    case "RECUSADO_PELO_PETSHOP":
      statusTexto = t("agenda.status.refusedByPetshop", "Recusado pelo Petshop");
      break;
    case "RECUSADO_PELO_CLIENTE":
      statusTexto = t("agenda.status.refused", "Recusado");
      break;
    case "ACEITO_PELO_PETSHOP":
      statusTexto = t("agenda.status.acceptedByPetshop", "Aceito pelo Petshop");
      break;
    case "CONFIRMADO":
      statusTexto = t("agenda.status.confirmed", "Confirmado");
      break;
    case "AGUARDANDO_RESPOSTA_PETSHOP":
      statusTexto = t("agenda.status.waitingReply", "Aguardando Resposta");
      break;
    default:
      statusTexto = atendimento.status || t("agenda.status.unknown", "Status Desconhecido");
      break;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={styles.modalContent} 
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.modalTitulo}>{t("agenda.modal.title", "Detalhes do Agendamento")}</Text>
          <View style={styles.modalDivisor} />

          <Text style={styles.modalLabel}>{t("agenda.modal.dateAndHour", "Data e Hora")}</Text>
          <Text style={styles.modalValor}>
            {String(dataModal.getDate()).padStart(2, "0")} de{" "}
            {getNomeMes(dataModal.getMonth(), locale)} de {dataModal.getFullYear()} às{" "}
            {String(dataModal.getHours()).padStart(2, "0")}:
            {String(dataModal.getMinutes()).padStart(2, "0")} {dataFimModal && "- "}
            {dataFimModal && String(dataFimModal.getHours()).padStart(2, "0")}{dataFimModal && ":"}
            {dataFimModal && String(dataFimModal.getMinutes()).padStart(2, "0")}
          </Text>

          <Text style={styles.modalLabel}>{t("agenda.modal.pet", "Pet")}</Text>
          <Text style={styles.modalValor}>
            {atendimento.pet?.nome || t("agenda.modal.notInformed", "Não informado")}
          </Text>

          <Text style={styles.modalLabel}>{t("agenda.modal.services", "Serviços")}</Text>
          <Text style={styles.modalValor}>{nomesServicosModal}</Text>
          
          {atendimento.valorTotal > 0 && (
            <>
              <Text style={styles.modalLabel}>{t("agenda.modal.totalValue", "Valor Total")}</Text>
              <Text style={styles.modalValor}>
                R$ {atendimento.valorTotal?.toFixed(2).replace(".", ",") || "0,00"}
              </Text>
            </>
          )}

          <Text style={styles.modalLabel}>{t("agenda.modal.status", "Status")}</Text>
          <Text style={styles.modalValor}>
            {statusTexto}
          </Text>

          {/* Exibe os botões apenas se a tela permitir ações e o status for 'ACEITO_PELO_PETSHOP' */}
          {permiteAcoes && atendimento.status === "ACEITO_PELO_PETSHOP" ? (
            <View style={styles.botoesContainer}>
              <TouchableOpacity
                style={[styles.botaoAcao, styles.botaoRecusar]}
                onPress={onRecusar}
                disabled={processando}
              >
                {processando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.botaoAcaoTexto}>{t("agenda.modal.refuse", "Recusar")}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoAcao, styles.botaoAceitar]}
                onPress={onAceitar}
                disabled={processando}
              >
                {processando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.botaoAcaoTexto}>{t("agenda.modal.accept", "Aceitar")}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.modalBotaoFechar} onPress={onClose}>
              <Text style={styles.modalBotaoFecharTexto}>{t("agenda.modal.close", "Fechar")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    width: "85%",
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
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  botaoAcao: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoRecusar: {
    backgroundColor: "#E57373",
  },
  botaoAceitar: {
    backgroundColor: "#4CAF50",
  },
  botaoAcaoTexto: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  modalBotaoFechar: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
  },
  modalBotaoFecharTexto: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});