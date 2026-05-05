import AsyncStorage from '@react-native-async-storage/async-storage';
import { obterEnderecoBaseApi } from "./configuracaoApi";
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

async function montarHeadersPadrao(headers, isFormData) {
  const token = await AsyncStorage.getItem('@eleve:token_acesso');
  const base = {};

  if (!isFormData) {
    base["Accept"] = "application/json";
    base["Content-Type"] = "application/json";
  }

  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  }

  return {
    ...base,
    ...(headers || {}),
  };
}

function ehUrlAbsoluta(valor) {
  return /^https?:\/\//i.test(String(valor || "").trim());
}

function resolverUrlRequisicao({ endpoint, url }) {
  const urlLegada = String(url || "").trim();
  if (urlLegada) {
    return urlLegada;
  }

  const endpointNormalizado = String(endpoint || "").trim();
  if (!endpointNormalizado) {
    throw new Error("Nenhum endpoint foi informado para a requisição.");
  }

  if (ehUrlAbsoluta(endpointNormalizado)) {
    return endpointNormalizado;
  }

  const baseUrl = obterEnderecoBaseApi();
  const caminho = endpointNormalizado.startsWith("/")
    ? endpointNormalizado
    : `/${endpointNormalizado}`;

  return `${baseUrl}${caminho}`;
}

export async function enviarRequisicaoHttp({
  metodo,
  endpoint,
  url,
  headers,
  corpoJson,
  corpoFormData,
  timeoutMs = 15000,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let urlFinal = "";

  try {
    urlFinal = resolverUrlRequisicao({ endpoint, url });

    const isFormData = corpoFormData !== undefined;
    const headersFinais = await montarHeadersPadrao(headers, isFormData);

    const init = {
      method: metodo,
      headers: headersFinais,
      signal: controller.signal,
    };

    if (corpoJson !== undefined) {
      init.body = JSON.stringify(corpoJson);
    } else if (corpoFormData !== undefined) {
      init.body = corpoFormData; 
    }

    const response = await fetch(urlFinal, init);
    const corpoResposta = await lerResposta(response);

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
    if (erro?.name === "AbortError") {
      throw new ErroTimeout(
        `Não foi possível conectar ao servidor (${urlFinal}). Se estiver no emulador Android, use 10.0.2.2. Se estiver no celular, use o IP da sua máquina na rede.`
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
