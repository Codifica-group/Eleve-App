import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import PetCarousel from "../components/pets/PetCarousel";
import ServiceAgendaCard from "../components/agenda/ServiceAgendaCard";
import { SERVICOS } from "../constants/data";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { enviarRequisicaoHttp } from "../api/compartilhado/clienteHttp";
import FeedbackManager from "../utils/FeedbackManager";

export default function NovoAgendamentoScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const servicoInicial = route?.params?.servicoInicial || null;

  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedServices, setSelectedServices] = useState(servicoInicial ? [servicoInicial] : []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [mensagemErroHorario, setMensagemErroHorario] = useState("");

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const formatDate = (d) => {
    if (!d) return "";
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const parseDate = (text) => {
    if (!text || text.length !== 10) return null;
    const parts = text.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 2000) return null;

    const newDate = new Date(year, month, day);
    if (newDate.getFullYear() === year && newDate.getMonth() === month && newDate.getDate() === day) {
      return newDate;
    }
    return null;
  };

  const [dateText, setDateText] = useState(formatDate(date));

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Limpa os campos e reinicia a data para hoje
      const resetDate = new Date();
      resetDate.setHours(0, 0, 0, 0);
      
      setDate(resetDate);
      setDateText(formatDate(resetDate));
      setSelectedTime("");
      setMensagemErroHorario("");

      // Lida com o parâmetro de serviço inicial e o limpa para as próximas visitas
      if (route?.params?.servicoInicial) {
        setSelectedServices([route.params.servicoInicial]);
        navigation.setParams({ servicoInicial: undefined });
      } else {
        setSelectedServices([]);
      }

      carregarPets();
    });
    
    return unsubscribe;
  }, [navigation, route?.params?.servicoInicial]);

  useEffect(() => {
    carregarDisponibilidade(date);
  }, [date]);

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

  const carregarDisponibilidade = async (dataSelecionada) => {
    setHorarios([]);
    setSelectedTime("");
    setMensagemErroHorario("");

    const dataFormatada = dataSelecionada.toISOString().split("T")[0];
    try {
      const data = await enviarRequisicaoHttp({
        metodo: "GET",
        endpoint: `/agendas/disponibilidade?inicio=${dataFormatada}T00:00:00&fim=${dataFormatada}T23:59:59`
      });

      if (data && data.length > 0 && data[0].horarios.length > 0) {
        setHorarios(data[0].horarios);
        setIsAtStart(true);
        setIsAtEnd(data[0].horarios.length <= 4);
      } else {
        setMensagemErroHorario("Nenhum horário disponível para esta data.");
      }
    } catch (error) {
      console.log("Erro ao buscar disponibilidades:", error);
      setMensagemErroHorario("Erro ao procurar horários. Tente novamente.");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(0,0,0,0);
      setDate(newDate);
      setDateText(formatDate(newDate));
    }
  };

  const handleDateTextChange = (text) => {
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length > 2) formattedText = `${formattedText.slice(0, 2)}/${formattedText.slice(2)}`;
    if (formattedText.length > 5) formattedText = `${formattedText.slice(0, 5)}/${formattedText.slice(5, 9)}`;
    setDateText(formattedText);

    if (formattedText.length === 10) {
      const parsed = parseDate(formattedText);
      if (parsed && parsed >= today) {
        setDate(parsed);
      }
    }
  };

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    setIsAtStart(contentOffset.x <= 0);
    setIsAtEnd(layoutMeasurement.width + contentOffset.x >= contentSize.width - 20);
  };

  const agendar = async () => {
    if (!selectedPet || selectedServices.length === 0 || !selectedTime) {
      FeedbackManager.error("Preencha todas as informações (Pet, Serviço e Horário) para agendar.");
      return;
    }

    try {
      const clienteId = await obterOuSincronizarClienteId();
      const dataFormatada = date.toISOString().split("T")[0];
      const payload = {
        chatId: clienteId,
        petId: selectedPet,
        servicos: selectedServices.map((id) => ({ id, valor: 0.0 })),
        valorDeslocamento: 0.0,
        dataHoraInicio: `${dataFormatada}T${selectedTime}`,
        dataHoraFim: "",
        dataHoraSolicitacao: new Date().toISOString(),
        status: "AGUARDANDO_RESPOSTA_PETSHOP",
      };

      await enviarRequisicaoHttp({
        metodo: "POST",
        endpoint: "/solicitacoes-agenda",
        corpoJson: payload
      });

      FeedbackManager.success("Agendamento solicitado com sucesso.");
      
      // Limpa os campos logo após o sucesso
      const resetDate = new Date();
      resetDate.setHours(0, 0, 0, 0);
      setDate(resetDate);
      setDateText(formatDate(resetDate));
      setSelectedServices([]);
      setSelectedTime("");
      if (pets.length > 0) setSelectedPet(pets[0].id);

      navigation.navigate("HomeTab");
    } catch (error) {
      console.log("Erro ao agendar:", error);
      FeedbackManager.error("Falha ao solicitar agendamento.");
    }
  };

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Novo Agendamento</Text>

        <Text style={styles.sectionTitle}>1. Escolha o Pet</Text>
        <PetCarousel pets={pets} selectedPetId={selectedPet} onSelectPet={setSelectedPet} />

        <Text style={styles.sectionTitle}>2. Selecione os Serviços</Text>
        <View style={styles.servicosRow}>
          {SERVICOS.slice(0, 3).map((s) => (
            <ServiceAgendaCard
              key={s.key}
              servico={s}
              isSelected={selectedServices.includes(s.id)}
              onPress={toggleService}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>3. Escolha a Data e Horário</Text>
        <View style={styles.pickerContainer}>
          
          <View style={styles.dateInputContainer}>
            <TextInput
              style={styles.dateInput}
              value={dateText}
              onChangeText={handleDateTextChange}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />
            <TouchableOpacity style={styles.calendarIcon} onPress={() => setShowDatePicker(true)}>
              <FontAwesome name="calendar" size={24} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              minimumDate={today}
            />
          )}

          {/* Área dos Horários e Tratamento de Erros */}
          <View style={styles.horariosContainer}>
            {mensagemErroHorario ? (
              <Text style={styles.erroTexto}>{mensagemErroHorario}</Text>
            ) : (
              <View>
                {!isAtStart && (
                  <View style={[styles.scrollArrow, styles.scrollArrowLeft]}>
                    <FontAwesome name="chevron-left" size={16} color={COLORS.primaryDark} />
                  </View>
                )}
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.timeScroll}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {horarios.map((hora) => (
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

                {!isAtEnd && horarios.length > 0 && (
                  <View style={[styles.scrollArrow, styles.scrollArrowRight]}>
                    <FontAwesome name="chevron-right" size={16} color={COLORS.primaryDark} />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
  },
  calendarIcon: {
    padding: 8,
  },
  horariosContainer: { marginTop: 10 },
  dateScroll: { flexDirection: "row", marginBottom: 10 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.sm, backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#ddd", marginRight: 10 },
  timeChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipText: { fontFamily: FONTS.bold, color: COLORS.dark, fontSize: 14 },
  timeChipTextSelected: { color: COLORS.white },
  scrollArrow: { position: "absolute", top: "50%", marginTop: -12, zIndex: 10, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 12, padding: 4 },
  scrollArrowLeft: { left: -10 },
  scrollArrowRight: { right: -10 },
  btnAgendar: { margin: SPACING.lg, backgroundColor: COLORS.primaryDark, padding: 18, borderRadius: RADIUS.md, alignItems: "center" },
  btnAgendarText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 16 },
  erroTexto: { fontFamily: FONTS.regular, color: COLORS.gray, textAlign: 'center', paddingVertical: 20 },
});