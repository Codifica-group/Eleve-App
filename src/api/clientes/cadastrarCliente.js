import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";

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
    endpoint: "/clientes",
    headers,
    corpoJson,
  });

  return resposta;
}
