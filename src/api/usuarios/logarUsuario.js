import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";

export async function logarUsuario({ email, senha }) {

  const corpoJson = {
    email,
    senha,
  };

  const resposta = await enviarRequisicaoHttp({
    metodo: "POST",
    endpoint: "/usuarios/login",
    corpoJson,
  });

  return resposta;
}
