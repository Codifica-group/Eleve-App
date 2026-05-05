import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { montarUrlBackend } from '../compartilhado/proxyBackend';

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

export async function buscarClientePorId(clienteId) {
  try {
    const token = await AsyncStorage.getItem('@eleve:token_acesso');
    const url = montarUrlBackend(`clientes/${clienteId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar cliente: ${response.status}`);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error("API retornou resposta vazia");
    }

    const dados = JSON.parse(responseText);
    return dados;
  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
    throw error;
  }
}

export async function atualizarCliente(clienteId, dadosCliente) {
  return enviarRequisicaoHttp({
    metodo: "PUT",
    endpoint: `/clientes/${clienteId}`,
    corpoJson: dadosCliente,
  });
}
