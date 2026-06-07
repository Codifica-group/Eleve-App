import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FontAwesome } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";
import { obterOuSincronizarClienteId } from "../api/clientes/sincronizarCliente";
import { buscarInfoRacaExterna } from "../api/racas/buscarInfoRacaExterna";
import AIBar from "../components/home/AIBar";


const TOPICOS = [
  { key: "resumo", icon: "th-large" },
  { key: "saude", icon: "heartbeat" },
  { key: "banho", icon: "tint" },
  { key: "comportamento", icon: "paw" },
  { key: "alimentacao", icon: "cutlery" },
];

const PERIODOS = [
  { key: "hoje" },
  { key: "7d" },
  { key: "30d" },
  { key: "tudo" },
];

const ORDENACOES = [
  { key: "relevancia" },
  { key: "recentes" },
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

function extrairTema(resposta, t) {
  const texto = String(resposta || "").trim();
  if (!texto) return t("dashboard.audio.defaultTheme");
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

function filtrarPorPeriodo(lista, periodoKey) {
  if (!Array.isArray(lista)) return [];
  if (!periodoKey || periodoKey === "tudo") return lista;

  const agora = new Date();
  let inicio = null;

  if (periodoKey === "hoje") {
    inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
  } else if (periodoKey === "7d") {
    inicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (periodoKey === "30d") {
    inicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (!inicio) return lista;
  return lista.filter((item) => {
    const d = new Date(item?.createdAt);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() >= inicio.getTime();
  });
}

function pesoRisco(valor) {
  const t = normalizarTexto(valor);
  if (t === "alto") return 3;
  if (t === "medio") return 2;
  if (t === "baixo") return 1;
  return 0;
}

function prioridadeInsightRaca(insight, topicoKey) {
  if (!insight?.insightsByTopic) return 0;
  if (topicoKey && topicoKey !== "resumo") {
    return pesoRisco(insight?.insightsByTopic?.[topicoKey]?.nivelRisco);
  }
  return Math.max(
    pesoRisco(insight?.insightsByTopic?.saude?.nivelRisco),
    pesoRisco(insight?.insightsByTopic?.banho?.nivelRisco),
    pesoRisco(insight?.insightsByTopic?.comportamento?.nivelRisco),
    pesoRisco(insight?.insightsByTopic?.alimentacao?.nivelRisco),
  );
}

function montarTituloTopico({ topicoKey, nomePet, plural }, t) {
  const base = t(`dashboard.topicsTitles.${topicoKey || "resumo"}`);

  if (nomePet) return t("dashboard.topicsTitles.ofPet", { topic: base, name: nomePet });
  if (plural) return t("dashboard.topicsTitles.plural", { topic: base });
  return base;
}

function montarTituloAudio({ topicoKey }, t) {
  return t(`dashboard.audioTitles.${topicoKey || "resumo"}`);
}

function gerarDicas({ nomeRaca, porte, topicoKey, maxItems }, t) {
  const raca = String(nomeRaca || "").toLowerCase();
  const dicas = [];
  const limite = Number.isFinite(maxItems) ? Math.max(1, maxItems) : 4;

  if (topicoKey === "saude") {
    if (raca.includes("pug") || raca.includes("bulldog") || raca.includes("shih")) {
      dicas.push(t("dashboard.tips.health.folds"));
    }
    dicas.push(t("dashboard.tips.health.signs"));
    dicas.push(t("dashboard.tips.health.vet"));
    return dicas.slice(0, limite);
  }

  if (topicoKey === "alimentacao") {
    dicas.push(t("dashboard.tips.feed.quality"));
    dicas.push(t("dashboard.tips.feed.snacks"));
    dicas.push(t("dashboard.tips.feed.changes"));
    return dicas.slice(0, limite);
  }

  if (topicoKey === "comportamento") {
    dicas.push(t("dashboard.tips.behavior.routine"));
    dicas.push(t("dashboard.tips.behavior.reward"));
    dicas.push(t("dashboard.tips.behavior.fear"));
    return dicas.slice(0, limite);
  }

  if (porte === "Pequeno") {
    dicas.push(t("dashboard.tips.size.small.bath"));
    dicas.push(t("dashboard.tips.size.small.freq"));
  }

  if (porte === "Médio") {
    dicas.push(t("dashboard.tips.size.medium.brush"));
    dicas.push(t("dashboard.tips.size.medium.dry"));
  }

  if (porte === "Grande") {
    dicas.push(t("dashboard.tips.size.large.dry"));
    dicas.push(t("dashboard.tips.size.large.steps"));
  }

  if (raca.includes("pug") || raca.includes("bulldog") || raca.includes("shih")) {
    dicas.unshift(t("dashboard.tips.default.folds"));
  }

  if (!dicas.length) {
    dicas.push(t("dashboard.tips.default.skin"));
    dicas.push(t("dashboard.tips.default.shampoo"));
  }

  return dicas.slice(0, limite);
}

function obterBulletsInsight({ insight, topicoKey, maxItems }, t) {
  const limite = Number.isFinite(maxItems) ? Math.max(1, maxItems) : 4;
  const bullets = insight?.insightsByTopic?.[topicoKey]?.bullets;
  if (Array.isArray(bullets) && bullets.length) return bullets.slice(0, limite);

  return gerarDicas({
    nomeRaca: insight?.nomeRaca,
    porte: insight?.porte,
    topicoKey,
    maxItems: limite,
  }, t);
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [insightsRaca, setInsightsRaca] = useState([]);
  const [insightsAudio, setInsightsAudio] = useState([]);
  const [petsLista, setPetsLista] = useState([]);
  const [infoRacaCache, setInfoRacaCache] = useState({});
  const [petKey, setPetKey] = useState(null);
  const [topicoKey, setTopicoKey] = useState("resumo");
  const [periodoKey, setPeriodoKey] = useState("30d");
  const [ordenacaoKey, setOrdenacaoKey] = useState("relevancia");
  const [audioSelecionado, setAudioSelecionado] = useState(null);
  const carregandoInfoRef = useRef(new Set());

  async function carregar() {
    const clienteId = await obterOuSincronizarClienteId();
    const tokenAcesso = await AsyncStorage.getItem("@eleve:token_acesso");

    try {
      const resposta = await fetch(`${BACKEND_URL}/api/dashboard/cliente/${clienteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(tokenAcesso ? { Authorization: `Bearer ${tokenAcesso}` } : {}),
        },
      });

      if (!resposta.ok) {
        throw new Error(`Erro ao carregar dashboard: ${resposta.status}`);
      }

      const dados = await resposta.json();
      setInsightsRaca(dados.insightsRaca || []);
      setInsightsAudio(dados.insightsAudio || []);
      setPetsLista(dados.pets || []);
    } catch (error) {
      console.warn("Falha ao carregar dashboard do backend", error);
      setInsightsRaca([]);
      setInsightsAudio([]);
      setPetsLista([]);
    }
  }

  useEffect(() => {
    carregar();
    const unsub = navigation.addListener("focus", carregar);
    return unsub;
  }, [navigation]);

  const pets = useMemo(() => {
    if (!petsLista.length) return [];

    return petsLista
      .map((pet) => ({
        key: criarChavePet(pet),
        nome: pet?.nome || "Pet",
        nomeRaca: lerNomeRacaPet(pet),
        porte: lerPortePet(pet),
      }))
      .filter((pet) => pet.key);
  }, [petsLista]);

  const petsComTodos = useMemo(() => {
    if (pets.length > 1) return [{ key: "__todos__", nome: t("dashboard.allPets") }, ...pets];
    return pets;
  }, [pets, t]);

  useEffect(() => {
    if (petKey) return;
    if (!pets.length) return;
    setPetKey(pets.length > 1 ? "__todos__" : pets[0].key);
  }, [petKey, pets]);

  const insightsRacaPeriodo = useMemo(() => filtrarPorPeriodo(insightsRaca, periodoKey), [insightsRaca, periodoKey]);

  const insightsAudioPeriodo = useMemo(() => filtrarPorPeriodo(insightsAudio, periodoKey), [insightsAudio, periodoKey]);

  const insightsPorPet = useMemo(() => {
    const mapa = new Map();

    for (const item of insightsRacaPeriodo) {
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

    const lista = Array.from(mapa.entries()).map(([key, item]) => ({ key, item }));

    lista.sort((a, b) => {
      if (ordenacaoKey === "relevancia") {
        const pa = prioridadeInsightRaca(a.item, topicoKey);
        const pb = prioridadeInsightRaca(b.item, topicoKey);
        if (pb !== pa) return pb - pa;
      }
      const da = new Date(a.item.createdAt);
      const db = new Date(b.item.createdAt);
      return db.getTime() - da.getTime();
    });

    return lista;
  }, [insightsRacaPeriodo, ordenacaoKey, topicoKey]);

  const selecionado = useMemo(() => pets.find((p) => p.key === petKey) || null, [petKey, pets]);

  async function garantirInfoRaca(nomeRaca) {
    const chave = normalizarTexto(nomeRaca);
    if (!chave) return;
    if (infoRacaCache[chave]) return;
    if (carregandoInfoRef.current.has(chave)) return;
    carregandoInfoRef.current.add(chave);
    try {
      const info = await buscarInfoRacaExterna(nomeRaca);
      if (info) setInfoRacaCache((prev) => ({ ...prev, [chave]: info }));
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

  const tituloTopico = useMemo(
    () =>
      montarTituloTopico({
        topicoKey,
        nomePet: petKey && petKey !== "__todos__" ? selecionado?.nome : null,
        plural: petKey === "__todos__",
      }, t),
    [petKey, selecionado, topicoKey, t],
  );

  const promptPainel = useMemo(() => {
    const topico = t(`dashboard.topics.${topicoKey || "resumo"}`);
    const base = t("dashboard.prompt.base");

    if (petKey === "__todos__") {
      return `${base}\n\n${t("dashboard.prompt.allPets", { topic: topico })}`;
    }

    const nomePet = selecionado?.nome || "Pet";
    const raca = selecionado?.nomeRaca || "";
    const porte = selecionado?.porte || "";

    const breedInfo = raca ? ` (${raca})` : "";
    const sizeInfo = porte ? ` · Porte ${porte}` : "";

    return `${base}\n\n${t("dashboard.prompt.singlePet", { name: nomePet, breedInfo, sizeInfo, topic: topico })}`;
  }, [petKey, selecionado, topicoKey, t]);

  const insightsAudioFiltrados = useMemo(() => {
    const base = insightsAudioPeriodo;
    const filtradoTopico = topicoKey === "resumo" ? base : base.filter((i) => inferirTopicoAudio(i) === topicoKey);

    const lista = [...(filtradoTopico.length ? filtradoTopico : base)];
    lista.sort((a, b) => {
      if (ordenacaoKey === "relevancia") {
        const ra = pesoRisco(a?.nivelRisco);
        const rb = pesoRisco(b?.nivelRisco);
        if (rb !== ra) return rb - ra;
      }
      const da = new Date(a?.createdAt);
      const db = new Date(b?.createdAt);
      return db.getTime() - da.getTime();
    });
    return lista;
  }, [insightsAudioPeriodo, ordenacaoKey, topicoKey]);

  return (
    <View style={[styles.tela, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={14} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.titulo}>{t("dashboard.title")}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuRow}>
          {TOPICOS.map((tItem) => (
            <TouchableOpacity
              key={tItem.key}
              style={[styles.menuChip, topicoKey === tItem.key && styles.menuChipAtivo]}
              onPress={() => setTopicoKey(tItem.key)}
              activeOpacity={0.8}
            >
              <FontAwesome name={tItem.icon} size={13} color={topicoKey === tItem.key ? COLORS.white : COLORS.primaryDark} />
              <Text style={[styles.menuChipText, topicoKey === tItem.key && styles.menuChipTextAtivo]}>{t(`dashboard.topics.${tItem.key}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filtrosRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosConteudo}>
            {PERIODOS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.filtroChip, periodoKey === p.key && styles.filtroChipAtivo]}
                onPress={() => setPeriodoKey(p.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filtroChipText, periodoKey === p.key && styles.filtroChipTextAtivo]}>
                  {t(`dashboard.periods.${p.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.ordenacaoChip}
            onPress={() => setOrdenacaoKey((v) => (v === "relevancia" ? "recentes" : "relevancia"))}
            activeOpacity={0.85}
          >
            <FontAwesome name="sort" size={13} color={COLORS.primaryDark} />
            <Text style={styles.ordenacaoTexto}>
              {ordenacaoKey ? t(`dashboard.sort.${ordenacaoKey}`) : t("dashboard.sort.default")}
            </Text>
          </TouchableOpacity>
        </View>

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
                <Text style={[styles.chipText, petKey === p.key && styles.chipTextAtivo]}>{p.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {insightsPorPet.length === 0 ? (
          <EmptyState title={t("dashboard.empty.insights.title")} subtitle={t("dashboard.empty.insights.subtitle")} />
        ) : petKey === "__todos__" ? (
          <View style={styles.secao}>
            {insightsPorPet.map(({ key, item }) => (
              <InsightRacaCard key={key} insight={item} topicoKey={topicoKey} infoRacaCache={infoRacaCache} />
            ))}
          </View>
        ) : (
          <InsightRacaCard insight={insightsPorPet.find((p) => p.key === petKey)?.item || insightsPorPet[0]?.item} topicoKey={topicoKey} infoRacaCache={infoRacaCache} />
        )}

        <SectionTitle label={montarTituloAudio({ topicoKey }, t)} iconName="microphone" />

        {insightsAudioFiltrados.length === 0 ? (
          <EmptyState title={t("dashboard.empty.audio.title")} subtitle={t("dashboard.empty.audio.subtitle")} />
        ) : (
          <View style={styles.secao}>
            {insightsAudioFiltrados.map((item) => (
              <TouchableOpacity key={item.id} style={styles.audioCard} activeOpacity={0.75} onPress={() => setAudioSelecionado(item)}>
                <View style={styles.audioIcon}>
                  <FontAwesome name="commenting-o" size={16} color={COLORS.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.audioTitulo} numberOfLines={2}>
                    {String(item.perguntaTranscrita || "").trim() || extrairTema(item.resposta, t)}
                  </Text>
                  <Text style={styles.audioMeta}>
                    {item.origem === "upload" ? t("dashboard.audio.uploaded") : t("dashboard.audio.recorded")} · {formatarDataCurta(item.createdAt)}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={COLORS.primaryMedium} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!audioSelecionado} transparent animationType="fade" onRequestClose={() => setAudioSelecionado(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAudioSelecionado(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{t("dashboard.audio.modalTitle")}</Text>
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

function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
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
  const { t } = useTranslation();
  if (!insight) return null;
  const infoExterna = insight?.infoRacaExterna || (insight?.nomeRaca ? infoRacaCache?.[normalizarTexto(insight.nomeRaca)] : null);
  const peso = lerCampoMulti(infoExterna, ["peso", "weight"]);
  const expectativa = lerCampoMulti(infoExterna, ["expectativaVida", "expectativa_vida", "life_span"]);
  const temperamento = lerCampoMulti(infoExterna, ["temperamento", "temperament"]);

  const blocos =
    topicoKey === "resumo"
      ? [
          { key: "saude", titulo: t("dashboard.blocks.health") },
          { key: "banho", titulo: t("dashboard.blocks.bath") },
          { key: "comportamento", titulo: t("dashboard.blocks.behavior") },
          { key: "alimentacao", titulo: t("dashboard.blocks.feeding") },
        ].map((b) => ({
          ...b,
          dicas: obterBulletsInsight({ insight, topicoKey: b.key, maxItems: 2 }, t),
        }))
      : [
          {
            key: topicoKey || "resumo",
            titulo: {
              saude: t("dashboard.blocks.health"),
              banho: t("dashboard.blocks.bath"),
              comportamento: t("dashboard.blocks.behavior"),
              alimentacao: t("dashboard.blocks.feeding"),
              resumo: t("dashboard.blocks.summary"),
            }[topicoKey || "resumo"],
            dicas: obterBulletsInsight({ insight, topicoKey, maxItems: 4 }, t),
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
          <Text style={styles.cardSubtitulo}>{t("dashboard.card.size")}{insight.porte || t("dashboard.card.notInformed")} · {t("dashboard.card.weight")}{peso || t("dashboard.card.notInformed")}</Text>
        </View>
        <Text style={styles.dataChip}>{formatarDataCurta(insight.createdAt)}</Text>
      </View>

      <View style={styles.grid}>
        <InfoPill icon="heartbeat" label={t("dashboard.card.expectancy")} value={expectativa || t("dashboard.card.notInformed")} />
        <InfoPill icon="users" label={t("dashboard.card.temperament")} value={temperamento || t("dashboard.card.notInformed")} />
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
  filtrosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  filtrosConteudo: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 6,
  },
  filtroChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  filtroChipAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filtroChipText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.primaryMedium,
  },
  filtroChipTextAtivo: {
    color: COLORS.white,
  },
  ordenacaoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.blueLight,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  ordenacaoTexto: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
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
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    lineHeight: 16,
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