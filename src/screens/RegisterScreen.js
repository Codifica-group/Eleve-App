import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// ─── Helpers de validação ────────────────────────────────────────────────────

function validarNomeCompleto(valor) {
  const partes = valor.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 2);
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

function formatarTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a);
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a);
}

function formatarCep(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 8);
  return n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => b ? `${a}-${b}` : a);
}

// ─── Componente do campo ─────────────────────────────────────────────────────

function Campo({ label, value, onChangeText, onBlur, placeholder, keyboardType, secureTextEntry, erro, tocado }) {
  const exibirErro = tocado && erro;
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          exibirErro && styles.inputErro,
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.55)"
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType || "default"}
        secureTextEntry={secureTextEntry || false}
        autoCapitalize="none"
      />
      {exibirErro && (
        <View style={styles.erroRow}>
          <FontAwesome name="exclamation-circle" size={12} color="#FFE066" />
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────

export default function RegisterScreen({ onNext }) {
  const [campos, setCampos] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    endereco: "",
    cep: "",
  });

  const [tocados, setTocados] = useState({});

  function atualizar(campo, valor) {
    setCampos(prev => ({ ...prev, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados(prev => ({ ...prev, [campo]: true }));
  }

  const erros = {
    nome: !validarNomeCompleto(campos.nome) ? "Informe nome e sobrenome" : null,
    telefone: !validarTelefone(campos.telefone) ? "Telefone inválido (10 ou 11 dígitos)" : null,
    email: !validarEmail(campos.email) ? "E-mail inválido" : null,
    senha: !validarSenha(campos.senha) ? "Mínimo de 6 caracteres" : null,
    endereco: campos.endereco.trim().length < 5 ? "Informe o endereço completo" : null,
    cep: !validarCep(campos.cep) ? "CEP inválido (8 dígitos)" : null,
  };

  const formularioValido = Object.values(erros).every(e => e === null);

  function prosseguir() {
    setTocados({ nome: true, telefone: true, email: true, senha: true, endereco: true, cep: true });
    if (!formularioValido) return;
    if (onNext) onNext(campos.nome);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Crie sua conta</Text>
      <Text style={styles.subtitulo}>Preencha seus dados para continuar</Text>

      <Campo
        label="Nome Completo"
        value={campos.nome}
        onChangeText={v => atualizar("nome", v)}
        onBlur={() => marcarTocado("nome")}
        placeholder="Ex: Maria Silva"
        erro={erros.nome}
        tocado={tocados.nome}
      />
      <Campo
        label="Telefone"
        value={campos.telefone}
        onChangeText={v => atualizar("telefone", formatarTelefone(v))}
        onBlur={() => marcarTocado("telefone")}
        placeholder="(11) 98640-0678"
        keyboardType="phone-pad"
        erro={erros.telefone}
        tocado={tocados.telefone}
      />
      <Campo
        label="E-mail"
        value={campos.email}
        onChangeText={v => atualizar("email", v)}
        onBlur={() => marcarTocado("email")}
        placeholder="exemplo@email.com"
        keyboardType="email-address"
        erro={erros.email}
        tocado={tocados.email}
      />
      <Campo
        label="Senha"
        value={campos.senha}
        onChangeText={v => atualizar("senha", v)}
        onBlur={() => marcarTocado("senha")}
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        erro={erros.senha}
        tocado={tocados.senha}
      />
      <Campo
        label="Endereço Completo"
        value={campos.endereco}
        onChangeText={v => atualizar("endereco", v)}
        onBlur={() => marcarTocado("endereco")}
        placeholder="Ex: Rua das Flores, 123 - Bairro"
        erro={erros.endereco}
        tocado={tocados.endereco}
      />
      <Campo
        label="CEP"
        value={campos.cep}
        onChangeText={v => atualizar("cep", formatarCep(v))}
        onBlur={() => marcarTocado("cep")}
        placeholder="00000-000"
        keyboardType="numeric"
        erro={erros.cep}
        tocado={tocados.cep}
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={prosseguir}
        activeOpacity={0.8}
      >
        <Text style={styles.botaoTexto}>Próximo</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6FB4C7",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 30,
    marginTop: 48,
    marginBottom: 4,
    color: "#FFFFFF",
    fontFamily: "QuicksandBold",
  },
  subtitulo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Quicksand",
    marginBottom: 24,
  },
  campoWrapper: {
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: "QuicksandBold",
    color: "rgba(255,255,255,0.9)",
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Quicksand",
    color: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  inputErro: {
    borderColor: "#FFE066",
    backgroundColor: "rgba(255,224,102,0.15)",
  },
  erroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  erroTexto: {
    fontSize: 12,
    fontFamily: "Quicksand",
    color: "#FFE066",
  },
  botao: {
    marginTop: 36,
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 40,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#347C8C",
    fontSize: 17,
    fontFamily: "QuicksandBold",
  },
});
