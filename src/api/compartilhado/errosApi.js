export class ErroTimeout extends Error {
  constructor(mensagem = "Tempo limite de conexão excedido.") {
    super(mensagem);
    this.name = "ErroTimeout";
  }
}

export class ErroRede extends Error {
  constructor(mensagem = "Falha de rede. Verifique sua conexão e tente novamente.") {
    super(mensagem);
    this.name = "ErroRede";
  }
}

export class ErroHttp extends Error {
  constructor({ statusHttp, corpoResposta, mensagem }) {
    super(mensagem || "Falha ao comunicar com o servidor.");
    this.name = "ErroHttp";
    this.statusHttp = statusHttp;
    this.corpoResposta = corpoResposta;
  }
}

function obterMensagemDeErroConhecida(statusHttp) {
  if (statusHttp === 400) return "Dados inválidos. Revise o formulário e tente novamente.";
  if (statusHttp === 401) return "Sessão expirada. Faça login novamente.";
  if (statusHttp === 403) return "Acesso negado.";
  if (statusHttp === 404) return "Recurso não encontrado.";
  if (statusHttp === 409) return "Já existe um cadastro com esses dados.";
  if (statusHttp >= 500) return "Servidor indisponível no momento. Tente novamente mais tarde.";
  return null;
}

function extrairMensagemServidor(corpoResposta) {
  if (!corpoResposta) return null;

  if (typeof corpoResposta === "string") {
    const texto = corpoResposta.trim();
    return texto ? texto : null;
  }

  if (typeof corpoResposta === "object") {
    const candidato = corpoResposta.message || corpoResposta.mensagem;
    if (typeof candidato === "string" && candidato.trim()) return candidato.trim();
  }

  return null;
}

export function obterMensagemAmigavel(erro) {
  if (!erro) return "Ocorreu um erro inesperado.";
  if (erro instanceof ErroTimeout) return erro.message;
  if (erro instanceof ErroRede) return erro.message;

  if (erro instanceof ErroHttp) {
    const msgServidor = extrairMensagemServidor(erro.corpoResposta);
    if (msgServidor) return msgServidor;

    const msgStatus = obterMensagemDeErroConhecida(erro.statusHttp);
    if (msgStatus) return msgStatus;

    return erro.message;
  }

  if (erro instanceof Error && erro.message) return erro.message;
  return "Ocorreu um erro inesperado.";
}

