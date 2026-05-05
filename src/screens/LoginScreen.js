import React, { useMemo, useState } from "react";
import { Text, ScrollView, StyleSheet, View, TouchableOpacity, Image } from "react-native";
import SafeScreen from "../components/common/SafeScreen";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import useFormValidation from "../hooks/useFormValidation";
import { logarUsuario } from "../api/usuarios/logarUsuario";
import { obterMensagemAmigavel } from "../api/compartilhado/errosApi";
import { resolverAcessoPosLogin } from "../api/compartilhado/posLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation, route }) {
  const emailInicial = route?.params?.email || "";

  const [campos, setCampos] = useState({
    email: emailInicial,
    senha: "",
  });
  const [camposTocados, setCamposTocados] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erroServidor, setErroServidor] = useState(null);

  const camposParaValidar = useMemo(() => ["email", "senha"], []);
  const validadoresCustomizados = useMemo(
    () => ({
      senha: { fn: (v) => String(v || "").trim().length > 0, msg: "Informe sua senha" },
    }),
    []
  );
  const { erros, formularioValido } = useFormValidation(
    campos,
    camposParaValidar,
    validadoresCustomizados
  );

  function atualizar(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  function tocarCampo(campo) {
    setCamposTocados((prev) => ({ ...prev, [campo]: true }));
  }

  function marcarTodosComoTocados() {
    const todos = {};
    camposParaValidar.forEach((campo) => {
      todos[campo] = true;
    });
    setCamposTocados(todos);
  }

  function obterErroCampo(campo) {
    return erros?.[campo] || null;
  }

  function foiTocado(campo) {
    return Boolean(camposTocados?.[campo]);
  }

  async function limparSessaoParcial() {
    await AsyncStorage.multiRemove([
      "@eleve:token_acesso",
      "@eleve:email_usuario",
      "@eleve:nome_usuario",
      "@eleve:cliente_id",
    ]);
  }

  async function entrar() {
    setErroServidor(null);
    marcarTodosComoTocados();

    if (!formularioValido) {
      return;
    }

    try {
      setCarregando(true);
      const response = await logarUsuario({
        email: campos.email,
        senha: campos.senha,
      });

      if (!response.token) {
        throw new Error("Não foi possível autenticar. Tente novamente.");
      }

      const emailUsuario = response.usuario?.email || campos.email;
      const nomeUsuario = response.usuario?.nome || "";

      await AsyncStorage.removeItem('@eleve:cliente_id');
      await AsyncStorage.setItem('@eleve:token_acesso', response.token);
      await AsyncStorage.setItem('@eleve:email_usuario', emailUsuario);
      await AsyncStorage.setItem('@eleve:nome_usuario', nomeUsuario);

      const acesso = await resolverAcessoPosLogin({
        email: emailUsuario,
        tokenAcesso: response.token,
      });

      if (!acesso.temCliente || !acesso.clienteId) {
        await limparSessaoParcial();
        throw new Error("Seu cadastro de cliente não foi localizado. Faça o cadastro novamente.");
      }

      await AsyncStorage.setItem("@eleve:cliente_id", String(acesso.clienteId));

      if (!acesso.temPet) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "PetRegistration",
              params: {
                nomeUsuario: acesso.nomeUsuario || nomeUsuario,
                email: emailUsuario,
                token: response.token,
              },
            },
          ],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Home",
              params: {
                tokenAcesso: response.token,
                email: emailUsuario,
                nomeUsuario,
              },
            },
          ],
      });
    } catch (e) {
      await limparSessaoParcial();
      setErroServidor(obterMensagemAmigavel(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeScreen avoidKeyboard backgroundColor={COLORS.primary}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/eleve_logo.png")}
            style={styles.logo}
          />
        </View>
        <Text style={styles.titulo}>Entrar</Text>
        <Text style={styles.subtitulo}>Use seu e-mail e senha para continuar</Text>

        {erroServidor ? (
          <View style={styles.erroServidorContainer}>
            <Text style={styles.erroServidorTexto}>{erroServidor}</Text>
          </View>
        ) : null}

        <Input
          label="E-mail"
          value={campos.email}
          onChangeText={(v) => atualizar("email", v)}
          onBlur={() => tocarCampo("email")}
          placeholder="exemplo@email.com"
          erro={obterErroCampo("email")}
          tocado={foiTocado("email")}
          keyboardType="email-address"
        />

        <Input
          label="Senha"
          value={campos.senha}
          onChangeText={(v) => atualizar("senha", v)}
          onBlur={() => tocarCampo("senha")}
          placeholder="Sua senha"
          erro={obterErroCampo("senha")}
          tocado={foiTocado("senha")}
          secureTextEntry
        />

        <Button
          title={carregando ? "Entrando..." : "Entrar"}
          onPress={entrar}
          style={styles.botao}
          carregando={carregando}
          desabilitado={!formularioValido || carregando}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Register", { email: campos.email })}
          style={styles.linkContainer}
        >
          <Text style={styles.linkTexto}>
            Ainda não tem conta? <Text style={styles.linkTextoDestaque}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
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
  linkContainer: {
    marginTop: 18,
    alignItems: "center",
  },
  linkTexto: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.85)",
  },
  linkTextoDestaque: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  erroServidorContainer: {
    backgroundColor: "rgba(255,224,102,0.15)",
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  erroServidorTexto: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.warning,
    lineHeight: 18,
  },
});
