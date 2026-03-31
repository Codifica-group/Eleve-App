import React, { useState } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import SafeScreen from "../components/common/SafeScreen";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { COLORS, FONTS, SPACING } from "../constants/theme";

function formatarTelefone(v) {
  const nums = v.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return nums.length ? `(${nums}` : "";
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function formatarCep(v) {
  const nums = v.replace(/\D/g, "").slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}

export default function RegisterScreen({ navigation }) {
  const [campos, setCampos] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    endereco: "",
    cep: "",
  });

  function atualizar(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  function prosseguir() {
    navigation.navigate("PetRegistration", {
      nomeUsuario: campos.nome,
      telefone: campos.telefone,
      email: campos.email,
      endereco: campos.endereco,
      cep: campos.cep,
    });
  }

  return (
    <SafeScreen avoidKeyboard backgroundColor={COLORS.primary}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Crie sua conta</Text>
        <Text style={styles.subtitulo}>Preencha seus dados para continuar</Text>

        <Input
          label="Nome Completo"
          value={campos.nome}
          onChangeText={(v) => atualizar("nome", v)}
          placeholder="Ex: Maria Silva"
          autoCapitalize="words"
        />
        <Input
          label="Telefone"
          value={campos.telefone}
          onChangeText={(v) => atualizar("telefone", formatarTelefone(v))}
          placeholder="(11) 98640-0678"
          keyboardType="phone-pad"
        />
        <Input
          label="E-mail"
          value={campos.email}
          onChangeText={(v) => atualizar("email", v)}
          placeholder="exemplo@email.com"
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          value={campos.senha}
          onChangeText={(v) => atualizar("senha", v)}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
        <Input
          label="Endereço Completo"
          value={campos.endereco}
          onChangeText={(v) => atualizar("endereco", v)}
          placeholder="Ex: Rua das Flores, 123 - Bairro"
        />
        <Input
          label="CEP"
          value={campos.cep}
          onChangeText={(v) => atualizar("cep", formatarCep(v))}
          placeholder="00000-000"
          keyboardType="numeric"
        />

        <Button
          title="Próximo"
          onPress={prosseguir}
          style={styles.botao}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 30,
    marginTop: SPACING.md,
    marginBottom: 4,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  subtitulo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: FONTS.regular,
    marginBottom: SPACING.lg,
  },
  botao: {
    marginTop: 20,
  },
});
