import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

function limparTextoJson(texto) {
  return String(texto || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function normalizarConfianca(valor) {
  if (valor === null || valor === undefined) return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;

  if (numero > 1 && numero <= 100) return numero / 100;
  if (numero >= 0 && numero <= 1) return numero;
  return null;
}

function normalizarSugestao(item) {
  if (!item) return null;

  if (typeof item === "string") {
    const raca = item.trim();
    if (!raca) return null;
    return { raca, confianca: null };
  }

  if (typeof item === "object") {
    const raca = String(item.raca || item.nome || "").trim();
    if (!raca) return null;

    const confianca = normalizarConfianca(
      item.confianca ?? item.confidence ?? item.score ?? item.probabilidade
    );

    return { raca, confianca };
  }

  return null;
}

function extrairSugestoes(valor) {
  if (!valor) return [];

  if (Array.isArray(valor)) {
    return valor.map(normalizarSugestao).filter(Boolean);
  }

  const item = normalizarSugestao(valor);
  if (item) return [item];

  return [];
}

function deduplicar(lista) {
  const vistos = new Set();
  return lista.filter((item) => {
    const chave = item.raca.toLowerCase();
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function inferirMimeType(uri) {
  const base = String(uri || "").split("?")[0].toLowerCase();
  if (base.endsWith(".png")) return "image/png";
  if (base.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

export async function identificarRacaPorImagem({ imagemUri, tokenAcesso }) {
  if (!imagemUri) {
    throw new Error("Imagem inválida para identificação de raça.");
  }

  const formData = new FormData();
  formData.append("imagem", {
    uri: imagemUri,
    name: "pet.jpg",
    type: inferirMimeType(imagemUri),
  });

  const response = await fetch(montarUrlBackend("/racas/identificar"), {
    method: "POST",
    headers: {
      ...montarHeadersAutorizacao(tokenAcesso),
      Accept: "application/json",
    },
    body: formData,
  });

  const texto = await response.text();

  if (!response.ok) {
    throw new Error("Não foi possível identificar a raça pela foto.");
  }

  const textoLimpo = limparTextoJson(texto);

  try {
    const json = JSON.parse(textoLimpo);
    return deduplicar(extrairSugestoes(json));
  } catch {
    return [];
  }
}
