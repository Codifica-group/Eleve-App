import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// ─── Validações ───────────────────────────────────────────────────────────────

function validarNome(valor) {
  return valor.trim().length >= 2;
}

const OPCOES_SEXO = ["Macho", "Fêmea"];
const OPCOES_PORTE = ["Pequeno", "Médio", "Grande"];

// ─── Componente de campo de texto ─────────────────────────────────────────────

function Campo({ label, value, onChangeText, onBlur, placeholder, erro, tocado }) {
  const exibirErro = tocado && erro;
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, exibirErro && styles.inputErro]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.55)"
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        autoCapitalize="words"
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

// ─── Componente de seleção por botões ─────────────────────────────────────────

function Selecao({ label, opcoes, valor, onChange }) {
  return (
    <View style={styles.campoWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.opcoesBotoes}>
        {opcoes.map(op => (
          <TouchableOpacity
            key={op}
            style={[styles.opcaoBotao, valor === op && styles.opcaoBotaoAtivo]}
            onPress={() => onChange(op)}
            activeOpacity={0.8}
          >
            <Text style={[styles.opcaoBotaoTexto, valor === op && styles.opcaoBotaoTextoAtivo]}>
              {op}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function PetRegistration({ onAddPhoto, onFinish, savedImage }) {
  const [campos, setCampos] = useState({ nome: "", raca: "" });
  const [sexo, setSexo] = useState("");
  const [porte, setPorte] = useState("");
  const [tocados, setTocados] = useState({});

  function atualizar(campo, valor) {
    setCampos(prev => ({ ...prev, [campo]: valor }));
  }

  function marcarTocado(campo) {
    setTocados(prev => ({ ...prev, [campo]: true }));
  }

  const erros = {
    nome: !validarNome(campos.nome) ? "Informe o nome do pet" : null,
  };

  function finalizar() {
    setTocados({ nome: true });
    if (erros.nome) return;
    if (onFinish) onFinish();
  }

  function adicionarOutro() {
    setTocados({ nome: true });
    if (erros.nome) return;
    setCampos({ nome: "", raca: "" });
    setSexo("");
    setPorte("");
    setTocados({});
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Cadastro do Pet 🐾</Text>
      <Text style={styles.subtitulo}>Conte-nos sobre seu amigo</Text>

      <Campo
        label="Nome do Pet"
        value={campos.nome}
        onChangeText={v => atualizar("nome", v)}
        onBlur={() => marcarTocado("nome")}
        placeholder="Ex: Caramelo"
        erro={erros.nome}
        tocado={tocados.nome}
      />

      <Selecao
        label="Sexo"
        opcoes={OPCOES_SEXO}
        valor={sexo}
        onChange={setSexo}
      />

      {/* Foto */}
      <Text style={styles.label}>Foto do Pet</Text>
      <TouchableOpacity style={styles.photoUpload} onPress={onAddPhoto} activeOpacity={0.8}>
        {savedImage ? (
          <Image source={{ uri: savedImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <FontAwesome name="camera" size={36} color="rgba(255,255,255,0.7)" />
            <Text style={styles.photoPlaceholderText}>Toque para adicionar</Text>
          </View>
        )}
      </TouchableOpacity>

      <Campo
        label="Raça"
        value={campos.raca}
        onChangeText={v => atualizar("raca", v)}
        onBlur={() => {}}
        placeholder="Ex: Labrador"
        erro={null}
        tocado={false}
      />

      <Selecao
        label="Porte"
        opcoes={OPCOES_PORTE}
        valor={porte}
        onChange={setPorte}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btnSecundario} onPress={adicionarOutro} activeOpacity={0.8}>
          <FontAwesome name="plus" size={14} color="#347C8C" />
          <Text style={styles.btnSecundarioTexto}>Outro Pet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimario} onPress={finalizar} activeOpacity={0.8}>
          <Text style={styles.btnPrimarioTexto}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6FB4C7",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  opcoesBotoes: {
    flexDirection: "row",
    gap: 10,
  },
  opcaoBotao: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  opcaoBotaoAtivo: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  opcaoBotaoTexto: {
    fontFamily: "QuicksandBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  opcaoBotaoTextoAtivo: {
    color: "#347C8C",
  },
  photoUpload: {
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontFamily: "Quicksand",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 36,
  },
  btnSecundario: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
  },
  btnSecundarioTexto: {
    color: "#347C8C",
    fontSize: 15,
    fontFamily: "QuicksandBold",
  },
  btnPrimario: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: "center",
    backgroundColor: "#1A5F6E",
  },
  btnPrimarioTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "QuicksandBold",
  },
});
