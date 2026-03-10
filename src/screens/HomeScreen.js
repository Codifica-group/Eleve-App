import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CAROUSEL_W = width - 48;

const SERVICOS = [
  { key: "banho",      label: "Banho",      icon: require("../../assets/logo_banho.png"),      cor: "#D8EFF8", sombra: "#6FB4C7" },
  { key: "tosa",       label: "Tosa",       icon: require("../../assets/logo_tosa.png"),       cor: "#D4EDE7", sombra: "#55A891" },
  { key: "hidratacao", label: "Hidratação", icon: require("../../assets/logo_hidratacao.png"), cor: "#F7D9ED", sombra: "#C97AB2" },
];

const MENSAGENS = [
  { texto: "Já faz um tempo que seu pet não vem nos visitar,\nque tal agendar um banho?", emoji: "😤" },
  { texto: "Faz tempo que seu pet não se tosa...\nQue tal tirar um tempinho para cuidarmos dele?", emoji: "😬" },
  { texto: "Ei, vocês sumiram! Os cuidados com a higiene do seu cão são\nprimordiais para seu bem estar, agende uma visita ao pet shop.", emoji: "😔" },
];

const PROMOS = [
  require("../../assets/layout_promo1.png"),
  require("../../assets/layout_promo2.png"),
  require("../../assets/layout_promo3.png"),
  require("../../assets/layout_promo4.png"),
  require("../../assets/layout_promo5.png"),
];

const ABAS = [
  { key: "inicio", label: "Início", icon: require("../../assets/logo_inicio.png") },
  { key: "agenda", label: "Agenda", icon: require("../../assets/logo_agenda.png") },
  { key: "historico", label: "Histórico", icon: require("../../assets/logo_historico.png") },
  { key: "perfil", label: "Perfil", icon: require("../../assets/logo_perfil.png") },
];

function ServicoCard({ servico }) {
  const escala = useRef(new Animated.Value(1)).current;

  const pressionar = () =>
    Animated.spring(escala, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
  const soltar = () =>
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();

  return (
    <Pressable onPressIn={pressionar} onPressOut={soltar} style={{ flex: 1, marginHorizontal: 5 }}>
      <Animated.View style={[styles.servicoCard, { transform: [{ scale: escala }], shadowColor: servico.sombra }]}>
        <View style={[styles.servicoIconCirculo, { backgroundColor: servico.cor }]}>
          <Image source={servico.icon} style={styles.servicoIcon} />
        </View>
        <Text style={styles.servicoLabel}>{servico.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ nomeUsuario = "Usuário" }) {
  const primeiroNome = nomeUsuario.trim().split(" ")[0];

  // Mensagem aleatória fixa por sessão
  const [mensagem] = useState(() => MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)]);

  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [promoIndex, setPromoIndex] = useState(0);
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);
  const mensagemSlide = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setPromoIndex(viewableItems[0].index ?? 0);
      // Resetar o timer ao arrastar manualmente
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        iniciarAutoScroll();
      }
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const iniciarAutoScroll = () => {
    intervalRef.current = setInterval(() => {
      setPromoIndex(prev => {
        const next = (prev + 1) % PROMOS.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
  };

  // Animação de entrada da mensagem
  useEffect(() => {
    Animated.timing(mensagemSlide, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-scroll do carrossel de promos
  useEffect(() => {
    iniciarAutoScroll();
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <View style={styles.tela}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.saudacao}>
            Oi, {primeiroNome}! <Text style={styles.emoji}>😊</Text>
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Image source={require("../../assets/logo_configuracao.png")} style={styles.iconConfig} />
          </TouchableOpacity>
        </View>

        <Text style={styles.pergunta}>Do que você e seu pet precisam hoje?</Text>

        {/* ── SERVIÇOS ── */}
        <View style={styles.servicosRow}>
          {SERVICOS.map(s => <ServicoCard key={s.key} servico={s} />)}
        </View>

        {/* ── BUSCA ── */}
        <View style={styles.buscaContainer}>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={busca}
            onChangeText={setBusca}
          />
          <FontAwesome name="search" size={18} color="rgba(255,255,255,0.8)" />
        </View>

        {/* ── MENSAGEM ── */}
        <Animated.View style={[styles.mensagemCard, {
          opacity: mensagemSlide,
          transform: [{ translateY: mensagemSlide.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Text style={styles.mensagemTexto}>{mensagem.texto}</Text>
          <Text style={styles.mensagemEmoji}>{mensagem.emoji}</Text>
        </Animated.View>

        {/* ── CARROSSEL DE PROMOS ── */}
        <View style={styles.carrosselContainer}>
          <FlatList
            ref={flatListRef}
            data={PROMOS}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_W);
              setPromoIndex(idx);
            }}
            renderItem={({ item }) => (
              <Image source={item} style={styles.promoImagem} />
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_W,
              offset: CAROUSEL_W * index,
              index,
            })}
          />
          {/* Barra de progresso dentro da imagem */}
          <View style={styles.promoBarContainer}>
            {PROMOS.map((_, i) => (
              <View key={i} style={[styles.promoSegmento, i === promoIndex && styles.promoSegmentoAtivo]} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── BARRA DE NAVEGAÇÃO FIXA ── */}
      <View style={styles.navbar}>
        {ABAS.map(aba => (
          <TouchableOpacity
            key={aba.key}
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => setAbaAtiva(aba.key)}
          >
            <Image
              source={aba.icon}
              style={[styles.navIcon, abaAtiva === aba.key && styles.navIconAtivo]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  saudacao: {
    fontSize: 26,
    fontFamily: "NunitoExtraBold",
    color: "#1A5F6E",
  },
  emoji: {
    fontSize: 24,
  },
  iconConfig: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  pergunta: {
    fontSize: 17,
    fontFamily: "Quicksand",
    color: "#1A1A1A",
    marginTop: 10,
    marginBottom: 20,
  },

  // Serviços
  servicosRow: {
    flexDirection: "row",
    marginBottom: 20,
    marginHorizontal: -5,
  },
  servicoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 7,
  },
  servicoIconCirculo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  servicoIcon: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },
  servicoLabel: {
    fontSize: 12,
    fontFamily: "QuicksandBold",
    color: "#347C8C",
  },

  // Busca
  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6FB4C7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  buscaInput: {
    flex: 1,
    fontFamily: "Quicksand",
    fontSize: 15,
    color: "#FFFFFF",
  },
  buscaIcone: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    tintColor: "rgba(255,255,255,0.8)",
  },

  // Mensagem
  mensagemCard: {
    backgroundColor: "#6FB4C7",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
    minHeight: 110,
  },
  mensagemTexto: {
    flex: 1,
    fontFamily: "Quicksand",
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 23,
  },
  mensagemEmoji: {
    fontSize: 38,
  },

  // Carrossel
  carrosselContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  promoImagem: {
    width: CAROUSEL_W,
    height: CAROUSEL_W * 0.60,
    resizeMode: "cover",
  },
  promoBarContainer: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 5,
  },
  promoSegmento: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  promoSegmentoAtivo: {
    backgroundColor: "#FFFFFF",
  },

  // Navbar
  navbar: {
    flexDirection: "row",
    backgroundColor: "#E8E8E8",
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
    paddingVertical: 10,
    paddingBottom: 16,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  navIcon: {
    width: 72,
    height: 72,
    resizeMode: "contain",
    opacity: 0.4,
  },
  navIconAtivo: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: "Quicksand",
    color: "#A8CEDA",
  },
  navLabelAtivo: {
    fontFamily: "QuicksandBold",
    color: "#347C8C",
  },
});
