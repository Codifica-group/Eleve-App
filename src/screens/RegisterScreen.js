import React, { useMemo, useRef, useState } from "react";
import { Text, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import useFormValidation, {
  formatarCep,
  formatarTelefone,
} from "../hooks/useFormValidation";
import { cadastrarUsuario } from "../api/usuarios/cadastrarUsuario";
import { logarUsuario } from "../api/usuarios/logarUsuario";
import { cadastrarCliente } from "../api/clientes/cadastrarCliente";
import { obterMensagemAmigavel } from "../api/compartilhado/errosApi";

export default function RegisterScreen({ navigation }) {
  const ultimoCepBuscadoRef = useRef("");

  const [campos, setCampos] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    numEndereco: "",
    complemento: "",
  });
  const [camposTocados, setCamposTocados] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [erroCep, setErroCep] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);

  const camposParaValidar = useMemo(
    () => ["nome", "telefone", "email", "senha", "cep", "endereco", "bairro", "cidade", "numEndereco"],
    []
  );
  const { erros, formularioValido } = useFormValidation(campos, camposParaValidar);

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

  async function buscarEnderecoPorCep(cepLimpo) {
    if (cepLimpo.length !== 8 || ultimoCepBuscadoRef.current === cepLimpo) {
      return;
    }

    ultimoCepBuscadoRef.current = cepLimpo;
    setErroCep(null);

    try {
      setCarregandoCep(true);
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resposta.ok) {
        throw new Error("Falha ao consultar CEP");
      }

      const dados = await resposta.json();
      if (dados.erro) {
        throw new Error("CEP não encontrado");
      }

      setCampos((prev) => ({
        ...prev,
        endereco: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
      }));
    } catch {
      setCampos((prev) => ({
        ...prev,
        endereco: "",
        bairro: "",
        cidade: "",
      }));
      setErroCep("Não foi possível preencher o endereço pelo CEP. Verifique o CEP informado.");
    } finally {
      setCarregandoCep(false);
    }
  }

  function onChangeCep(valor) {
    const cepFormatado = formatarCep(valor);
    const cepLimpo = cepFormatado.replace(/\D/g, "");

    atualizar("cep", cepFormatado);

    if (cepLimpo.length < 8) {
      ultimoCepBuscadoRef.current = "";
      setErroCep(null);
      setCampos((prev) => ({
        ...prev,
        endereco: "",
        bairro: "",
        cidade: "",
      }));
      return;
    }

    buscarEnderecoPorCep(cepLimpo);
  }

  async function prosseguir() {
    setErroServidor(null);
    marcarTodosComoTocados();

    if (!formularioValido) {
      return;
    }

    try {
      setCarregando(true);
      await cadastrarUsuario({
        nome: campos.nome,
        email: campos.email,
        senha: campos.senha,
      });

      const { token } = await logarUsuario({
        email: campos.email,
        senha: campos.senha,
      });

      if (!token) {
        throw new Error("Não foi possível autenticar. Tente novamente.");
      }

      const rua = campos.endereco?.trim() || null;
      const numEndereco = campos.numEndereco?.trim() || null;
      const bairro = campos.bairro?.trim() || null;
      const cidade = campos.cidade?.trim() || null;
      const complemento = campos.complemento?.trim() || null;

      const clienteCriado = await cadastrarCliente({
        nome: campos.nome,
        telefone: campos.telefone.replace(/\D/g, ""),
        cep: campos.cep.replace(/\D/g, ""),
        rua,
        numEndereco,
        bairro,
        cidade,
        complemento,
        tokenAcesso: token,
      });

      await AsyncStorage.setItem("@eleve:token_acesso", token);
      await AsyncStorage.setItem("@eleve:email_usuario", campos.email);
      await AsyncStorage.setItem("@eleve:nome_usuario", campos.nome);

      if (clienteCriado?.id) {
        await AsyncStorage.setItem("@eleve:cliente_id", String(clienteCriado.id));
      } else {
        await AsyncStorage.removeItem("@eleve:cliente_id");
      }

      // Redireciona para o cadastro de pet ao invés de voltar para Login
      navigation.replace("PetRegistration", {
        nomeUsuario: campos.nome,
        email: campos.email,
        telefone: campos.telefone,
        endereco: campos.endereco,
        cep: campos.cep,
        token: token,
      });
    } catch (e) {
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
        <Text style={styles.titulo}>Crie sua conta</Text>
        <Text style={styles.subtitulo}>Preencha seus dados para continuar</Text>

        {erroServidor ? (
          <View style={styles.erroServidorContainer}>
            <Text style={styles.erroServidorTexto}>{erroServidor}</Text>
          </View>
        ) : null}

        <Input
          label="Nome Completo"
          value={campos.nome}
          onChangeText={(v) => atualizar("nome", v)}
          onBlur={() => tocarCampo("nome")}
          placeholder="Ex: Maria Silva"
          erro={obterErroCampo("nome")}
          tocado={foiTocado("nome")}
          autoCapitalize="words"
        />
        <Input
          label="Telefone"
          value={campos.telefone}
          onChangeText={(v) => atualizar("telefone", formatarTelefone(v))}
          onBlur={() => tocarCampo("telefone")}
          placeholder="(11) 99876-5432"
          erro={obterErroCampo("telefone")}
          tocado={foiTocado("telefone")}
          keyboardType="phone-pad"
        />
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
          placeholder="Mínimo 8 caracteres (maiúscula, minúscula e número)"
          erro={obterErroCampo("senha")}
          tocado={foiTocado("senha")}
          secureTextEntry
        />
        <Input
          label="CEP"
          value={campos.cep}
          onChangeText={onChangeCep}
          onBlur={() => tocarCampo("cep")}
          placeholder="00000-000"
          erro={obterErroCampo("cep")}
          tocado={foiTocado("cep")}
          keyboardType="numeric"
        />
        {erroCep ? <Text style={styles.cepInfoErro}>{erroCep}</Text> : null}
        {carregandoCep ? <Text style={styles.cepInfo}>Buscando endereço do CEP...</Text> : null}
        <Input
          label="Rua"
          value={campos.endereco}
          onChangeText={() => null}
          onBlur={() => tocarCampo("endereco")}
          placeholder="Preenchido automaticamente"
          erro={obterErroCampo("endereco")}
          tocado={foiTocado("endereco")}
          editable={false}
        />
        <Input
          label="Bairro"
          value={campos.bairro}
          onChangeText={() => null}
          onBlur={() => tocarCampo("bairro")}
          placeholder="Preenchido automaticamente"
          erro={obterErroCampo("bairro")}
          tocado={foiTocado("bairro")}
          editable={false}
        />
        <Input
          label="Cidade"
          value={campos.cidade}
          onChangeText={() => null}
          onBlur={() => tocarCampo("cidade")}
          placeholder="Preenchido automaticamente"
          erro={obterErroCampo("cidade")}
          tocado={foiTocado("cidade")}
          editable={false}
        />
        <Input
          label="Número"
          value={campos.numEndereco}
          onChangeText={(v) => atualizar("numEndereco", v.replace(/\D/g, ""))}
          onBlur={() => tocarCampo("numEndereco")}
          placeholder="Ex: 123"
          erro={obterErroCampo("numEndereco")}
          tocado={foiTocado("numEndereco")}
          keyboardType="numeric"
        />
        <Input
          label="Complemento"
          value={campos.complemento}
          onChangeText={(v) => atualizar("complemento", v)}
          onBlur={() => tocarCampo("complemento")}
          placeholder="Ex: Apto 12, Bloco B"
        />

        <Button
          title={carregando ? "Cadastrando..." : "Próximo"}
          onPress={prosseguir}
          style={styles.botao}
          carregando={carregando}
          desabilitado={!formularioValido || carregando || carregandoCep}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.replace("Login", { email: campos.email })}
          style={styles.linkContainer}
        >
          <Text style={styles.linkTexto}>
            Já tem conta? <Text style={styles.linkTextoDestaque}>Entrar</Text>
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
  cepInfo: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  cepInfoErro: {
    marginTop: 6,
    color: COLORS.warning,
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
});
