import { obterEnderecoBaseApi } from "./configuracaoApi";

export function montarUrlBackend(caminho) {
  const enderecoBase = obterEnderecoBaseApi();
  const caminhoNormalizado = String(caminho || "").replace(/^\/+/, "");
  return `${enderecoBase}/${caminhoNormalizado}`;
}

