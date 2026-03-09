import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get("window");
const phoneWidth = Math.min(width * 0.9, height * 0.9 * (9 / 16));
const phoneHeight = phoneWidth * (16 / 9);

export default function UploadPhotoScreen({ onBack, onImageSelect }) {
  const processResult = (result) => {
    if (!result.canceled) {
      onImageSelect(result.assets[0].uri);
      onBack();
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erro", "Sem permissão.");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    processResult(result);
  };

  const escolherGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    processResult(result);
  };

  const escolherArquivo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (!result.canceled) {
      onImageSelect(result.assets[0].uri);
      onBack();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
        <View style={styles.container}>
          <Text style={styles.title}>Como deseja enviar a foto?</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={tirarFoto}><FontAwesome name="camera" size={35} color="#347C8C" /><Text style={styles.optionText}>Câmera / Webcam</Text></TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={escolherGaleria}><FontAwesome name="image" size={35} color="#347C8C" /><Text style={styles.optionText}>Galeria</Text></TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={escolherArquivo}><MaterialCommunityIcons name="file-upload" size={35} color="#347C8C" /><Text style={styles.optionText}>Arquivo</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  phoneContainer: { backgroundColor: "white", borderRadius: 20, overflow: "hidden" },
  container: { flex: 1, backgroundColor: "#ADCED9", padding: 30, justifyContent: 'center' },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 40, fontFamily: "QuicksandBold", color: "#424242" },
  optionsContainer: { gap: 15 },
  option: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 15, gap: 15, outlineStyle: 'none' },
  optionText: { fontSize: 17, fontFamily: "Quicksand", color: "#424242" },
  cancelBtn: { marginTop: 40, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: "Quicksand", color: "#424242", textDecorationLine: 'underline' }
});