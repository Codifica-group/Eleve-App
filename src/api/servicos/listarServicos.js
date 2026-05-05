import { enviarRequisicaoHttp } from "../compartilhado/clienteHttp";

const ALIASES_SERVICO = {
  banho: ["banho"],
  tosa: ["tosa"],
  hidratacao: ["hidratacao", "hidratação", "hidatacao", "hidatação"],
};

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function listarServicos() {
  const resposta = await enviarRequisicaoHttp({
    metodo: "GET",
    endpoint: "/servicos",
  });

  return Array.isArray(resposta) ? resposta : [];
}

export async function resolverServicosAgendamento(chavesServicos) {
  const servicosBackend = await listarServicos();
  const selecionados = [];

  for (const chave of chavesServicos) {
    const aliases = ALIASES_SERVICO[chave] || [chave];
    const servicoEncontrado = servicosBackend.find((servico) => {
      const nomeNormalizado = normalizarTexto(servico?.nome);
      return aliases.some((alias) => normalizarTexto(alias) === nomeNormalizado);
    });

    if (!servicoEncontrado?.id) {
      throw new Error(`Serviço não encontrado para a chave '${chave}'.`);
    }

    selecionados.push(servicoEncontrado);
  }

  return selecionados;
}
