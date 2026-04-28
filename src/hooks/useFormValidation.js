import { useMemo } from "react";

function validarNomeCompleto(valor) {
  const partes = valor.trim().split(/\s+/);
  return partes.length >= 2 && partes.every((p) => p.length >= 2);
}

function validarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "");
  return numeros.length === 10 || numeros.length === 11;
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function validarSenha(valor) {
  return valor.length >= 6;
}

function validarCep(valor) {
  return /^\d{8}$/.test(valor.replace(/\D/g, ""));
}

function validarNomePet(valor) {
  return valor.trim().length >= 2;
}

export function formatarTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a
    );
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
    c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a
  );
}

export function formatarCep(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a));
}

const VALIDADORES = {
  nome: { fn: validarNomeCompleto, msg: "Informe nome e sobrenome" },
  telefone: { fn: validarTelefone, msg: "Telefone inválido (10 ou 11 dígitos)" },
  email: { fn: validarEmail, msg: "E-mail inválido" },
  senha: { fn: validarSenha, msg: "Mínimo de 6 caracteres" },
  endereco: { fn: (v) => v.trim().length >= 5, msg: "Informe o endereço completo" },
  bairro: { fn: (v) => v.trim().length >= 2, msg: "Informe o bairro" },
  cidade: { fn: (v) => v.trim().length >= 2, msg: "Informe a cidade" },
  numEndereco: { fn: (v) => v.trim().length >= 1, msg: "Informe o número" },
  cep: { fn: validarCep, msg: "CEP inválido (8 dígitos)" },
  nomePet: { fn: validarNomePet, msg: "Informe o nome do pet" },
};

/**
 * Hook de validação genérico.
 * @param {Object} campos - { nome: "valor", email: "valor", ... }
 * @param {string[]} camposParaValidar - lista de chaves a validar
 * @returns {{ erros: Object, formularioValido: boolean }}
 */
export default function useFormValidation(campos, camposParaValidar) {
  const erros = useMemo(() => {
    const result = {};
    camposParaValidar.forEach((key) => {
      const regra = VALIDADORES[key];
      if (regra) {
        result[key] = regra.fn(campos[key] || "") ? null : regra.msg;
      }
    });
    return result;
  }, [campos, camposParaValidar]);

  const formularioValido = useMemo(
    () => Object.values(erros).every((e) => e === null),
    [erros]
  );

  return { erros, formularioValido };
}
