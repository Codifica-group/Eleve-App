import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import { listarInsightsAudio, listarInsightsRaca } from "../utils/insightsStorage";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { listarPetsPorCliente } from "../api/pets/listarPetsPorCliente";
import { listarPetsLocais, mesclarPetsLocaisComRemotos, salvarPetsLocais } from "../api/pets/cachePets";
import { buscarInfoRacaExterna } from "../api/racas/buscarInfoRacaExterna";
import AIBar from "../components/home/AIBar";

const MOCK_INFO_RACA_POR_NOME = {
  pug: {
    peso: "6 - 8 kg",
    expectativaVida: "12 - 15",
    temperamento: "Afetuoso, brincalhão, sociável, adaptável",
  },
  "golden retriever": {
    peso: "25 - 34 kg",
    expectativaVida: "10 - 12",
    temperamento: "Amigável, inteligente, confiável",
  },
};

const MOCK_INSIGHTS_RACA = [
  {
    id: "mock-raca-1",
    createdAt: "2026-05-24T10:00:00.000Z",
    petId: 1,
    nomePet: "Luna",
    nomeRaca: "Golden Retriever",
    porte: "Médio",
    infoRacaExterna: {
      peso: "25 - 34 kg",
      expectativaVida: "10 - 12",
      grupo: "sporting",
      temperamento: "Amigável, inteligente, confiável",
    },
    sugestoesIA: [{ raca: "Golden Retriever", probabilidade: 0.78 }],
    insightsByTopic: {
      saude: {
        nivelRisco: "baixo",
        bullets: [
          "Olhos e orelhas: observar vermelhidão e secreção após banho/passeios.",
          "Pele: coceira persistente pode indicar alergia ou dermatite — procure vet se durar 48h+.",
          "Vacinas e antiparasitário em dia reduzem riscos em passeios e creches.",
        ],
        acoesSugeridas: [
          { tipo: "checklist", label: "Checklist de saúde", destino: "PerfilTab" },
          { tipo: "agendar", label: "Agendar avaliação", destino: "AgendaTab" },
        ],
      },
      banho: {
        nivelRisco: "medio",
        bullets: [
          "Escovação pré-banho reduz nós e melhora a secagem (pelagem dupla).",
          "Secagem completa é essencial para evitar mau cheiro e fungos na base da pelagem.",
          "Frequência típica: a cada 15–30 dias, ajustando por rotina e sujeira.",
        ],
        acoesSugeridas: [{ tipo: "agendar", label: "Agendar banho", destino: "AgendaTab" }],
      },
      comportamento: {
        nivelRisco: "baixo",
        bullets: [
          "Tende a ser sociável: reforço positivo ajuda muito no treino básico.",
          "Rotina com passeios curtos e brincadeiras reduz ansiedade e destruição.",
        ],
        acoesSugeridas: [{ tipo: "conteudo", label: "Ver dicas de treino", destino: "HistoricoTab" }],
      },
      alimentacao: {
        nivelRisco: "medio",
        bullets: [
          "Controle de porção é importante (tendência a ganhar peso).",
          "Petiscos: limitar e priorizar os funcionais; água fresca sempre.",
        ],
        acoesSugeridas: [{ tipo: "conteudo", label: "Guia de porções", destino: "HistoricoTab" }],
      },
    },
  },
];

