import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import { enviarRequisicaoHttp } from "../api/compartilhado/clienteHttp";
import { buscarClientePorId } from "../api/clientes/cadastrarCliente";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { listarPetsPorClienteSimples } from "../api/pets/listarPetsPorCliente";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ModalInput({ label, value, onChangeText, ...props }) {
  return (
    <View style={styles.modalInputWrapper}>
      <Text style={styles.modalInputLabel}>{label}</Text>
      <TextInput
        style={styles.modalInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );
}

export default function PerfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [usuario, setUsuario] = useState({
    nome: "Usuário",
    email: "",
    telefone: "",
    endereco: "",
  });
  const [pets, setPets] = useState([]);
  const [editUserVisivel, setEditUserVisivel] = useState(false);
  const [editUser, setEditUser] = useState({ ...usuario });

  // Recarrega ao focar (após voltar do cadastro de pet)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", carregarDadosUsuario);
    return unsubscribe;
  }, [navigation]);

  async function obterEmailUsuarioSalvo() {
    const emailAtual = await AsyncStorage.getItem("@eleve:email_usuario");
    if (emailAtual) {
      return emailAtual;
    }

    const emailLegado = await AsyncStorage.getItem("@eleve:email");
    if (emailLegado) {
      await AsyncStorage.setItem("@eleve:email_usuario", emailLegado);
      return emailLegado;
    }

    return "";
  }

  async function carregarDadosUsuario() {
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const dadosCliente = await buscarClientePorId(clienteId);

      const rua = dadosCliente.rua || "";
      const num = dadosCliente.numEndereco || "";
      const endereco =
        rua && num ? `${rua}, ${num}` : rua || num || "Endereço não informado";

      const emailSalvo = (await obterEmailUsuarioSalvo()) || dadosCliente.email || "";

      setUsuario({
        nome: dadosCliente.nome || "Usuário",
        email: emailSalvo,
        telefone: dadosCliente.telefone
          ? formatarTelefone(dadosCliente.telefone)
          : "",
        endereco,
      });

      const petsDoCliente = await listarPetsPorClienteSimples(clienteId);
      if (petsDoCliente && petsDoCliente.length > 0) {
        setPets(
          petsDoCliente.map((pet) => ({
            id: pet.id,
            nome: pet.nome || "Pet",
            raca: pet.raca?.nome || "Não informada",
            sexo: pet.sexo || "Não informado",
            porte: pet.porte?.nome || "Não informado",
            foto: pet.foto || null,
          }))
        );
      } else {
        setPets([]);
      }
    } catch (erro) {
      console.error("Erro ao carregar dados do usuário:", erro);
    }
  }

  function formatarTelefone(telefone) {
    const n = telefone.replace(/\D/g, "");
    if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    return telefone;
  }

  function abrirEditarPerfil() {
    setEditUser({ ...usuario });
    setEditUserVisivel(true);
  }

  async function salvarUsuario() {
    const emailAtualizado = String(editUser.email || "").trim();
    if (emailAtualizado) {
      await AsyncStorage.setItem("@eleve:email_usuario", emailAtualizado);
    }

    setUsuario({ ...editUser });
    setEditUserVisivel(false);
  }

  function irParaCadastroPet() {
    navigation.navigate("PetRegistration", { fromPerfil: true });
  }

  async function realizarLogout() {
    try {
      await enviarRequisicaoHttp({ metodo: "POST", endpoint: "/usuarios/logout" });
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (erro) {
      console.error("Erro ao realizar logout:", erro);
      Alert.alert("Erro", "Não foi possível realizar o logout.");
    }
  }

  const primeiroNome = usuario.nome.trim().split(" ")[0];

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Seu Perfil</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity activeOpacity={0.7} onPress={abrirEditarPerfil}>
            <Text style={styles.pencilEmoji}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={realizarLogout}>
            <FontAwesome name="sign-out" size={26} color={COLORS.primaryMedium} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Usuário */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <FontAwesome name="user" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.userName}>{primeiroNome}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📧</Text>
            <Text style={styles.infoText}>{usuario.email || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🏠</Text>
            <Text style={styles.infoText}>{usuario.endereco || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📞</Text>
            <Text style={styles.infoText}>{usuario.telefone || "—"}</Text>
          </View>
        </View>

        {/* Cards dos Pets */}
        {pets.length === 0 ? (
          <View style={styles.emptyPetCard}>
            <FontAwesome name="paw" size={36} color={COLORS.accent} />
            <Text style={styles.emptyPetText}>Nenhum pet cadastrado ainda</Text>
          </View>
        ) : (
          pets.map((pet, idx) => (
            <View key={pet.id ?? idx} style={styles.petCard}>
              <View style={styles.petHeader}>
                <View>
                  <Text style={styles.petCardTitle}>
                    {pets.length > 1 ? `Pet ${idx + 1}` : "Perfil do"}
                  </Text>
                  <Text style={styles.petCardTitle}>
                    {pets.length > 1 ? pet.nome : "Seu Pet"}
                  </Text>
                </View>
                {pet.foto ? (
                  <Image source={{ uri: pet.foto }} style={styles.petPhoto} />
                ) : (
                  <View style={styles.petPhotoPlaceholder}>
                    <FontAwesome name="paw" size={28} color={COLORS.primary} />
                  </View>
                )}
              </View>

              <View style={styles.petInfoGrid}>
                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>Nome</Text>
                  <Text style={styles.petInfoValue}>{pet.nome}</Text>
                </View>
                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>Raça</Text>
                  <Text style={styles.petInfoValue}>{pet.raca}</Text>
                </View>
                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>Sexo</Text>
                  <Text style={styles.petInfoValue}>{pet.sexo}</Text>
                </View>
                <View style={styles.petInfoItem}>
                  <Text style={styles.petInfoLabel}>Porte</Text>
                  <Text style={styles.petInfoValue}>{pet.porte}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Botão Cadastrar Novo Pet */}
        <TouchableOpacity
          style={styles.addPetButton}
          activeOpacity={0.8}
          onPress={irParaCadastroPet}
        >
          <FontAwesome name="plus-circle" size={22} color={COLORS.primary} />
          <Text style={styles.addPetButtonText}>+ Cadastrar Novo Pet</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal Editar Perfil */}
      <Modal
        visible={editUserVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setEditUserVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.editOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.editContent}>
            <Text style={styles.editTitle}>Editar Perfil</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ModalInput
                label="Nome"
                value={editUser.nome}
                onChangeText={(v) => setEditUser((p) => ({ ...p, nome: v }))}
                placeholder="Seu nome"
                autoCapitalize="words"
              />
              <ModalInput
                label="E-mail"
                value={editUser.email}
                onChangeText={(v) => setEditUser((p) => ({ ...p, email: v }))}
                placeholder="email@exemplo.com"
                keyboardType="email-address"
              />
              <ModalInput
                label="Endereço"
                value={editUser.endereco}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, endereco: v }))
                }
                placeholder="Seu endereço"
              />
              <ModalInput
                label="Telefone"
                value={editUser.telefone}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, telefone: v }))
                }
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditUserVisivel(false)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveBtn}
                onPress={salvarUsuario}
              >
                <Text style={styles.editSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pencilEmoji: {
    fontSize: 22,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
    paddingBottom: SPACING.xl,
  },
  // User Card
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: COLORS.blueLight,
    borderRadius: RADIUS.sm,
    marginBottom: 2,
  },
  infoEmoji: { fontSize: 20, marginRight: 14 },
  infoText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    flex: 1,
  },
  divider: { height: 6 },
  // Empty state
  emptyPetCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyPetText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
  },
  // Pet Card
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  petHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  petCardTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    lineHeight: 28,
  },
  petPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  petPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  petInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  petInfoItem: {
    width: "50%",
    marginBottom: 16,
  },
  petInfoLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primaryMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  petInfoValue: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
  },
  // Add Pet Button
  addPetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    marginTop: 4,
    gap: 10,
  },
  addPetButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  // Edit Modal
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  editContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 30,
    width: SCREEN_WIDTH * 0.88,
    maxHeight: "80%",
  },
  editTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    textAlign: "center",
    marginBottom: 20,
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editCancelText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  editSaveText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  modalInputWrapper: { marginBottom: 14 },
  modalInputLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.primaryMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
});
