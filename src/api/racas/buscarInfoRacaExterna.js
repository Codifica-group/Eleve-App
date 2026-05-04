import { montarUrlBackend } from "../compartilhado/proxyBackend";

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

export async function buscarInfoRacaExterna(nomeRaca) {
  const nome = normalizarTexto(nomeRaca);
  if (!nome) return null;

  const url = montarUrlBackend(`/racas/externa/info/${encodeURIComponent(nome)}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Não foi possível consultar a base externa centralizada.");
  }

  return response.json();
}
