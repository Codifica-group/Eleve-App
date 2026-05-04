import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { ErroHttp } from "../compartilhado/errosApi";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

function extrairPrimeiraRaca(resposta) {
  if (Array.isArray(resposta) && resposta.length > 0) return resposta[0];
  if (resposta?.dados && Array.isArray(resposta.dados) && resposta.dados.length > 0) {
    return resposta.dados[0];
  }
  return null;
}

export async function buscarRacaPorNome({ nome, tokenAcesso }) {
  const nomeLimpo = (nome || "").trim();
  if (!nomeLimpo) {
    throw new Error("Informe a raça do pet.");
  }

  const headers = montarHeadersAutorizacao(tokenAcesso);

  try {
    const urlExata = montarUrlBackend(`/racas/nome/${encodeURIComponent(nomeLimpo)}`);
    const respostaExata = await enviarRequisicaoHttp({
      metodo: "GET",
      url: urlExata,
      headers,
    });

    if (respostaExata?.id) {
      return respostaExata;
    }
  } catch (erro) {
    if (!(erro instanceof ErroHttp) || erro.statusHttp !== 404) {
      throw erro;
    }
  }

  const urlAproximada = montarUrlBackend(
    `/racas/nome/aproximado/${encodeURIComponent(nomeLimpo)}`
  );

  const respostaAproximada = await enviarRequisicaoHttp({
    metodo: "GET",
    url: urlAproximada,
    headers,
  });

  const raca = extrairPrimeiraRaca(respostaAproximada);
  if (!raca?.id) {
    throw new Error("Raça não encontrada. Tente informar um nome de raça válido.");
  }

  return raca;
}
