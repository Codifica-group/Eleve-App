import { enviarRequisicaoHttp } from "./clienteHttp";
import { montarUrlBackend } from "./proxyBackend";

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  return [];
}

function normalizarTexto(valor) {
  return String(valor || "").trim().toLowerCase();
}

export async function resolverAcessoPosLogin({ email, tokenAcesso }) {
  const headers = montarHeadersAutorizacao(tokenAcesso);

  const usuariosResposta = await enviarRequisicaoHttp({
    metodo: "GET",
    url: montarUrlBackend("/usuarios?offset=0&size=1000"),
    headers,
  });

  const usuarios = extrairLista(usuariosResposta);
  const usuario = usuarios.find(
    (item) => normalizarTexto(item?.email) === normalizarTexto(email)
  );

  if (!usuario?.nome) {
    throw new Error("Não foi possível localizar seu cadastro de usuário.");
  }

  const clientesResposta = await enviarRequisicaoHttp({
    metodo: "GET",
    url: montarUrlBackend("/clientes?offset=0&size=1000"),
    headers,
  });

  const clientes = extrairLista(clientesResposta);
  const cliente = clientes.find(
    (item) => normalizarTexto(item?.nome) === normalizarTexto(usuario.nome)
  );

  if (!cliente?.id) {
    return {
      temCliente: false,
      temPet: false,
      clienteId: null,
      nomeUsuario: usuario.nome,
    };
  }

  const petsResposta = await enviarRequisicaoHttp({
    metodo: "GET",
    url: montarUrlBackend(`/pets/filtro?clienteId=${cliente.id}`),
    headers,
  });

  const pets = extrairLista(petsResposta);

  return {
    temCliente: true,
    temPet: pets.length > 0,
    clienteId: cliente.id,
    nomeUsuario: usuario.nome,
  };
}
