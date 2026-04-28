import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import SafeScreen from "../components/common/SafeScreen";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import SelectionGroup from "../components/common/SelectionGroup";
import { OPCOES_SEXO, OPCOES_PORTE } from "../constants/data";
import { COLORS, FONTS, SPACING } from "../constants/theme";

export default function PetRegistrationScreen({ navigation, route }) {
  const { nomeUsuario, telefone, email, endereco, cep } = route.params || {};
  const [campos, setCampos] = useState({ nomePet: "", raca: "" });
  const [sexo, setSexo] = useState("");
  const [porte, setPorte] = useState("");
  const [fotoPet, setFotoPet] = useState(null);

  function atualizar(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  function finalizar() {
    navigation.navigate("Home", {
      nomeUsuario,
      telefone,
      email,
      endereco,
      cep,
      nomePet: campos.nomePet,
      racaPet: campos.raca,
      sexoPet: sexo,
      portePet: porte,
      fotoPet,
    });
  }

  function abrirUploadFoto() {
    navigation.navigate("UploadPhoto");
  }

  React.useEffect(() => {
    if (route.params?.selectedImage) {
      setFotoPet(route.params.selectedImage);
    }
  }, [route.params?.selectedImage]);

  return (
    <SafeScreen avoidKeyboard backgroundColor={COLORS.primary}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Cadastro do Pet 🐾</Text>
        <Text style={styles.subtitulo}>Conte-nos sobre seu amigo</Text>

        <Input
          label="Nome do Pet"
          value={campos.nomePet}
          onChangeText={(v) => atualizar("nomePet", v)}
          placeholder="Ex: Caramelo"
          autoCapitalize="words"
        />

        <SelectionGroup
          label="Sexo"
          opcoes={OPCOES_SEXO}
          valor={sexo}
          onChange={setSexo}
        />

        {/* Foto */}
        <Text style={styles.label}>Foto do Pet</Text>
        <TouchableOpacity
          style={styles.photoUpload}
          onPress={abrirUploadFoto}
          activeOpacity={0.8}
        >
          {fotoPet ? (
            <Image source={{ uri: fotoPet }} style={styles.previewImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <FontAwesome
                name="camera"
                size={36}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.photoPlaceholderText}>
                Toque para adicionar
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="Raça"
          value={campos.raca}
          onChangeText={(v) => atualizar("raca", v)}
          onBlur={() => {}}
          placeholder="Ex: Labrador"
          autoCapitalize="words"
          erro={null}
          tocado={false}
        />

        <SelectionGroup
          label="Porte"
          opcoes={OPCOES_PORTE}
          valor={porte}
          onChange={setPorte}
        />

        <Button
          title="Finalizar"
          onPress={finalizar}
          style={{ marginTop: 32 }}
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
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 30,
    marginTop: SPACING.xxl,
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
  label: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.labelColor,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    fontFamily: FONTS.regular,
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
    backgroundColor: COLORS.white,
  },
  btnPrimario: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
});
