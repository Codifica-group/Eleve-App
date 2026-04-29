import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

export async function cadastrarUsuario({ nome, email, senha, tokenAcesso }) {

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
    endpoint: "/usuarios",
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
