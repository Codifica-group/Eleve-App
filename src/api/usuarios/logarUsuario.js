import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";

export async function logarUsuario({ email, senha }) {
  const url = montarUrlBackend("/usuarios/login");

  const corpoJson = {
    email,
    senha,
  };

  const resposta = await enviarRequisicaoHttp({
    metodo: "POST",
    url,
    corpoJson,
  });

  const token = resposta?.token || resposta?.Token || null;
  return { token, bruto: resposta };
}