const MOCK_INSIGHTS_AUDIO = [
  {
    id: "mock-audio-1",
    createdAt: "2026-05-24T09:30:00.000Z",
    origem: "gravacao",
    topicoKey: "banho",
    perguntaTranscrita: "Por que o pug precisa de cuidado especial nas dobrinhas depois do banho?",
    entidades: { raca: "Pug", tema: ["pele", "dobrinhas", "banho"] },
    nivelRisco: "baixo",
    confianca: 0.78,
    resposta:
      "O Pug tende a ter dobras na pele e olhos mais sensíveis. Limpe as dobrinhas com gaze seca após o banho e evite shampoos muito perfumados. Se houver vermelhidão, mau cheiro ou coceira, procure um veterinário.",
    acoesSugeridas: [
      { tipo: "checklist", label: "Checklist pós-banho", destino: "HistoricoTab" },
      { tipo: "agendar", label: "Agendar banho", destino: "AgendaTab" },
    ],
  },
  {
    id: "mock-audio-2",
    createdAt: "2026-05-22T11:10:00.000Z",
    origem: "upload",
    topicoKey: "saude",
    perguntaTranscrita: "Meu cachorro está coçando muito depois do banho. Pode ser alergia?",
    entidades: { tema: ["coceira", "pele", "alergia"] },
    nivelRisco: "medio",
    confianca: 0.72,
    resposta:
      "Coceira após o banho pode acontecer por resíduo de shampoo, pele ressecada ou alergia. Garanta um enxágue bem completo, use produtos específicos para cães e observe se há vermelhidão, feridas ou mau cheiro. Se durar mais de 48h ou piorar, procure um veterinário.",
    acoesSugeridas: [
      { tipo: "checklist", label: "Checklist pele", destino: "HistoricoTab" },
      { tipo: "agendar", label: "Agendar avaliação", destino: "AgendaTab" },
    ],
  },
  {
    id: "mock-audio-3",
    createdAt: "2026-05-20T18:40:00.000Z",
    origem: "gravacao",
    topicoKey: "alimentacao",
    perguntaTranscrita: "Quantas vezes por dia eu devo dar ração e como saber a porção?",
    entidades: { tema: ["racao", "porcao", "rotina"] },
    nivelRisco: "baixo",
    confianca: 0.69,
    resposta:
      "A maioria dos cães se adapta bem a 2 refeições por dia. A porção depende do peso, idade, nível de atividade e da ração escolhida. Use a tabela do fabricante como ponto de partida e ajuste observando a condição corporal (costelas palpáveis sem excesso de gordura).",
    acoesSugeridas: [{ tipo: "conteudo", label: "Guia de porções", destino: "HistoricoTab" }],
  },
  {
    id: "mock-audio-4",
    createdAt: "2026-05-18T08:15:00.000Z",
    origem: "gravacao",
    topicoKey: "comportamento",
    perguntaTranscrita: "Meu cachorro late quando fico fora. Isso é ansiedade?",
    entidades: { tema: ["ansiedade", "latido", "sozinho"] },
    nivelRisco: "medio",
    confianca: 0.67,
    resposta:
      "Pode ser ansiedade de separação. Ajuda muito criar uma rotina de saídas curtas, enriquecimento ambiental (brinquedos recheáveis) e evitar despedidas longas. Se houver destruição intensa ou automutilação, procure orientação profissional.",
    acoesSugeridas: [{ tipo: "conteudo", label: "Plano anti-ansiedade", destino: "HistoricoTab" }],
  },
];

const TOPICOS = [
  { key: "resumo", label: "Resumo", icon: "th-large" },
  { key: "saude", label: "Saúde", icon: "heartbeat" },
  { key: "banho", label: "Banho", icon: "tint" },
  { key: "comportamento", label: "Comport.", icon: "paw" },
  { key: "alimentacao", label: "Aliment.", icon: "cutlery" },
];

function formatarDataCurta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function lerCampo(info, chave) {
  if (!info || typeof info !== "object") return "";
  const v = info[chave];
  const texto = v == null ? "" : String(v).trim();
  if (!texto) return "";
  const normalizado = normalizarTexto(texto);
  if (normalizado === "nao informado" || normalizado === "nao informada") return "";
  return texto;
}

function lerCampoMulti(info, chaves) {
  const lista = Array.isArray(chaves) ? chaves : [chaves];
  for (const chave of lista) {
    const valor = lerCampo(info, chave);
    if (valor) return valor;
  }
  return "";
}

