export const SERVICOS = [
  {
    id: 1,
    key: "banho",
    label: "Banho",
    tKey: "data.services.banho",
    icon: require("../../assets/logo_banho.png"),
    cor: "#D8EFF8",
    sombra: "#6FB4C7",
  },
  {
    id: 2,
    key: "tosa",
    label: "Tosa",
    tKey: "data.services.tosa",
    icon: require("../../assets/logo_tosa.png"),
    cor: "#D4EDE7",
    sombra: "#55A891",
  },
  {
    id: 3,
    key: "hidratacao",
    label: "Hidratação",
    tKey: "data.services.hidratacao",
    icon: require("../../assets/logo_hidratacao.png"),
    cor: "#F7D9ED",
    sombra: "#C97AB2",
  },
];

export const MENSAGENS = [
  {
    texto:
      "Já faz um tempo que seu pet não vem nos visitar,\nque tal agendar um banho?",
    tKey: "data.messages.missYou",
    emoji: "😤",
  },
  {
    texto:
      "Faz tempo que seu pet não se tosa...\nQue tal tirar um tempinho para cuidarmos dele?",
    tKey: "data.messages.needsGrooming",
    emoji: "😬",
  },
  {
    texto:
      "Ei, vocês sumiram! Os cuidados com a higiene do seu cão são\nprimordiais para seu bem estar, agende uma visita ao pet shop.",
    tKey: "data.messages.hygiene",
    emoji: "😔",
  },
];

export const PROMOS = [
  require("../../assets/layout_promo1.png"),
  require("../../assets/layout_promo2.png"),
  require("../../assets/layout_promo3.png"),
  require("../../assets/layout_promo4.png"),
  require("../../assets/layout_promo5.png"),
];

export const ABAS = [
  { key: "inicio", label: "Início", tKey: "data.tabs.inicio", icon: require("../../assets/logo_inicio.png") },
  { key: "agenda", label: "Agenda", tKey: "data.tabs.agenda", icon: require("../../assets/logo_agenda.png") },
  { key: "historico", label: "Histórico", tKey: "data.tabs.historico", icon: require("../../assets/logo_historico.png") },
  { key: "perfil", label: "Perfil", tKey: "data.tabs.perfil", icon: require("../../assets/logo_perfil.png") },
];

export const ONBOARDING_IMAGES = [
  require("../../assets/carrossel_apresentacao_1.png"),
  require("../../assets/carrossel_apresentacao_2.png"),
  require("../../assets/carrossel_apresentacao_3.png"),
  require("../../assets/carrossel_apresentacao_4.png"),
  require("../../assets/carrossel_apresentacao_5.png"),
  require("../../assets/carrossel_apresentacao_6.png"),
];

export const OPCOES_SEXO = ["Macho", "Fêmea"];
export const OPCOES_PORTE = ["Pequeno", "Médio", "Grande"];
