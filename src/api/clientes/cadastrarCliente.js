import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

export async function cadastrarCliente({
  nome,
  telefone,
  cep,
  rua,
  numEndereco,
  bairro,
  cidade,
  complemento,
  tokenAcesso,
}) {
  const url = montarUrlBackend("/clientes");
  const headers = montarHeadersAutorizacao(tokenAcesso);

  const corpoJson = {
    nome,
    telefone,
    cep,
    rua,
    numEndereco,
    bairro,
    cidade,
    complemento,
  };

  const resposta = await enviarRequisicaoHttp({
    metodo: "POST",
    url,
    headers,
    corpoJson,
  });

  return resposta;
}

