import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import { COLORS, FONTS } from "../constants/theme";

export default function UploadPhotoScreen({ navigation }) {
  const goBackWithImage = async (uri) => {
    await AsyncStorage.setItem("@eleve:foto_pet_pendente", uri);
    navigation.goBack();
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Erro", "Sem permissão para câmera.");
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) goBackWithImage(result.assets[0].uri);
  };

  const escolherGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) goBackWithImage(result.assets[0].uri);
  };

  const escolherArquivo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (!result.canceled) goBackWithImage(result.assets[0].uri);
  };

  return (
    <SafeScreen backgroundColor={COLORS.accent} style={styles.container}>
      <Text style={styles.title}>Como deseja enviar a foto?</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option} onPress={tirarFoto}>
          <FontAwesome name="camera" size={35} color={COLORS.primaryMedium} />
          <Text style={styles.optionText}>Câmera / Webcam</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={escolherGaleria}>
          <FontAwesome name="image" size={35} color={COLORS.primaryMedium} />
          <Text style={styles.optionText}>Galeria</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={escolherArquivo}>
          <MaterialCommunityIcons
            name="file-upload"
            size={35}
            color={COLORS.primaryMedium}
          />
          <Text style={styles.optionText}>Arquivo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: FONTS.bold,
    color: COLORS.gray,
  },
  optionsContainer: {
    gap: 15,
  },
  option: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    gap: 15,
  },
  optionText: {
    fontSize: 17,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
  },
  cancelBtn: {
    marginTop: 40,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    textDecorationLine: "underline",
  },
});
