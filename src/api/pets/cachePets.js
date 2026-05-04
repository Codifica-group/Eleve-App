import AsyncStorage from "@react-native-async-storage/async-storage";

const PETS_CACHE_KEY_PREFIX = "@eleve:pets";
const VALORES_PADRAO_NAO_INFORMADOS = new Set([
  "não informado",
  "não informada",
  "nao informado",
  "nao informada",
]);

function montarChave(clienteId) {
  return `${PETS_CACHE_KEY_PREFIX}:${clienteId}`;
}

function normalizarTexto(valor) {
  return String(valor || "").trim().toLowerCase();
}

function criarChavePet(pet) {
  if (pet?.id) return `id:${pet.id}`;
  return `nome:${normalizarTexto(pet?.nome)}|raca:${normalizarTexto(pet?.raca)}`;
}

function petsCorrespondem(petA, petB) {
  if (!petA || !petB) return false;

  if (petA?.id && petB?.id) {
    return String(petA.id) === String(petB.id);
  }

  return normalizarTexto(petA?.nome) === normalizarTexto(petB?.nome);
}

function normalizarPet(pet = {}) {
  return {
    id: pet?.id ?? null,
    racaId: pet?.racaId ?? null,
    porteId: pet?.porteId ?? null,
    nome: String(pet?.nome || "").trim() || "Pet",
    raca: String(pet?.raca || "").trim() || "Não informada",
    sexo: String(pet?.sexo || "").trim() || "Não informado",
    porte: String(pet?.porte || "").trim() || "Não informado",
    foto: pet?.foto || null,
  };
}

function temTextoInformado(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return false;
  return !VALORES_PADRAO_NAO_INFORMADOS.has(texto.toLowerCase());
}

function escolherValorPreferencial(valorLocal, valorRemoto) {
  if (temTextoInformado(valorLocal)) {
    return valorLocal;
  }

  if (temTextoInformado(valorRemoto)) {
    return valorRemoto;
  }

  return valorLocal || valorRemoto || "";
}

function escolherFotoPreferencial(fotoLocal, fotoRemota) {
  if (fotoLocal) return fotoLocal;
  if (fotoRemota) return fotoRemota;
  return null;
}

export function criarPetLocal(pet) {
  return normalizarPet(pet);
}

export async function listarPetsLocais(clienteId) {
  if (!clienteId) return [];

  try {
    const conteudo = await AsyncStorage.getItem(montarChave(clienteId));
    if (!conteudo) return [];

    const pets = JSON.parse(conteudo);
    if (!Array.isArray(pets)) return [];

    return pets.map(normalizarPet);
  } catch {
    return [];
  }
}

export async function salvarPetsLocais(clienteId, pets) {
  if (!clienteId) return;

  try {
    const petsNormalizados = Array.isArray(pets) ? pets.map(normalizarPet) : [];
    await AsyncStorage.setItem(montarChave(clienteId), JSON.stringify(petsNormalizados));
  } catch {
    // ignora falhas de cache local
  }
}

export async function upsertPetLocal(clienteId, pet) {
  const petsAtuais = await listarPetsLocais(clienteId);
  const petNormalizado = normalizarPet(pet);

  const indiceExistente = petsAtuais.findIndex(
    (item) => petsCorrespondem(item, petNormalizado)
  );

  const proximosPets =
    indiceExistente >= 0
      ? petsAtuais.map((item, index) =>
          index === indiceExistente ? normalizarPet({ ...item, ...petNormalizado }) : item
        )
      : [...petsAtuais, petNormalizado];

  await salvarPetsLocais(clienteId, proximosPets);
  return proximosPets;
}

export function mesclarPetsLocaisComRemotos(petsLocais, petsRemotos) {
  const locais = Array.isArray(petsLocais) ? petsLocais.map(normalizarPet) : [];
  const remotos = Array.isArray(petsRemotos) ? petsRemotos.map(normalizarPet) : [];

  if (remotos.length === 0) {
    return locais;
  }

  const chavesUsadas = new Set();

  const petsMesclados = remotos.map((petRemoto) => {
    const petLocal = locais.find((item) => petsCorrespondem(item, petRemoto));
    const chaveLocal = petLocal ? criarChavePet(petLocal) : criarChavePet(petRemoto);
    chavesUsadas.add(chaveLocal);

    if (!petLocal) return petRemoto;

    return normalizarPet({
      ...petRemoto,
      racaId: petRemoto.racaId ?? petLocal.racaId ?? null,
      porteId: petRemoto.porteId ?? petLocal.porteId ?? null,
      sexo: escolherValorPreferencial(petLocal.sexo, petRemoto.sexo),
      porte: escolherValorPreferencial(petLocal.porte, petRemoto.porte),
      foto: escolherFotoPreferencial(petLocal.foto, petRemoto.foto),
    });
  });

  locais.forEach((petLocal) => {
    const chave = criarChavePet(petLocal);
    if (!chavesUsadas.has(chave)) {
      petsMesclados.push(petLocal);
    }
  });

  return petsMesclados;
}
