function decodificarBase64Url(base64Url) {
  const valor = String(base64Url || "").trim();
  if (!valor) return "";

  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const conteudo = `${base64}${padding}`;

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(conteudo);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(conteudo, "base64").toString("utf-8");
  }

  return "";
}

export function extrairPayloadToken(token) {
  try {
    const [, payloadCodificado] = String(token || "").split(".");
    if (!payloadCodificado) return null;

    const payloadDecodificado = decodificarBase64Url(payloadCodificado);
    if (!payloadDecodificado) return null;

    return JSON.parse(payloadDecodificado);
  } catch {
    return null;
  }
}

export function extrairEmailDoToken(token) {
  const payload = extrairPayloadToken(token);
  const candidatos = [
    payload?.email,
    payload?.sub,
    payload?.user_email,
    payload?.username,
  ];

  for (const candidato of candidatos) {
    const texto = String(candidato || "").trim();
    if (texto && texto.includes("@")) {
      return texto;
    }
  }

  return "";
}
