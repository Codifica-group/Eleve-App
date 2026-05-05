import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";
import { montarUrlBackend } from "../compartilhado/proxyBackend";
import AsyncStorage from '@react-native-async-storage/async-storage';

function montarHeadersAutorizacao(tokenAcesso) {
  if (!tokenAcesso) return {};
  return { Authorization: `Bearer ${tokenAcesso}` };
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  return [];
}

export async function listarPetsPorCliente({ clienteId, tokenAcesso }) {
  if (!clienteId) return [];

  const headers = montarHeadersAutorizacao(tokenAcesso);
  const petsResumidosResposta = await enviarRequisicaoHttp({
    metodo: "GET",
    url: montarUrlBackend(`/pets/filtro?clienteId=${clienteId}`),
    headers,
  });

  const petsResumidos = extrairLista(petsResumidosResposta).filter((pet) => pet?.id);
  if (petsResumidos.length === 0) {
    return [];
  }

  const petsDetalhados = await Promise.allSettled(
    petsResumidos.map((pet) =>
      enviarRequisicaoHttp({
        metodo: "GET",
        url: montarUrlBackend(`/pets/${pet.id}`),
        headers,
      })
    )
  );

  return petsDetalhados.map((resultado, indice) =>
    resultado.status === "fulfilled" ? resultado.value : petsResumidos[indice]
  );
}

// Função alternativa para buscar pets com tratamento de erro simples
export async function listarPetsPorClienteSimples(clienteId) {
  try {
    if (!clienteId) return [];

    const token = await AsyncStorage.getItem('@eleve:token_acesso');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const url = montarUrlBackend(`pets/filtro?clienteId=${clienteId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn(`Erro ao buscar pets: ${response.status}`);
      return [];
    }

    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === "") {
      console.warn("API retornou resposta vazia para pets");
      return [];
    }

    let dados;
    try {
      dados = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta de pets:", parseError);
      return [];
    }

    // Extrai a lista de pets
    const pets = Array.isArray(dados) ? dados : (Array.isArray(dados?.dados) ? dados.dados : []);
    
    return pets.filter((pet) => pet?.id) || [];
  } catch (error) {
    console.error('Erro ao buscar pets:', error);
    return [];
  }
}
