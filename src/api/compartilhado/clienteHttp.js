import { ErroHttp, ErroRede, ErroTimeout } from "./errosApi";

function sanitizarObjetoParaLog(valor) {
  if (!valor || typeof valor !== "object") return valor;
  if (Array.isArray(valor)) return valor.map(sanitizarObjetoParaLog);

  const resultado = {};
  Object.entries(valor).forEach(([chave, v]) => {
    const chaveMinuscula = String(chave).toLowerCase();
    const deveMascarar =
      chaveMinuscula.includes("senha") ||
      chaveMinuscula.includes("password") ||
      chaveMinuscula.includes("token") ||
      chaveMinuscula === "authorization";

    resultado[chave] = deveMascarar ? "***" : sanitizarObjetoParaLog(v);
  });

  return resultado;
}

function sanitizarHeadersParaLog(headers) {
  if (!headers || typeof headers !== "object") return headers;
  return sanitizarObjetoParaLog(headers);
}

function extrairMensagemServidor(corpoResposta) {
  if (!corpoResposta) return null;

  if (typeof corpoResposta === "string") {
    const texto = corpoResposta.trim();
    return texto ? texto : null;
  }

  if (typeof corpoResposta === "object") {
    const candidato = corpoResposta.message || corpoResposta.mensagem;
    if (typeof candidato === "string" && candidato.trim()) return candidato.trim();
  }

  return null;
}

async function lerResposta(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const texto = await response.text();

  if (!texto) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  }

  return texto;
}

function montarHeadersPadrao(headers) {
  const base = {
    Accept: "application/json",
  };

  return {
    ...base,
    ...(headers || {}),
  };
}

export async function enviarRequisicaoHttp({
  metodo,
  url,
  headers,
  corpoJson,
  timeoutMs = 15000,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const inicioMs = Date.now();

  try {
    const headersFinais = montarHeadersPadrao(headers);
    console.log("[API] ->", metodo, url, {
      timeoutMs,
      headers: sanitizarHeadersParaLog(headersFinais),
      corpo: sanitizarObjetoParaLog(corpoJson),
    });

    const init = {
      method: metodo,
      headers: headersFinais,
      signal: controller.signal,
    };

    if (corpoJson !== undefined) {
      init.body = JSON.stringify(corpoJson);
      init.headers = {
        ...headersFinais,
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(url, init);
    const corpoResposta = await lerResposta(response);
    console.log("[API] <-", metodo, url, {
      statusHttp: response.status,
      duracaoMs: Date.now() - inicioMs,
    });

    if (!response.ok) {
      const mensagemConhecida = extrairMensagemServidor(corpoResposta);

      throw new ErroHttp({
        statusHttp: response.status,
        corpoResposta,
        mensagem: mensagemConhecida || "Falha ao comunicar com o servidor.",
      });
    }

    return corpoResposta;
  } catch (erro) {
    console.log("[API] !!", metodo, url, {
      duracaoMs: Date.now() - inicioMs,
      nome: erro?.name,
      mensagem: erro?.message,
    });

    if (erro?.name === "AbortError") {
      throw new ErroTimeout(
        `Não foi possível conectar ao servidor (${url}). Se estiver no emulador Android, use 10.0.2.2. Se estiver no celular, use o IP da sua máquina na rede.`
      );
    }

    if (erro instanceof ErroHttp) {
      throw erro;
    }

    throw new ErroRede();
  } finally {
    clearTimeout(timeoutId);
  }
}
