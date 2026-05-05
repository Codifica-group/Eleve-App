import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import SelectionGroup from "../components/common/SelectionGroup";
import { OPCOES_SEXO, OPCOES_PORTE } from "../constants/data";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import { identificarRacaPorImagem } from "../api/racas/identificarRacaPorImagem";
import { buscarInfoRacaExterna } from "../api/racas/buscarInfoRacaExterna";
import { buscarRacaPorNome } from "../api/racas/buscarRaca";
import { criarRaca } from "../api/racas/criarRaca";
import { cadastrarPet } from "../api/pets/cadastrarPet";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";

const PORTE_PARA_ID = { Pequeno: 1, Médio: 2, Grande: 3 };
const GRUPOS_TRADUZIDOS = {
  sporting: "Esportivo",
  hound: "Caça",
  working: "Trabalho",
  terrier: "Terrier",
  toy: "Pequeno porte",
  herding: "Pastoreio",
  "non-sporting": "Não esportivo",
  mixed: "Misto",
  "foundation stock service": "Serviço de base",
};
const TEMPERAMENTOS_TRADUZIDOS = {
  eagertoplease: "dócil e disposto a agradar",
  goodnatured: "bem-humorado",
  goodnaturedness: "bom temperamento",
  goodtempered: "de bom temperamento",
  selfconfidence: "autoconfiante",
  eventempered: "equilibrado",
  sweettempered: "de temperamento dócil",
  familioriented: "apegado à família",
  childfriendly: "amigável com crianças",
  dogfriendly: "amigável com outros cães",
  catfriendly: "amigável com gatos",
  strangerfriendly: "amigável com estranhos",
  easygoing: "tranquilo",
  outgoing: "sociável",
  trainable: "fácil de treinar",
  adaptable: "adaptável",
  alert: "alerta",
  agile: "ágil",
  affectionate: "carinhoso",
  active: "ativo",
  adventurous: "aventureiro",
  assertive: "confiante",
  athletic: "atlético",
  attentive: "atento",
  bold: "corajoso",
  brave: "valente",
  calm: "calmo",
  cheerful: "alegre",
  clownish: "brincalhão",
  companionable: "companheiro",
  confident: "confiante",
  courageous: "corajoso",
  curious: "curioso",
  devoted: "devotado",
  dignified: "digno",
  docile: "dócil",
  dominant: "dominante",
  energetic: "energético",
  enthusiastic: "entusiasmado",
  excitable: "agitado",
  fearless: "destemido",
  friendly: "amigável",
  gentle: "gentil",
  happy: "feliz",
  intelligent: "inteligente",
  independent: "independente",
  loyal: "leal",
  loving: "amoroso",
  obedient: "obediente",
  patient: "paciente",
  playful: "brincalhão",
  protective: "protetor",
  quiet: "quieto",
  responsive: "receptivo",
  sensitive: "sensível",
  social: "sociável",
  spirited: "animado",
  stable: "estável",
  strong: "forte",
  stubborn: "teimoso",
  sweet: "doce",
  trustworthy: "confiável",
  vigilant: "vigilante",
  watchful: "atento",
};

