import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import PetCarousel from "../components/pets/PetCarousel";
import ServiceCard from "../components/home/ServiceCard";
import { SERVICOS } from "../constants/data";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { enviarRequisicaoHttp } from "../api/compartilhado/clienteHttp";

export default function AgendaScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const servicoInicial = route?.params?.servicoInicial || null;

  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  
  const [selectedServices, setSelectedServices] = useState(
    servicoInicial ? [servicoInicial] : []
  );

  const [disponibilidade, setDisponibilidade] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    carregarPets();
    carregarDisponibilidade();
  }, []);

  const carregarPets = async () => {
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const data = await enviarRequisicaoHttp({
        metodo: "GET",
        endpoint: `/pets/filtro?clienteId=${clienteId}`
      });
      setPets(data || []);
      if (data && data.length > 0) setSelectedPet(data[0].id);
    } catch (error) {
      console.log("Erro ao buscar pets:", error);
    }
  };

  const carregarDisponibilidade = async () => {
    try {
      const data = await enviarRequisicaoHttp({
        metodo: "GET",
        endpoint: "/agendas/disponibilidade?inicio=2026-04-29T00:00:00&fim=2026-04-29T23:59:59"
      });
      setDisponibilidade(data || []);
      if (data && data.length > 0) {
        setSelectedDate(data[0].dia);
      }
    } catch (error) {
      console.log("Erro ao buscar disponibilidades:", error);
    }
  };

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const agendar = async () => {
    if (!selectedPet || selectedServices.length === 0 || !selectedDate || !selectedTime) {
      Alert.alert("Aviso", "Preencha todas as informações para agendar.");
      return;
    }

    try {
      const clienteId = await obterOuSincronizarClienteId();
      const payload = {
        chatId: clienteId,
        petId: selectedPet,
        servicos: selectedServices.map((id) => ({ id, valor: 0.0 })),
        valorDeslocamento: 0.0,
        dataHoraInicio: `${selectedDate}T${selectedTime}`,
        dataHoraFim: "",
        dataHoraSolicitacao: new Date().toISOString(),
        status: "AGUARDANDO_RESPOSTA_PETSHOP",
      };

      await enviarRequisicaoHttp({
        metodo: "POST",
        endpoint: "/solicitacoes-agenda",
        corpoJson: payload
      });

      Alert.alert("Sucesso!", "Agendamento solicitado com sucesso.");
      navigation.navigate("HomeTab");
    } catch (error) {
      console.log("Erro ao agendar:", error);
      Alert.alert("Erro", "Falha ao solicitar agendamento.");
    }
  };

  const horariosDoDiaSelecionado = disponibilidade.find((d) => d.dia === selectedDate)?.horarios || [];

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Agendamento</Text>

        {/* 1. Carrossel de Pets */}
        <Text style={styles.sectionTitle}>1. Escolha o Pet</Text>
        <PetCarousel pets={pets} selectedPetId={selectedPet} onSelectPet={setSelectedPet} />

        {/* 2. Serviços (Checkbox com grayscale) */}
        <Text style={styles.sectionTitle}>2. Selecione os Serviços</Text>
        <View style={styles.servicosRow}>
          {SERVICOS.slice(0, 3).map((s) => ( // banho(1), tosa(2), hidratação(3)
            <ServiceCard
              key={s.id || s.key}
              servico={s}
              isSelected={selectedServices.includes(s.id)}
              onPress={() => toggleService(s.id)}
            />
          ))}
        </View>

        {/* 3. Data e Hora */}
        <Text style={styles.sectionTitle}>3. Escolha a Data e Horário</Text>
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {disponibilidade.map((disp) => (
              <TouchableOpacity
                key={disp.dia}
                style={[styles.timeChip, selectedDate === disp.dia && styles.timeChipSelected]}
                onPress={() => {
                  setSelectedDate(disp.dia);
                  setSelectedTime("");
                }}
              >
                <Text style={[styles.timeChipText, selectedDate === disp.dia && styles.timeChipTextSelected]}>
                  {disp.diaSemana.split("-")[0]} ({disp.dia.split("-").slice(1).reverse().join("/")})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedDate !== "" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {horariosDoDiaSelecionado.map((hora) => (
                <TouchableOpacity
                  key={hora}
                  style={[styles.timeChip, selectedTime === hora && styles.timeChipSelected]}
                  onPress={() => setSelectedTime(hora)}
                >
                  <Text style={[styles.timeChipText, selectedTime === hora && styles.timeChipTextSelected]}>
                    {hora.substring(0, 5)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Botão Agendar */}
        <TouchableOpacity style={styles.btnAgendar} onPress={agendar}>
          <Text style={styles.btnAgendarText}>Solicitar Agendamento</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: COLORS.background },
  titulo: { fontSize: 28, fontFamily: FONTS.extraBold, color: COLORS.primaryDark, paddingHorizontal: SPACING.lg, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.dark, paddingHorizontal: SPACING.lg, marginTop: 24, marginBottom: 12 },
  servicosRow: { flexDirection: "row", paddingHorizontal: SPACING.lg },
  pickerContainer: { paddingHorizontal: SPACING.lg, gap: 10 },
  dateScroll: { flexDirection: "row", marginBottom: 10 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.sm, backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#ddd", marginRight: 10 },
  timeChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipText: { fontFamily: FONTS.bold, color: COLORS.dark, fontSize: 14 },
  timeChipTextSelected: { color: COLORS.white },
  btnAgendar: { margin: SPACING.lg, backgroundColor: COLORS.primaryDark, padding: 18, borderRadius: RADIUS.md, alignItems: "center" },
  btnAgendarText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 },
});