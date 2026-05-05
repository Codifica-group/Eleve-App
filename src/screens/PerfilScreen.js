import React, { useState, useEffect, useRef } from "react";
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
import { buscarClientePorId, atualizarCliente } from "../api/clientes/cadastrarCliente";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { listarPetsPorClienteSimples } from "../api/pets/listarPetsPorCliente";
import { extrairEmailDoToken } from "../utils/tokenJwt";
import { formatarCep } from "../hooks/useFormValidation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const EMAIL_KEY = "@eleve:email_usuario";
const EMAIL_LEGADO_KEY = "@eleve:email";
const TELEFONE_KEY = "@eleve:telefone_usuario";
const ENDERECO_KEY = "@eleve:endereco_usuario";
const TOKEN_KEY = "@eleve:token_acesso";

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
  const ultimoCepBuscadoRef = useRef("");

  const [usuario, setUsuario] = useState({
    nome: "Usuário",
    email: "",
    telefone: "",
    endereco: "",
  });
  const [clienteId, setClienteId] = useState(null);
  const [dadosEndereco, setDadosEndereco] = useState({
    cep: "",
    rua: "",
    numEndereco: "",
    bairro: "",
    cidade: "",
    complemento: "",
  });
  const [pets, setPets] = useState([]);
  const [editUserVisivel, setEditUserVisivel] = useState(false);
  const [editUser, setEditUser] = useState({
    nome: "",
    email: "",
    telefone: "",
    cep: "",
    rua: "",
    numEndereco: "",
    bairro: "",
    cidade: "",
    complemento: "",
  });
  const [carregandoCepEdicao, setCarregandoCepEdicao] = useState(false);
  const [erroCepEdicao, setErroCepEdicao] = useState(null);

  // Recarrega ao focar (após voltar do cadastro de pet)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", carregarDadosUsuario);
    return unsubscribe;
  }, [navigation]);

  function normalizarValorSalvo(valor) {
    const texto = String(valor ?? "").trim();
    if (!texto || texto === "undefined" || texto === "null") {
      return "";
    }
    return texto;
  }

  function montarEnderecoCliente(dadosCliente) {
    const rua = normalizarValorSalvo(dadosCliente?.rua);
    const numero = normalizarValorSalvo(dadosCliente?.numEndereco);
    const bairro = normalizarValorSalvo(dadosCliente?.bairro);
    const cidade = normalizarValorSalvo(dadosCliente?.cidade);

    const linhaPrincipal = [rua, numero].filter(Boolean).join(", ");
    const linhaSecundaria = [bairro, cidade].filter(Boolean).join(" • ");

    return [linhaPrincipal, linhaSecundaria].filter(Boolean).join(" · ");
  }

  function montarDetalhesEndereco(dadosCliente) {
    return {
      cep: normalizarValorSalvo(dadosCliente?.cep),
      rua: normalizarValorSalvo(dadosCliente?.rua),
      numEndereco: normalizarValorSalvo(dadosCliente?.numEndereco),
      bairro: normalizarValorSalvo(dadosCliente?.bairro),
      cidade: normalizarValorSalvo(dadosCliente?.cidade),
      complemento: normalizarValorSalvo(dadosCliente?.complemento),
    };
  }

  async function obterPerfilLocalSalvo() {
    const pares = await AsyncStorage.multiGet([
      EMAIL_KEY,
      EMAIL_LEGADO_KEY,
      TELEFONE_KEY,
      ENDERECO_KEY,
      TOKEN_KEY,
    ]);

    const dados = Object.fromEntries(pares);
    const emailSalvo =
      normalizarValorSalvo(dados[EMAIL_KEY]) ||
      normalizarValorSalvo(dados[EMAIL_LEGADO_KEY]) ||
      extrairEmailDoToken(dados[TOKEN_KEY]);

    if (emailSalvo) {
      await AsyncStorage.setItem(EMAIL_KEY, emailSalvo);
    }

    return {
      email: emailSalvo,
      telefone: normalizarValorSalvo(dados[TELEFONE_KEY]),
      endereco: normalizarValorSalvo(dados[ENDERECO_KEY]),
    };
  }

  async function salvarPerfilLocal({ email, telefone, endereco }) {
    const operacoes = [];
    const chavesParaRemover = [];
    const emailNormalizado = normalizarValorSalvo(email);
    const telefoneNormalizado = normalizarValorSalvo(telefone);
    const enderecoNormalizado = normalizarValorSalvo(endereco);

    if (emailNormalizado) operacoes.push([EMAIL_KEY, emailNormalizado]);
    else chavesParaRemover.push(EMAIL_KEY);

    if (telefoneNormalizado) operacoes.push([TELEFONE_KEY, telefoneNormalizado]);
    else chavesParaRemover.push(TELEFONE_KEY);

    if (enderecoNormalizado) operacoes.push([ENDERECO_KEY, enderecoNormalizado]);
    else chavesParaRemover.push(ENDERECO_KEY);

    if (operacoes.length) {
      await AsyncStorage.multiSet(operacoes);
    }

    if (chavesParaRemover.length) {
      await AsyncStorage.multiRemove(chavesParaRemover);
    }
  }

  async function carregarDadosUsuario() {
    const perfilLocal = await obterPerfilLocalSalvo();

    try {
      const clienteIdAtual = await obterOuSincronizarClienteId();
      const dadosCliente = await buscarClientePorId(clienteIdAtual);
      const detalhesEndereco = montarDetalhesEndereco(dadosCliente);

      const enderecoCliente = montarEnderecoCliente(dadosCliente);
      const enderecoFinal = enderecoCliente || perfilLocal.endereco;
      const telefoneFinal = dadosCliente.telefone
        ? formatarTelefone(dadosCliente.telefone)
        : perfilLocal.telefone;
      const emailFinal = perfilLocal.email || normalizarValorSalvo(dadosCliente.email);

      setClienteId(clienteIdAtual);
      setDadosEndereco(detalhesEndereco);
      setUsuario({
        nome: dadosCliente.nome || "Usuário",
        email: emailFinal,
        telefone: telefoneFinal,
        endereco: enderecoFinal || "Endereço não informado",
      });

      await salvarPerfilLocal({
        email: emailFinal,
        telefone: telefoneFinal,
        endereco: enderecoFinal,
      });

      const petsDoCliente = await listarPetsPorClienteSimples(clienteIdAtual);
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
      setUsuario((anterior) => ({
        nome: anterior.nome || "Usuário",
        email: perfilLocal.email || anterior.email,
        telefone: perfilLocal.telefone || anterior.telefone,
        endereco: perfilLocal.endereco || anterior.endereco,
      }));
    }
  }

  function formatarTelefone(telefone) {
    const n = String(telefone || "").replace(/\D/g, "");
    if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return String(telefone || "");
  }

  function abrirEditarPerfil() {
    setErroCepEdicao(null);
    setEditUser({
      nome: normalizarValorSalvo(usuario.nome),
      email: normalizarValorSalvo(usuario.email),
      telefone: normalizarValorSalvo(usuario.telefone),
      cep: normalizarValorSalvo(dadosEndereco.cep),
      rua: normalizarValorSalvo(dadosEndereco.rua),
      numEndereco: normalizarValorSalvo(dadosEndereco.numEndereco),
      bairro: normalizarValorSalvo(dadosEndereco.bairro),
      cidade: normalizarValorSalvo(dadosEndereco.cidade),
      complemento: normalizarValorSalvo(dadosEndereco.complemento),
    });
    setEditUserVisivel(true);
  }

  async function buscarEnderecoPorCepEdicao(cepLimpo) {
    if (cepLimpo.length !== 8 || ultimoCepBuscadoRef.current === cepLimpo) {
      return;
    }

    ultimoCepBuscadoRef.current = cepLimpo;
    setErroCepEdicao(null);

    try {
      setCarregandoCepEdicao(true);
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resposta.ok) {
        throw new Error("Falha ao consultar CEP");
      }

      const dados = await resposta.json();
      if (dados.erro) {
        throw new Error("CEP não encontrado");
      }

      setEditUser((prev) => ({
        ...prev,
        rua: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
      }));
    } catch {
      setEditUser((prev) => ({
        ...prev,
        rua: "",
        bairro: "",
        cidade: "",
      }));
      setErroCepEdicao("Não foi possível preencher o endereço pelo CEP. Verifique o CEP informado.");
    } finally {
      setCarregandoCepEdicao(false);
    }
  }

  function onChangeCepEdicao(valor) {
    const cepFormatado = formatarCep(valor);
    const cepLimpo = cepFormatado.replace(/\D/g, "");

    setEditUser((prev) => ({ ...prev, cep: cepFormatado }));

    if (cepLimpo.length < 8) {
      ultimoCepBuscadoRef.current = "";
      setErroCepEdicao(null);
      setEditUser((prev) => ({
        ...prev,
        cep: cepFormatado,
        rua: "",
        bairro: "",
        cidade: "",
      }));
      return;
    }

    buscarEnderecoPorCepEdicao(cepLimpo);
  }

  async function salvarUsuario() {
    const nomeAtualizado = normalizarValorSalvo(editUser.nome);
    const emailAtualizado = normalizarValorSalvo(editUser.email);
    const telefoneNumeros = normalizarValorSalvo(editUser.telefone).replace(/\D/g, "");
    const telefoneAtualizado = formatarTelefone(telefoneNumeros);
    const cepAtualizado = normalizarValorSalvo(editUser.cep).replace(/\D/g, "");
    const ruaAtualizada = normalizarValorSalvo(editUser.rua);
    const numeroAtualizado = normalizarValorSalvo(editUser.numEndereco);
    const bairroAtualizado = normalizarValorSalvo(editUser.bairro);
    const cidadeAtualizada = normalizarValorSalvo(editUser.cidade);
    const complementoAtualizado = normalizarValorSalvo(editUser.complemento);

    if (!nomeAtualizado) {
      Alert.alert("Atenção", "Informe o nome do usuário.");
      return;
    }

    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      Alert.alert("Atenção", "Informe um telefone válido.");
      return;
    }

    if (!cepAtualizado || cepAtualizado.length !== 8) {
      Alert.alert("Atenção", "Informe um CEP válido para atualizar o endereço.");
      return;
    }

    if (!ruaAtualizada || !bairroAtualizado || !cidadeAtualizada) {
      Alert.alert("Atenção", "Preencha o CEP para completar rua, bairro e cidade.");
      return;
    }

    const clienteIdAtual = clienteId || await obterOuSincronizarClienteId();
    const detalhesAtualizados = {
      cep: cepAtualizado,
      rua: ruaAtualizada,
      numEndereco: numeroAtualizado,
      bairro: bairroAtualizado,
      cidade: cidadeAtualizada,
      complemento: complementoAtualizado,
    };
    const enderecoAtualizado = montarEnderecoCliente(detalhesAtualizados);

    await atualizarCliente(clienteIdAtual, {
      nome: nomeAtualizado,
      telefone: telefoneNumeros,
      cep: cepAtualizado,
      rua: ruaAtualizada,
      numEndereco: numeroAtualizado || null,
      bairro: bairroAtualizado,
      cidade: cidadeAtualizada,
      complemento: complementoAtualizado || null,
    });

    await salvarPerfilLocal({
      email: emailAtualizado,
      telefone: telefoneAtualizado,
      endereco: enderecoAtualizado,
    });

    setClienteId(clienteIdAtual);
    setDadosEndereco(detalhesAtualizados);
    setUsuario({
      nome: nomeAtualizado,
      email: emailAtualizado,
      telefone: telefoneAtualizado,
      endereco: enderecoAtualizado || "Endereço não informado",
    });
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
                label="Telefone"
                value={editUser.telefone}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, telefone: v }))
                }
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
              />
              <ModalInput
                label="CEP"
                value={editUser.cep}
                onChangeText={onChangeCepEdicao}
                placeholder="00000-000"
                keyboardType="numeric"
                maxLength={9}
              />
              <Text
                style={[
                  styles.cepInfo,
                  erroCepEdicao ? styles.cepInfoErro : null,
                ]}
              >
                {erroCepEdicao ||
                  (carregandoCepEdicao
                    ? "Buscando endereço pelo CEP..."
                    : "Informe o CEP para preencher rua, bairro e cidade automaticamente.")}
              </Text>
              <ModalInput
                label="Rua"
                value={editUser.rua}
                onChangeText={(v) => setEditUser((p) => ({ ...p, rua: v }))}
                placeholder="Rua, avenida, travessa..."
                autoCapitalize="words"
              />
              <ModalInput
                label="Número (opcional)"
                value={editUser.numEndereco}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, numEndereco: v }))
                }
                placeholder="Ex.: 120"
                keyboardType="numeric"
              />
              <ModalInput
                label="Bairro"
                value={editUser.bairro}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, bairro: v }))
                }
                placeholder="Seu bairro"
                autoCapitalize="words"
              />
              <ModalInput
                label="Cidade"
                value={editUser.cidade}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, cidade: v }))
                }
                placeholder="Sua cidade"
                autoCapitalize="words"
              />
              <ModalInput
                label="Complemento"
                value={editUser.complemento}
                onChangeText={(v) =>
                  setEditUser((p) => ({ ...p, complemento: v }))
                }
                placeholder="Apartamento, bloco, referência..."
                autoCapitalize="words"
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
  cepInfo: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.primaryMedium,
    marginTop: -4,
    marginBottom: 12,
    lineHeight: 17,
  },
  cepInfoErro: {
    color: COLORS.pink,
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
});