function normalizarChaveTraducao(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizarChaveConsultaRaca(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function inferirPorte(pesoTexto) {
  if (!pesoTexto || pesoTexto === "Nao informado") return null;
  const nums = (pesoTexto.match(/\d+/g) || []).map(Number);
  if (!nums.length) return null;
  const max = Math.max(...nums);
  if (max <= 10) return "Pequeno";
  if (max <= 27) return "Médio";
  return "Grande";
}

function traduzirGrupoRaca(valor) {
  const grupo = String(valor || "").trim();
  if (!grupo) return grupo;

  return GRUPOS_TRADUZIDOS[grupo.toLowerCase()] || grupo;
}

function traduzirDescricaoMedida(valor) {
  return String(valor || "")
    .replace(/\bMale\b/gi, "Macho")
    .replace(/\bFemale\b/gi, "Fêmea")
    .replace(/\bmale\b/gi, "macho")
    .replace(/\bfemale\b/gi, "fêmea")
    .replace(/\byears\b/gi, "anos")
    .replace(/\byear\b/gi, "ano");
}

function traduzirExpectativaVida(valor) {
  const texto = traduzirDescricaoMedida(valor);
  if (!texto) return texto;
  if (/\bano\b|\banos\b/i.test(texto)) return texto;
  return `${texto} anos`;
}

function traduzirTemperamento(valor) {
  const itens = String(valor || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!itens.length) return "";

  return itens
    .map((item) => TEMPERAMENTOS_TRADUZIDOS[normalizarChaveTraducao(item)] || item)
    .join(", ");
}

export default function PetRegistrationScreen({ navigation, route }) {
  const { nomeUsuario, telefone, email, endereco, cep, fromPerfil, token: tokenRecebido } =
    route.params || {};

  const [nomePet, setNomePet] = useState("");
  const [sexo, setSexo] = useState("");
  const [fotoPet, setFotoPet] = useState(null);
  const [nomeRaca, setNomeRaca] = useState("");
  const [sugestoesIA, setSugestoesIA] = useState([]);
  const [infoDogApi, setInfoDogApi] = useState(null);
  const [porte, setPorte] = useState("");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [carregandoDogApi, setCarregandoDogApi] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [token, setToken] = useState(tokenRecebido || null);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);

  const debounceRef = useRef(null);
  const cacheInfoRacaRef = useRef(new Map());

  useEffect(() => {
    let ativo = true;

    if (tokenRecebido) {
      setToken(tokenRecebido);
    }

    AsyncStorage.getItem("@eleve:token_acesso").then((tokenSalvo) => {
      if (!ativo || !tokenSalvo) return;
      setToken(tokenSalvo);
    });

    return () => {
      ativo = false;
    };
  }, [tokenRecebido]);

  useEffect(() => {
    if (!fotoPet || !token) return;
    identificarRaca(fotoPet);
  }, [fotoPet, token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const uri = await AsyncStorage.getItem("@eleve:foto_pet_pendente");
      if (!uri) return;
      await AsyncStorage.removeItem("@eleve:foto_pet_pendente");
      setFotoPet(uri);
    });
    return unsubscribe;
  }, [navigation]);


  async function identificarRaca(imagemUri) {
    if (!imagemUri || !token) return;
    setCarregandoIA(true);
    setSugestoesIA([]);
    try {
      const sugestoes = await identificarRacaPorImagem({
        imagemUri,
        tokenAcesso: token,
      });
      const lista = sugestoes || [];
      setSugestoesIA(lista);
      if (lista.length > 0) {
        await selecionarSugestao(lista[0].raca);
      }
    } catch {
      // silencia erro de IA — não bloqueia o cadastro
    } finally {
      setCarregandoIA(false);
    }
  }

  async function selecionarSugestao(nome) {
    setNomeRaca(nome);
    await buscarDadosDogApi(nome);
  }

  async function buscarDadosDogApi(nome) {
    const nomeLimpo = (nome || "").trim();
    if (nomeLimpo.length < 2) return;

    const chaveConsulta = normalizarChaveConsultaRaca(nomeLimpo);
    if (cacheInfoRacaRef.current.has(chaveConsulta)) {
      const infoEmCache = cacheInfoRacaRef.current.get(chaveConsulta);
      setInfoDogApi(infoEmCache);
      if (infoEmCache && !porte) {
        const porteSugerido = inferirPorte(infoEmCache.peso);
        if (porteSugerido) setPorte(porteSugerido);
      }
      return;
    }

    setCarregandoDogApi(true);
    setInfoDogApi(null);
    try {
      const info = await buscarInfoRacaExterna(nomeLimpo);
      cacheInfoRacaRef.current.set(chaveConsulta, info || null);
      setInfoDogApi(info);
      if (info && !porte) {
        const porteSugerido = inferirPorte(info.peso);
        if (porteSugerido) setPorte(porteSugerido);
      }
    } catch {
      cacheInfoRacaRef.current.delete(chaveConsulta);
      // silencia — busca de dados externos não é obrigatória
    } finally {
      setCarregandoDogApi(false);
    }
  }

  function onRacaChange(valor) {
    setNomeRaca(valor);
    setInfoDogApi(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      buscarDadosDogApi(valor.trim());
    }, 800);
  }

  async function resolverRacaId(nome, porteId) {
    try {
      const raca = await buscarRacaPorNome({ nome, tokenAcesso: token });
      return raca.id;
    } catch {
      // raça não existe — cria automaticamente
      const novaRaca = await criarRaca({ nome, porteId, tokenAcesso: token });
      return novaRaca.id;
    }
  }

  function continuarAposCadastro() {
    setModalSucessoVisivel(false);

    if (fromPerfil) {
      navigation.navigate("Home", { screen: "PerfilTab" });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Home",
          params: {
            nomeUsuario,
            telefone,
            email,
            endereco,
            cep,
          },
        },
      ],
    });
  }

  async function finalizar() {
    if (!nomePet.trim()) {
      Alert.alert("Atenção", "Informe o nome do pet.");
      return;
    }
    if (!sexo) {
      Alert.alert("Atenção", "Selecione o sexo do pet.");
      return;
    }
    if (!fotoPet) {
      Alert.alert("Atenção", "Adicione uma foto do pet.");
      return;
    }
    if (!nomeRaca.trim()) {
      Alert.alert("Atenção", "Informe a raça do pet.");
      return;
    }
    if (!porte) {
      Alert.alert("Atenção", "Selecione o porte do pet.");
      return;
    }

    setSalvando(true);
    try {
      const clienteId = await obterOuSincronizarClienteId();
      const porteId = PORTE_PARA_ID[porte];
      const racaId = await resolverRacaId(nomeRaca.trim(), porteId);

      await cadastrarPet({
        nome: nomePet.trim(),
        racaId,
        clienteId,
        sexo,
        porteId,
        foto: fotoPet,
        tokenAcesso: token,
      });

      setModalSucessoVisivel(true);
    } catch (erro) {
      Alert.alert("Erro", erro?.message || "Não foi possível cadastrar o pet.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeScreen avoidKeyboard backgroundColor={COLORS.primary}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Cadastro do Pet 🐾</Text>
        <Text style={styles.subtitulo}>Conte-nos sobre seu amigo</Text>

        {/* Nome */}
        <Input
          label="Nome do Pet"
          value={nomePet}
          onChangeText={setNomePet}
          placeholder="Ex: Caramelo"
          autoCapitalize="words"
        />

        {/* Sexo */}
        <SelectionGroup
          label="Sexo"
          opcoes={OPCOES_SEXO}
          valor={sexo}
          onChange={setSexo}
        />

        {/* Foto */}
        <Text style={styles.label}>Foto do Pet</Text>
        <TouchableOpacity
          style={styles.photoUpload}
          onPress={() => navigation.navigate("UploadPhoto")}
          activeOpacity={0.8}
        >
          {fotoPet ? (
            <Image source={{ uri: fotoPet }} style={styles.previewImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <FontAwesome
                name="camera"
                size={36}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.photoPlaceholderText}>
                Toque para adicionar
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Raça */}
        <Input
          label="Raça"
          value={nomeRaca}
          onChangeText={onRacaChange}
          placeholder="Ex: Golden Retriever"
          autoCapitalize="words"
        />

        {/* IA carregando */}
        {carregandoIA && (
          <View style={styles.iaRow}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.iaText}>Identificando raça pela foto...</Text>
          </View>
        )}

        {/* Sugestões da IA */}
        {sugestoesIA.length > 0 && (
          <View style={styles.sugestoesBox}>
            <Text style={styles.sugestoesLabel}>Sugestões da IA</Text>
            <View style={styles.sugestoesRow}>
              {sugestoesIA.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.sugestaoBtn,
                    nomeRaca === s.raca && styles.sugestaoBtnAtivo,
                  ]}
                  onPress={() => selecionarSugestao(s.raca)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.sugestaoText,
                      nomeRaca === s.raca && styles.sugestaoTextAtivo,
                    ]}
                  >
                    {s.raca}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Dog API card */}
        {carregandoDogApi && (
          <View style={styles.dogApiCard}>
            <ActivityIndicator size="small" color={COLORS.primaryDark} />
          </View>
        )}
        {infoDogApi && !carregandoDogApi && (
          <View style={styles.dogApiCard}>
            <Text style={styles.dogApiTitulo}>Informações da Raça</Text>
            {infoDogApi.grupo && infoDogApi.grupo !== "Nao informado" && (
              <Text style={styles.dogApiLinha}>
                Grupo: {traduzirGrupoRaca(infoDogApi.grupo)}
              </Text>
            )}
            {infoDogApi.peso && infoDogApi.peso !== "Nao informado" && (
              <Text style={styles.dogApiLinha}>
                Peso (kg): {traduzirDescricaoMedida(infoDogApi.peso)}
              </Text>
            )}
            {infoDogApi.altura && infoDogApi.altura !== "Nao informado" && (
              <Text style={styles.dogApiLinha}>
                Altura (cm): {traduzirDescricaoMedida(infoDogApi.altura)}
              </Text>
            )}
            {infoDogApi.expectativaVida &&
              infoDogApi.expectativaVida !== "Nao informado" && (
                <Text style={styles.dogApiLinha}>
                  Expectativa de vida: {traduzirExpectativaVida(infoDogApi.expectativaVida)}
                </Text>
              )}
            {infoDogApi.temperamento &&
              infoDogApi.temperamento !== "Nao informado" && (
                <Text style={styles.dogApiLinha}>
                  Temperamento: {traduzirTemperamento(infoDogApi.temperamento)}
                </Text>
              )}
          </View>
        )}

        {/* Porte */}
        <SelectionGroup
          label="Porte"
          opcoes={OPCOES_PORTE}
          valor={porte}
          onChange={setPorte}
        />

        <Button
          title={salvando ? "Cadastrando..." : "Finalizar"}
          onPress={finalizar}
          disabled={salvando}
          style={{ marginTop: 32 }}
        />
      </ScrollView>

      <Modal
        visible={modalSucessoVisivel}
        transparent
        animationType="fade"
        onRequestClose={continuarAposCadastro}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <FontAwesome name="check" size={24} color={COLORS.primaryDark} />
            </View>

            {fotoPet ? (
              <Image source={{ uri: fotoPet }} style={styles.modalPetImage} />
            ) : (
              <View style={styles.modalPetPlaceholder}>
                <FontAwesome name="paw" size={28} color={COLORS.primaryDark} />
              </View>
            )}

            <Text style={styles.modalTitulo}>Pet cadastrado com sucesso</Text>
            <Text style={styles.modalDescricao}>
              {nomePet.trim() || "Seu pet"} já faz parte da Eleve. Agora está tudo pronto para continuar.
            </Text>

            <View style={styles.modalInfoGrid}>
              <View style={styles.modalInfoChip}>
                <Text style={styles.modalInfoLabel}>Raça</Text>
                <Text style={styles.modalInfoValue}>{nomeRaca.trim() || "Não informada"}</Text>
              </View>
              <View style={styles.modalInfoChip}>
                <Text style={styles.modalInfoLabel}>Porte</Text>
                <Text style={styles.modalInfoValue}>{porte || "Não informado"}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={continuarAposCadastro}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryButtonText}>
                {fromPerfil ? "Voltar ao perfil" : "Entrar no app"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 30,
    marginTop: SPACING.xxl,
    marginBottom: 4,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  subtitulo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: FONTS.regular,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.labelColor,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  photoUpload: {
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  iaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  iaText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.85)",
  },
  sugestoesBox: {
    marginTop: 10,
  },
  sugestoesLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.labelColor,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sugestoesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sugestaoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  sugestaoBtnAtivo: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  sugestaoText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  sugestaoTextAtivo: {
    color: COLORS.primaryDark,
  },
  dogApiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  dogApiTitulo: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  dogApiLinha: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12, 45, 53, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#0D3A45",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(85,168,145,0.22)",
  },
  modalPetImage: {
    width: 92,
    height: 92,
    borderRadius: 24,
    marginBottom: 18,
  },
  modalPetPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 24,
    marginBottom: 18,
    backgroundColor: COLORS.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitulo: {
    fontSize: 24,
    lineHeight: 30,
    color: COLORS.primaryDark,
    fontFamily: FONTS.extraBold,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescricao: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginBottom: 20,
  },
  modalInfoGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  modalInfoChip: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(26,95,110,0.08)",
  },
  modalInfoLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primaryMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  modalPrimaryButton: {
    width: "100%",
    backgroundColor: COLORS.primaryDark,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