function extrairTema(resposta) {
  const texto = String(resposta || "").trim();
  if (!texto) return "Pergunta por áudio";
  const primeiraLinha = texto.split("\n").map((l) => l.trim()).find(Boolean) || texto;
  return primeiraLinha.length > 58 ? `${primeiraLinha.slice(0, 58)}…` : primeiraLinha;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarChavePet(pet) {
  if (pet?.id) return `id:${pet.id}`;
  const nome = normalizarTexto(pet?.nome);
  return nome ? `nome:${nome}` : "";
}

function lerNomeRacaPet(pet) {
  if (!pet) return "";
  if (pet?.raca?.nome) return pet.raca.nome;
  if (typeof pet?.raca === "string") return pet.raca;
  return "";
}

function lerPortePet(pet) {
  if (!pet) return "";
  if (pet?.porte?.nome) return pet.porte.nome;
  if (typeof pet?.porte === "string") return pet.porte;
  return "";
}

function classificarRespostaAudio(resposta) {
  const texto = normalizarTexto(resposta);
  if (!texto) return "resumo";

  if (/(banho|tosa|shampoo|pelagem|secag|dobr)/.test(texto)) return "banho";
  if (/(racao|aliment|comida|petisco|peso|obes)/.test(texto)) return "alimentacao";
  if (/(ansied|latid|agress|trein|comport|medo)/.test(texto)) return "comportamento";
  if (/(coce|pele|olh|vomit|diarr|dor|febr|vet|doenc|alerg)/.test(texto)) return "saude";

  return "resumo";
}

function inferirTopicoAudio(item) {
  return item?.topicoKey || classificarRespostaAudio(item?.resposta);
}

function montarTituloTopico({ topicoKey, nomePet, plural }) {
  const base = {
    resumo: "Resumo",
    saude: "Saúde",
    banho: "Banho e Tosa",
    comportamento: "Comportamento",
    alimentacao: "Alimentação",
  }[topicoKey || "resumo"];

  if (nomePet) return `${base} da ${nomePet}`;
  if (plural) return `${base} dos seus pets`;
  return base;
}

function montarTituloAudio({ topicoKey }) {
  const base = {
    resumo: "Perguntas recentes",
    saude: "Dúvidas sobre saúde",
    banho: "Dúvidas sobre banho",
    comportamento: "Dúvidas de comportamento",
    alimentacao: "Dúvidas sobre alimentação",
  }[topicoKey || "resumo"];

  return base;
}

function gerarDicas({ nomeRaca, porte, topicoKey, maxItems }) {
  const raca = String(nomeRaca || "").toLowerCase();
  const dicas = [];
  const limite = Number.isFinite(maxItems) ? Math.max(1, maxItems) : 4;

  if (topicoKey === "saude") {
    if (raca.includes("pug") || raca.includes("bulldog") || raca.includes("shih")) {
      dicas.push("Dobrinha/pele: limpe e seque bem para evitar assaduras e fungos.");
    }
    dicas.push("Observe sinais: coceira, vermelhidão, mau cheiro e lambedura excessiva.");
    dicas.push("Se persistir por 48h ou piorar, procure um veterinário.");
    return dicas.slice(0, limite);
  }

  if (topicoKey === "alimentacao") {
    dicas.push("Mantenha ração de boa qualidade e água fresca sempre disponível.");
    dicas.push("Evite petiscos em excesso e ajuste a porção conforme peso/porte.");
    dicas.push("Mudanças na dieta devem ser graduais (3–7 dias) para evitar desconforto.");
    return dicas.slice(0, limite);
  }

  if (topicoKey === "comportamento") {
    dicas.push("Rotina previsível e passeios curtos ajudam a reduzir estresse.");
    dicas.push("Reforce o bom comportamento com recompensa imediata (petisco/brinquedo).");
    dicas.push("Se houver medo/ansiedade intensa, considere orientação de adestrador/vet.");
    return dicas.slice(0, limite);
  }

  if (porte === "Pequeno") {
    dicas.push("Use água morna e seque bem (principalmente patas e orelhas).");
    dicas.push("Prefira banho mais frequente e rápido quando sujar, evitando excesso de produto.");
  }

  if (porte === "Médio") {
    dicas.push("Escovação antes do banho ajuda a reduzir nós e facilita a secagem.");
    dicas.push("Secagem completa reduz risco de mau cheiro e dermatites.");
  }

  if (porte === "Grande") {
    dicas.push("Atenção à secagem da pelagem mais densa (use toalha + secador em temperatura morna).");
    dicas.push("Divida o banho em etapas para reduzir estresse e garantir enxágue total.");
  }

  if (raca.includes("pug") || raca.includes("bulldog") || raca.includes("shih")) {
    dicas.unshift("Cuide das dobras: limpe e seque bem para evitar assaduras e fungos.");
  }

  if (!dicas.length) {
    dicas.push("Observe pele e orelhas após o banho: vermelhidão e coceira são sinais de atenção.");
    dicas.push("Prefira shampoos próprios para cães e enxágue até a água sair totalmente limpa.");
  }

  return dicas.slice(0, limite);
}

function obterBulletsInsight({ insight, topicoKey, maxItems }) {
  const limite = Number.isFinite(maxItems) ? Math.max(1, maxItems) : 4;
  const bullets = insight?.insightsByTopic?.[topicoKey]?.bullets;
  if (Array.isArray(bullets) && bullets.length) return bullets.slice(0, limite);

  return gerarDicas({
    nomeRaca: insight?.nomeRaca,
    porte: insight?.porte,
    topicoKey,
    maxItems: limite,
  });
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [insightsRaca, setInsightsRaca] = useState([]);
  const [insightsAudio, setInsightsAudio] = useState([]);
  const [petsLista, setPetsLista] = useState([]);
  const [infoRacaCache, setInfoRacaCache] = useState({});
  const [petKey, setPetKey] = useState(null);
  const [topicoKey, setTopicoKey] = useState("resumo");
  const [audioSelecionado, setAudioSelecionado] = useState(null);
  const carregandoInfoRef = useRef(new Set());

  async function carregar() {
    const [racaSalvos, audioSalvos] = await Promise.all([
      listarInsightsRaca(),
      listarInsightsAudio(),
    ]);

    setInsightsRaca(racaSalvos.length ? racaSalvos : MOCK_INSIGHTS_RACA);
    setInsightsAudio(audioSalvos.length ? audioSalvos : MOCK_INSIGHTS_AUDIO);

    try {
      const clienteId = await obterOuSincronizarClienteId();
      const tokenAcesso = await AsyncStorage.getItem("@eleve:token_acesso");
      const [locais, remotos] = await Promise.all([
        listarPetsLocais(clienteId),
        listarPetsPorCliente({ clienteId, tokenAcesso }),
      ]);

      const mesclados = mesclarPetsLocaisComRemotos(locais, remotos);
      await salvarPetsLocais(clienteId, mesclados);
      setPetsLista(mesclados);
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    carregar();
    const unsub = navigation.addListener("focus", carregar);
    return unsub;
  }, [navigation]);

  const pets = useMemo(() => {
    if (petsLista.length) {
      return petsLista
        .map((pet) => ({
          key: criarChavePet(pet),
          nome: pet?.nome || "Pet",
          nomeRaca: lerNomeRacaPet(pet),
          porte: lerPortePet(pet),
        }))
        .filter((pet) => pet.key);
    }

    const base = insightsRaca.length ? insightsRaca : MOCK_INSIGHTS_RACA;
    const mapa = new Map();

    for (const item of base) {
      const key = item.petId ? `id:${item.petId}` : `nome:${normalizarTexto(item.nomePet || item.nomeRaca)}`;
      if (mapa.has(key)) continue;
      mapa.set(key, {
        key,
        nome: item.nomePet || item.nomeRaca || "Pet",
        nomeRaca: item.nomeRaca,
        porte: item.porte,
      });
    }

    return Array.from(mapa.values());
  }, [insightsRaca, petsLista]);

  const petsComTodos = useMemo(() => {
    if (pets.length > 1) return [{ key: "__todos__", nome: "Todos" }, ...pets];
    return pets;
  }, [pets]);

  useEffect(() => {
    if (petKey) return;
    if (!pets.length) return;
    setPetKey(pets.length > 1 ? "__todos__" : pets[0].key);
  }, [petKey, pets]);

  const insightsPorPet = useMemo(() => {
    const base = insightsRaca.length ? insightsRaca : MOCK_INSIGHTS_RACA;
    const mapa = new Map();

    for (const item of base) {
      const key = item.petId ? `id:${item.petId}` : `nome:${normalizarTexto(item.nomePet || item.nomeRaca)}`;
      const atual = mapa.get(key);
      if (!atual) {
        mapa.set(key, item);
        continue;
      }
      const d1 = new Date(atual.createdAt || 0).getTime();
      const d2 = new Date(item.createdAt || 0).getTime();
      if (d2 >= d1) mapa.set(key, item);
    }

    return Array.from(mapa.entries()).map(([key, item]) => ({ key, item }));
  }, [insightsRaca]);

  const selecionado = useMemo(() => {
    if (!petKey) return null;
    return pets.find((p) => p.key === petKey) || null;
  }, [petKey, pets]);

  async function garantirInfoRaca(nomeRaca) {
    const chave = normalizarTexto(nomeRaca);
    if (!chave) return;
    if (infoRacaCache[chave]) return;
    if (carregandoInfoRef.current.has(chave)) return;
    carregandoInfoRef.current.add(chave);
    try {
      const info = await buscarInfoRacaExterna(nomeRaca);
      if (info) {
        setInfoRacaCache((prev) => ({ ...prev, [chave]: info }));
      }
    } catch {
      // silencioso
    } finally {
      carregandoInfoRef.current.delete(chave);
    }
  }

  useEffect(() => {
    if (!pets.length) return;
    if (petKey === "__todos__") {
      pets.forEach((p) => garantirInfoRaca(p.nomeRaca));
      return;
    }
    const alvo = pets.find((p) => p.key === petKey) || pets[0];
    garantirInfoRaca(alvo?.nomeRaca);
  }, [petKey, pets]);

  const tituloTopico = useMemo(() => {
    return montarTituloTopico({
      topicoKey,
      nomePet: petKey && petKey !== "__todos__" ? selecionado?.nome : null,
      plural: petKey === "__todos__",
    });
  }, [petKey, selecionado, topicoKey]);

  const promptPainel = useMemo(() => {
    const topico = TOPICOS.find((t) => t.key === topicoKey)?.label || "Resumo";
    const base =
      "Você é um veterinário experiente e especialista em saúde, nutrição e comportamento de cachorros. Escute a dúvida do usuário e responda de forma clara, acolhedora, objetiva e altamente profissional.";

    if (petKey === "__todos__") {
      return `${base}\n\nContexto: Usuária está no Painel Inteligente.\nTópico selecionado: ${topico}.\nResponda com passos práticos e sinais de alerta quando fizer sentido.`;
    }

    const nomePet = selecionado?.nome || "Pet";
    const raca = selecionado?.nomeRaca || "";
    const porte = selecionado?.porte || "";

    return `${base}\n\nContexto do painel:\nPet: ${nomePet}${raca ? ` (${raca})` : ""}${porte ? ` · Porte ${porte}` : ""}\nTópico selecionado: ${topico}.\nResponda focando nesse tópico e use linguagem simples.`;
  }, [petKey, selecionado, topicoKey]);

  const insightsAudioFiltrados = useMemo(() => {
    if (topicoKey === "resumo") return insightsAudio;
    const filtrados = insightsAudio.filter((i) => inferirTopicoAudio(i) === topicoKey);
    return filtrados.length ? filtrados : insightsAudio;
  }, [insightsAudio, topicoKey]);

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={14} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Painel Inteligente</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuRow}
        >
          {TOPICOS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.menuChip, topicoKey === t.key && styles.menuChipAtivo]}
              onPress={() => setTopicoKey(t.key)}
              activeOpacity={0.8}
            >
              <FontAwesome
                name={t.icon}
                size={13}
                color={topicoKey === t.key ? COLORS.white : COLORS.primaryDark}
              />
              <Text style={[styles.menuChipText, topicoKey === t.key && styles.menuChipTextAtivo]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SectionTitle label={tituloTopico} iconName="lightbulb-o" />

        {petsComTodos.length > 0 && (
          <View style={styles.petRow}>
            {petsComTodos.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.chip, petKey === p.key && styles.chipAtivo]}
                onPress={() => setPetKey(p.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, petKey === p.key && styles.chipTextAtivo]}>
                  {p.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {petKey === "__todos__" ? (
          <View style={styles.secao}>
            {insightsPorPet.map(({ key, item }) => (
              <InsightRacaCard key={key} insight={item} topicoKey={topicoKey} infoRacaCache={infoRacaCache} />
            ))}
          </View>
        ) : (
          <InsightRacaCard
            insight={insightsPorPet.find((p) => p.key === petKey)?.item || insightsPorPet[0]?.item}
            topicoKey={topicoKey}
            infoRacaCache={infoRacaCache}
          />
        )}

        <SectionTitle label={montarTituloAudio({ topicoKey })} iconName="microphone" />

        <View style={styles.secao}>
          {insightsAudioFiltrados.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.audioCard}
              activeOpacity={0.75}
              onPress={() => setAudioSelecionado(item)}
            >
              <View style={styles.audioIcon}>
                <FontAwesome name="commenting-o" size={16} color={COLORS.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioTitulo} numberOfLines={2}>
                  {String(item.perguntaTranscrita || "").trim() || extrairTema(item.resposta)}
                </Text>
                <Text style={styles.audioMeta}>
                  {item.origem === "upload" ? "Áudio enviado" : "Áudio gravado"} ·{" "}
                  {formatarDataCurta(item.createdAt)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={COLORS.primaryMedium} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!audioSelecionado}
        transparent
        animationType="fade"
        onRequestClose={() => setAudioSelecionado(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAudioSelecionado(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Resposta da SophIA</Text>
              <TouchableOpacity onPress={() => setAudioSelecionado(null)} hitSlop={10}>
                <FontAwesome name="times" size={18} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Markdown style={markdownStyles}>{audioSelecionado?.resposta || ""}</Markdown>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.fabWrap}>
        <AIBar
          variant="fab"
          promptOverride={promptPainel}
          insightExtras={{
            origemTela: "dashboard",
            topicoKey,
            petKey: petKey || null,
          }}
        />
      </View>
    </View>
  );
}

function SectionTitle({ label, iconName }) {
  return (
    <View style={styles.secaoHeader}>
      <View style={styles.secaoAccent} />
      <FontAwesome name={iconName} size={13} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
      <Text style={styles.secaoTitulo}>{label}</Text>
    </View>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <View style={styles.pill}>
      <FontAwesome name={icon} size={14} color={COLORS.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function InsightRacaCard({ insight, topicoKey, infoRacaCache }) {
  if (!insight) return null;
  const infoMock = insight?.nomeRaca ? MOCK_INFO_RACA_POR_NOME[normalizarTexto(insight.nomeRaca)] : null;
  const infoExterna =
    insight?.infoRacaExterna || (insight?.nomeRaca ? infoRacaCache?.[normalizarTexto(insight.nomeRaca)] : null);
  const peso = lerCampoMulti(infoExterna, ["peso", "weight"]) || lerCampoMulti(infoMock, ["peso", "weight"]);
  const expectativa =
    lerCampoMulti(infoExterna, ["expectativaVida", "expectativa_vida", "life_span"]) ||
    lerCampoMulti(infoMock, ["expectativaVida", "expectativa_vida", "life_span"]);
  const temperamento =
    lerCampoMulti(infoExterna, ["temperamento", "temperament"]) ||
    lerCampoMulti(infoMock, ["temperamento", "temperament"]);

  const blocos =
    topicoKey === "resumo"
      ? [
          { key: "saude", titulo: "Saúde" },
          { key: "banho", titulo: "Banho e Tosa" },
          { key: "comportamento", titulo: "Comportamento" },
          { key: "alimentacao", titulo: "Alimentação" },
        ].map((b) => ({
          ...b,
          dicas: obterBulletsInsight({ insight, topicoKey: b.key, maxItems: 2 }),
        }))
      : [
          {
            key: topicoKey || "resumo",
            titulo: {
              saude: "Pontos de saúde",
              banho: "Banho e cuidados",
              comportamento: "Comportamento",
              alimentacao: "Alimentação",
              resumo: "Dicas rápidas",
            }[topicoKey || "resumo"],
            dicas: obterBulletsInsight({ insight, topicoKey, maxItems: 4 }),
          },
        ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <FontAwesome name="paw" size={18} color={COLORS.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>
            {insight.nomePet ? `${insight.nomePet} · ${insight.nomeRaca}` : insight.nomeRaca}
          </Text>
          <Text style={styles.cardSubtitulo}>
            Porte: {insight.porte || "—"} · Peso: {peso || "—"}
          </Text>
        </View>
        <Text style={styles.dataChip}>{formatarDataCurta(insight.createdAt)}</Text>
      </View>

      <View style={styles.grid}>
        <InfoPill
          icon="heartbeat"
          label="Expectativa"
          value={expectativa || "—"}
        />
        <InfoPill
          icon="users"
          label="Temperamento"
          value={temperamento || "—"}
        />
      </View>

      {blocos.map((bloco) => (
        <View key={bloco.key} style={styles.bloco}>
          <Text style={styles.blocoTitulo}>{bloco.titulo}</Text>
          <View style={styles.lista}>
            {bloco.dicas.map((dica) => (
              <View key={`${bloco.key}:${dica}`} style={styles.listaItem}>
                <View style={styles.bullet} />
                <Text style={styles.listaTexto}>{dica}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
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
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 6,
    paddingBottom: SPACING.xxl,
  },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  secaoAccent: {
    width: 3,
    height: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  secaoTitulo: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  secao: {
    gap: 10,
  },
  menuRow: {
    paddingTop: 6,
    paddingBottom: 6,
    gap: 10,
  },
  menuChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  menuChipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  menuChipText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  menuChipTextAtivo: {
    color: COLORS.white,
  },
  petRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  chipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primaryMedium,
  },
  chipTextAtivo: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitulo: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  cardSubtitulo: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginTop: 2,
  },
  dataChip: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  pill: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
  },
  pillLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  pillValue: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginTop: 2,
    lineHeight: 15,
  },
  blocoTitulo: {
    fontSize: 13,
    fontFamily: FONTS.extraBold,
    color: COLORS.dark,
    marginBottom: 10,
  },
  bloco: {
    marginBottom: 14,
  },
  lista: {
    gap: 8,
  },
  listaItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  listaTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    lineHeight: 16,
  },
  audioCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.blueLight,
    justifyContent: "center",
    alignItems: "center",
  },
  audioTitulo: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.dark,
    marginBottom: 3,
  },
  audioMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
  },
  fabWrap: {
    position: "absolute",
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});

const markdownStyles = {
  body: {
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    fontSize: 15,
    lineHeight: 22,
  },
  strong: {
    fontFamily: FONTS.bold,
  },
  heading1: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: COLORS.primaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 4,
    marginBottom: 10,
  },
};
