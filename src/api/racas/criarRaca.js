import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

export async function criarRaca({ nome, porteId, tokenAcesso }) {
  return enviarRequisicaoHttp({
    metodo: "POST",
    url: montarUrlBackend("/racas"),
    headers: montarHeadersAutorizacao(tokenAcesso),
    corpoJson: { nome, porteId },
  });
}
