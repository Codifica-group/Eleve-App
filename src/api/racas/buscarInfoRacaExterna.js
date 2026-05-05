import { montarUrlBackend } from "../compartilhado/proxyBackend";
import { obterCandidatosRacaParaConsultaExterna } from "./deParaRacas";

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

export async function buscarInfoRacaExterna(nomeRaca) {
  const candidatos = obterCandidatosRacaParaConsultaExterna(normalizarTexto(nomeRaca));
  if (!candidatos.length) return null;

  for (const nome of candidatos) {
    const url = montarUrlBackend(`/racas/externa/info/${encodeURIComponent(nome)}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new Error("Não foi possível consultar a base externa centralizada.");
    }

    return response.json();
  }

  return null;
}
