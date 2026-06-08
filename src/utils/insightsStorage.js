import AsyncStorage from "@react-native-async-storage/async-storage";

const AUDIO_INSIGHTS_KEY = "@eleve:insights_audio";
const RACA_INSIGHTS_KEY = "@eleve:insights_raca";

function safeJsonParse(valor, fallback) {
  try {
    return JSON.parse(valor);
  } catch {
    return fallback;
  }
}

async function readArray(key) {
  const bruto = await AsyncStorage.getItem(key);
  const arr = safeJsonParse(bruto, []);
  return Array.isArray(arr) ? arr : [];
}

async function writeArray(key, arr) {
  await AsyncStorage.setItem(key, JSON.stringify(arr));
}

export async function listarInsightsAudio() {
  return readArray(AUDIO_INSIGHTS_KEY);
}

export async function adicionarInsightAudio({
  audioUri,
  origem,
  prompt,
  resposta,
  mimeType,
  fileName,
  transcriao,
  ...extras
}) {
  const atual = await readArray(AUDIO_INSIGHTS_KEY);
  const novo = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    audioUri: audioUri || null,
    origem: origem || "audio",
    prompt: prompt || null,
    resposta: resposta || "",
    mimeType: mimeType || null,
    fileName: fileName || null,
    perguntaTranscrita: transcriao || null,
    ...extras,
  };

  await writeArray(AUDIO_INSIGHTS_KEY, [novo, ...atual].slice(0, 30));
  return novo;
}

export async function listarInsightsRaca() {
  return readArray(RACA_INSIGHTS_KEY);
}

export async function adicionarInsightRaca({
  nomePet,
  nomeRaca,
  porte,
  infoRacaExterna,
  sugestoesIA,
  ...extras
}) {
  const atual = await readArray(RACA_INSIGHTS_KEY);
  const novo = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    nomePet: nomePet || null,
    nomeRaca: nomeRaca || "",
    porte: porte || null,
    infoRacaExterna: infoRacaExterna || null,
    sugestoesIA: sugestoesIA || [],
    ...extras,
  };

  await writeArray(RACA_INSIGHTS_KEY, [novo, ...atual].slice(0, 30));
  return novo;
}
