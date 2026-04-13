import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

export async function cadastrarUsuario({ nome, email, senha, tokenAcesso }) {
  const url = montarUrlBackend("/usuarios");

  const corpoJson = {
    nome,
    email,
    senha,
  };

  const headers = {
    ...montarHeadersAutorizacao(tokenAcesso),
  };

  const resposta = await enviarRequisicaoHttp({
    metodo: "POST",
    url,
    headers,
    corpoJson,
  });

  const mensagem =
    typeof resposta === "string"
      ? resposta
      : typeof resposta?.mensagem === "string"
        ? resposta.mensagem
        : "Usuário cadastrado com sucesso.";

  return { mensagem };
}
