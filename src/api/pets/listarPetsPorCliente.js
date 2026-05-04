import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  return [];
}

export async function listarPetsPorCliente({ clienteId, tokenAcesso }) {
  if (!clienteId) return [];

  const headers = montarHeadersAutorizacao(tokenAcesso);
  const petsResumidosResposta = await enviarRequisicaoHttp({
    metodo: "GET",
    url: montarUrlBackend(`/pets/filtro?clienteId=${clienteId}`),
    headers,
  });

  const petsResumidos = extrairLista(petsResumidosResposta).filter((pet) => pet?.id);
  if (petsResumidos.length === 0) {
    return [];
  }

  const petsDetalhados = await Promise.allSettled(
    petsResumidos.map((pet) =>
      enviarRequisicaoHttp({
        metodo: "GET",
        url: montarUrlBackend(`/pets/${pet.id}`),
        headers,
      })
    )
  );

  return petsDetalhados.map((resultado, indice) =>
    resultado.status === "fulfilled" ? resultado.value : petsResumidos[indice]
  );
}
