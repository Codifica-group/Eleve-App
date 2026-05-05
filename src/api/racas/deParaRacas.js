const DE_PARA_RACAS = {
  "lulu da pomerania": "Pomeranian",
  "spitz alemao anao": "Pomeranian",
  "spitz alemao": "Pomeranian",
  salsicha: "Dachshund",
  "buldogue frances": "French Bulldog",
  "bulldog frances": "French Bulldog",
  "buldogue ingles": "English Bulldog",
  "pastor alemao": "German Shepherd Dog",
  "pastor australiano": "Australian Shepherd",
  "cocker spaniel ingles": "English Cocker Spaniel",
  "cavalier king charles spaniel": "Cavalier King Charles Spaniel",
  maltes: "Maltese",
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

function normalizarChaveRaca(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function obterNomeRacaParaConsultaExterna(nomeInformado) {
  const nomeLimpo = String(nomeInformado || "").trim();
  if (!nomeLimpo) return "";

  return DE_PARA_RACAS[normalizarChaveRaca(nomeLimpo)] || nomeLimpo;
}
