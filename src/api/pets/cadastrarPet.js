import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

export async function cadastrarPet({
  nome,
  racaId,
  clienteId,
  sexo,
  porteId,
  foto,
  tokenAcesso,
}) {
  const url = montarUrlBackend("/pets");
  const headers = montarHeadersAutorizacao(tokenAcesso);

  const corpoJson = {
    nome,
    racaId,
    clienteId,
    sexo,
    porteId,
    foto,
  };

  return enviarRequisicaoHttp({
    metodo: "POST",
    url,
    headers,
    corpoJson,
  });
}
