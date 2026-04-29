import AsyncStorage from '@react-native-async-storage/async-storage';
import { montarUrlBackend } from '../compartilhado/proxyBackend';

export async function obterOuSincronizarClienteId() {
  try {
    const clienteIdSalvo = await AsyncStorage.getItem('@eleve:cliente_id');
    if (clienteIdSalvo) {
      return parseInt(clienteIdSalvo, 10);
    }

    const nomeUsuario = await AsyncStorage.getItem('@eleve:nome_usuario');
    const token = await AsyncStorage.getItem('@eleve:token_acesso');

    if (!nomeUsuario || !token) {
      throw new Error('Usuário ou token não encontrados no AsyncStorage.');
    }

    const url = montarUrlBackend(`clientes/nome/${encodeURIComponent(nomeUsuario)}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar ID do cliente na API.');
    }

    const data = await response.json();

    if (data && data.id) {
      await AsyncStorage.setItem('@eleve:cliente_id', data.id.toString());
      return data.id;
    }

    throw new Error('Resposta da API não conteve um ID de cliente válido.');
  } catch (error) {
    console.error('[ERRO Sincronização de Cliente]:', error);
    throw error;
  }
}