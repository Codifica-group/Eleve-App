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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import { OPCOES_SEXO, OPCOES_PORTE } from "../constants/data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Componentes fora do render para evitar recriação e bug do teclado
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

function ModalSelectionGroup({ label, opcoes, valor, onChange }) {
  return (
    <View style={styles.modalInputWrapper}>
      <Text style={styles.modalInputLabel}>{label}</Text>
      <View style={styles.modalSelectionRow}>
        {opcoes.map((op) => (
          <TouchableOpacity
            key={op}
            style={[
              styles.modalSelectionBtn,
              valor === op && styles.modalSelectionBtnActive,
            ]}
            onPress={() => onChange(op)}
          >
            <Text
              style={[
                styles.modalSelectionText,
                valor === op && styles.modalSelectionTextActive,
              ]}
            >
              {op}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PerfilScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const params = route?.params || {};

  // Estado do usuário
  const [usuario, setUsuario] = useState({
    nome: params.nomeUsuario || "Usuário",
    email: params.email || "email@exemplo.com",
    telefone: params.telefone || "(11) 98640-0678",
    endereco: params.endereco || "Endereço não informado",
  });

  // Estado dos pets (lista)
  const [pets, setPets] = useState([
    {
      nome: params.nomePet || "Pet",
      raca: params.racaPet || "Não informada",
      sexo: params.sexoPet || "Não informado",
      porte: params.portePet || "Não informado",
      foto: params.fotoPet || null,
    },
  ]);

  // Atualizar se params mudarem
  useEffect(() => {
    if (params.nomeUsuario) {
      setUsuario({
        nome: params.nomeUsuario,
        email: params.email || "email@exemplo.com",
        telefone: params.telefone || "(11) 98640-0678",
        endereco: params.endereco || "Endereço não informado",
      });
    }
    if (params.nomePet) {
      setPets((prev) => {
        const updated = [...prev];
        updated[0] = {
          nome: params.nomePet,
          raca: params.racaPet || "Não informada",
          sexo: params.sexoPet || "Não informado",
          porte: params.portePet || "Não informado",
          foto: params.fotoPet || null,
        };
        return updated;
      });
    }
  }, [params.nomeUsuario, params.nomePet]);

  // Modais
  const [menuVisivel, setMenuVisivel] = useState(false);
  const [editUserVisivel, setEditUserVisivel] = useState(false);
  const [editPetVisivel, setEditPetVisivel] = useState(false);
  const [petEditIndex, setPetEditIndex] = useState(0);
  const [selectPetVisivel, setSelectPetVisivel] = useState(false);

  // Buffers de edição
  const [editUser, setEditUser] = useState({ ...usuario });
  const [editPet, setEditPet] = useState({ ...pets[0] });

  const primeiroNome = usuario.nome.trim().split(" ")[0];

  // Ações do menu
  function abrirEditarPerfil() {
    setMenuVisivel(false);
    setEditUser({ ...usuario });
    setEditUserVisivel(true);
  }

  function abrirEditarPet() {
    setMenuVisivel(false);
    if (pets.length === 1) {
      setPetEditIndex(0);
      setEditPet({ ...pets[0] });
      setEditPetVisivel(true);
    } else {
      setSelectPetVisivel(true);
    }
  }

  function selecionarPetParaEditar(index) {
    setSelectPetVisivel(false);
    setPetEditIndex(index);
    setEditPet({ ...pets[index] });
    setEditPetVisivel(true);
  }

  function adicionarNovoPet() {
    setMenuVisivel(false);
    const novoPet = {
      nome: "",
      raca: "",
      sexo: "",
      porte: "",
      foto: null,
    };
    setPets((prev) => [...prev, novoPet]);
    setPetEditIndex(pets.length);
    setEditPet(novoPet);
    setEditPetVisivel(true);
  }

  function salvarUsuario() {
    setUsuario({ ...editUser });
    setEditUserVisivel(false);
  }

  function salvarPet() {
    setPets((prev) => {
      const updated = [...prev];
      updated[petEditIndex] = { ...editPet };
      return updated;
    });
    setEditPetVisivel(false);
  }

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Seu Perfil</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMenuVisivel(true)}
          >
            <Text style={styles.pencilEmoji}>✏️</Text>
          </TouchableOpacity>
          <FontAwesome name="gear" size={26} color={COLORS.primaryMedium} />
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
            <Text style={styles.infoText}>{usuario.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🏠</Text>
            <Text style={styles.infoText}>{usuario.endereco}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📞</Text>
            <Text style={styles.infoText}>{usuario.telefone}</Text>
          </View>
        </View>

        {/* Cards dos Pets */}
        {pets.map((pet, idx) => (
          <View key={idx} style={styles.petCard}>
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
        ))}
      </ScrollView>

      {/* Modal Menu */}
      <Modal
        visible={menuVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisivel(false)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuClose}
              onPress={() => setMenuVisivel(false)}
            >
              <FontAwesome name="close" size={18} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={abrirEditarPerfil}
            >
              <Text style={styles.menuButtonText}>Editar Seu Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={abrirEditarPet}
            >
              <Text style={styles.menuButtonText}>
                Editar Perfil do Seu Pet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={adicionarNovoPet}
            >
              <Text style={styles.menuButtonText}>Adicionar Novo Pet</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Selecionar Pet */}
      <Modal
        visible={selectPetVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectPetVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectPetVisivel(false)}
        >
          <View style={styles.menuContent}>
            <Text style={styles.editTitle}>Qual pet deseja editar?</Text>
            {pets.map((pet, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuButton}
                activeOpacity={0.8}
                onPress={() => selecionarPetParaEditar(idx)}
              >
                <Text style={styles.menuButtonText}>
                  {pet.nome || `Pet ${idx + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Editar Usuário */}
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
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, nome: v }))
                }
                placeholder="Seu nome"
                autoCapitalize="words"
              />
              <ModalInput
                label="E-mail"
                value={editUser.email}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, email: v }))
                }
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

      {/* Modal Editar Pet */}
      <Modal
        visible={editPetVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setEditPetVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.editOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.editContent}>
            <Text style={styles.editTitle}>
              {editPet.nome
                ? `Editar ${editPet.nome}`
                : "Novo Pet"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ModalInput
                label="Nome do Pet"
                value={editPet.nome}
                onChangeText={(v) =>
                  setEditPet((p) => ({ ...p, nome: v }))
                }
                placeholder="Ex: Caramelo"
                autoCapitalize="words"
              />
              <ModalInput
                label="Raça"
                value={editPet.raca}
                onChangeText={(v) =>
                  setEditPet((p) => ({ ...p, raca: v }))
                }
                placeholder="Ex: Labrador"
                autoCapitalize="words"
              />
              <ModalSelectionGroup
                label="Sexo"
                opcoes={OPCOES_SEXO}
                valor={editPet.sexo}
                onChange={(v) => setEditPet((p) => ({ ...p, sexo: v }))}
              />
              <ModalSelectionGroup
                label="Porte"
                opcoes={OPCOES_PORTE}
                valor={editPet.porte}
                onChange={(v) => setEditPet((p) => ({ ...p, porte: v }))}
              />
            </ScrollView>

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditPetVisivel(false)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveBtn}
                onPress={salvarPet}
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
  scroll: {
    flex: 1,
  },
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
  infoEmoji: {
    fontSize: 20,
    marginRight: 14,
  },
  infoText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    flex: 1,
  },
  divider: {
    height: 6,
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
  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    width: SCREEN_WIDTH * 0.82,
    alignItems: "center",
  },
  menuClose: {
    position: "absolute",
    top: 14,
    right: 16,
    padding: 6,
  },
  menuButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 15,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
  menuButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  // Edit Modals
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
  // Modal Inputs
  modalInputWrapper: {
    marginBottom: 14,
  },
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
  modalSelectionRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalSelectionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  modalSelectionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalSelectionText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.gray,
  },
  modalSelectionTextActive: {
    color: COLORS.white,
  },
});
