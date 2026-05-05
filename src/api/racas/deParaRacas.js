const DE_PARA_RACAS = {
  "foxhound americano": "American Foxhound",
  "lulu da pomerania": "Pomeranian",
  "lulu da pomerânia": "Pomeranian",
  "spitz alemao anao": "Pomeranian",
  "spitz alemão anão": "Pomeranian",
  "spitz alemao": "Pomeranian",
  "spitz alemão": "Pomeranian",
  salsicha: "Dachshund",
  "buldogue frances": "French Bulldog",
  "buldogue francês": "French Bulldog",
  "bulldog frances": "French Bulldog",
  "bulldog francês": "French Bulldog",
  "buldogue ingles": "English Bulldog",
  "buldogue inglês": "English Bulldog",
  "pastor alemao": "German Shepherd Dog",
  "pastor alemão": "German Shepherd Dog",
  "pastor australiano": "Australian Shepherd",
  "cocker spaniel ingles": "English Cocker Spaniel",
  "cocker spaniel inglês": "English Cocker Spaniel",
  "cavalier king charles spaniel": "Cavalier King Charles Spaniel",
  maltes: "Maltese",
  maltês: "Maltese",
  "shih tzu": "Shih Tzu",
  shihtzu: "Shih Tzu",
  pinscher: "Miniature Pinscher",
  yorkshire: "Yorkshire Terrier",
  labrador: "Labrador Retriever",
  golden: "Golden Retriever",
  beagle: "Beagle",
  "border collie": "Border Collie",
  pug: "Pug",
  rottweiler: "Rottweiler",
  "husky siberiano": "Siberian Husky",
  doberman: "Doberman Pinscher",
};

const PALAVRAS_IGNORADAS = new Set(["de", "da", "do", "das", "dos", "e"]);
const TOKENS_TRADUZIDOS = {
  americano: "American",
  americana: "American",
  ingles: "English",
  inglesa: "English",
  frances: "French",
  francesa: "French",
  alemao: "German",
  alema: "German",
  australiano: "Australian",
  australiana: "Australian",
  siberiano: "Siberian",
  siberiana: "Siberian",
  japones: "Japanese",
  japonesa: "Japanese",
  chines: "Chinese",
  chinesa: "Chinese",
  tibetano: "Tibetan",
  tibetana: "Tibetan",
  russo: "Russian",
  russa: "Russian",
  escoces: "Scottish",
  escocesa: "Scottish",
  gales: "Welsh",
  italiano: "Italian",
  italiana: "Italian",
  belga: "Belgian",
  irlandes: "Irish",
  irlandesa: "Irish",
  espanhol: "Spanish",
  espanhola: "Spanish",
  finlandes: "Finnish",
  finlandesa: "Finnish",
  sueco: "Swedish",
  sueca: "Swedish",
  noruegues: "Norwegian",
  norueguesa: "Norwegian",
  holandes: "Dutch",
  holandesa: "Dutch",
  foxhound: "Foxhound",
  bulldogue: "Bulldog",
  bulldog: "Bulldog",
  retriever: "Retriever",
  spaniel: "Spaniel",
  terrier: "Terrier",
  shepherd: "Shepherd",
  pastor: "Shepherd",
  collie: "Collie",
  corgi: "Corgi",
  mastiff: "Mastiff",
  pinscher: "Pinscher",
  husky: "Husky",
  schnauzer: "Schnauzer",
  poodle: "Poodle",
  spitz: "Spitz",
  setter: "Setter",
  hound: "Hound",
  boxer: "Boxer",
  beagle: "Beagle",
  pug: "Pug",
  rottweiler: "Rottweiler",
  pomerania: "Pomerania",
  pomeranian: "Pomeranian",
};
const ADJETIVOS_NACIONALIDADE = new Set([
  "American",
  "English",
  "French",
  "German",
  "Australian",
  "Siberian",
  "Japanese",
  "Chinese",
  "Tibetan",
  "Russian",
  "Scottish",
  "Welsh",
  "Italian",
  "Belgian",
  "Irish",
  "Spanish",
  "Finnish",
  "Swedish",
  "Norwegian",
  "Dutch",
]);

function normalizarChaveRaca(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function capitalizarPalavra(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function montarCandidatoHeuristico(nomeInformado) {
  const nomeLimpo = String(nomeInformado || "").trim();
  if (!nomeLimpo) return "";

  const tokensNormalizados = normalizarChaveRaca(nomeLimpo)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !PALAVRAS_IGNORADAS.has(token));

  if (!tokensNormalizados.length) return "";

  const tokensTraduzidos = tokensNormalizados.map(
    (token) => TOKENS_TRADUZIDOS[token] || capitalizarPalavra(token)
  );

  const ultimoToken = tokensTraduzidos[tokensTraduzidos.length - 1];
  if (ADJETIVOS_NACIONALIDADE.has(ultimoToken) && tokensTraduzidos.length > 1) {
    return [ultimoToken, ...tokensTraduzidos.slice(0, -1)].join(" ");
  }

  return tokensTraduzidos.join(" ");
}

export function obterCandidatosRacaParaConsultaExterna(nomeInformado) {
  const nomeLimpo = String(nomeInformado || "").trim();
  if (!nomeLimpo) return [];

  const candidatos = [];
  const vistos = new Set();
  const adiciona = (valor) => {
    const texto = String(valor || "").trim();
    if (!texto) return;
    const chave = texto.toLowerCase();
    if (vistos.has(chave)) return;
    vistos.add(chave);
    candidatos.push(texto);
  };

  adiciona(DE_PARA_RACAS[normalizarChaveRaca(nomeLimpo)]);
  adiciona(montarCandidatoHeuristico(nomeLimpo));
  adiciona(nomeLimpo);

  return candidatos;
}

export function obterNomeRacaParaConsultaExterna(nomeInformado) {
  const [primeiroCandidato = ""] = obterCandidatosRacaParaConsultaExterna(nomeInformado);
  return primeiroCandidato;
}
