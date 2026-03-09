import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions, Image } from "react-native";
import { FontAwesome } from '@expo/vector-icons'; 

const { width, height } = Dimensions.get("window");
const phoneWidth = Math.min(width * 0.9, height * 0.9 * (9 / 16));
const phoneHeight = phoneWidth * (16 / 9);

export default function PetRegistration({ onAddPhoto, savedImage }) {
  const [nomePet, setNomePet] = useState("");
  const [sexo, setSexo] = useState("");
  const [raca, setRaca] = useState("");
  const [porte, setPorte] = useState("");

  function adicionarOutro() {
    Alert.alert("Sucesso", `${nomePet || "Pet"} cadastrado! Limpando para o próximo.`);
    setNomePet(""); setSexo(""); setRaca(""); setPorte("");
  }

  function finalizar() {
    if (!nomePet) return Alert.alert("Atenção", "Preencha ao menos o nome do pet.");
    Alert.alert("Sucesso", "Todos os dados foram salvos!");
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Agora é a vez do seu Pet 😊</Text>

          <Text style={styles.label}>Nome:</Text>
          <TextInput style={[styles.input, nomePet !== "" && styles.inputFilled]} placeholder="Ex: Caramelo" value={nomePet} onChangeText={setNomePet} outlineStyle="none" />

          <Text style={styles.label}>Sexo:</Text>
          <TextInput style={[styles.input, sexo !== "" && styles.inputFilled]} placeholder="Ex: Macho" value={sexo} onChangeText={setSexo} outlineStyle="none" />

          <Text style={styles.description}>Gostaria de enviar uma foto de {nomePet || "seu pet"}?</Text>

          <TouchableOpacity style={styles.photoUpload} onPress={onAddPhoto} activeOpacity={0.8}>
             {savedImage ? <Image source={{ uri: savedImage }} style={styles.previewImage} /> : <FontAwesome name="camera" size={45} color="#757575" />}
          </TouchableOpacity>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Raça:</Text>
            <TextInput style={[styles.input, raca !== "" && styles.inputFilled]} placeholder="Ex: Labrador" value={raca} onChangeText={setRaca} outlineStyle="none" />

            <Text style={styles.label}>Porte:</Text>
            <TextInput style={[styles.input, porte !== "" && styles.inputFilled]} placeholder="Ex: Grande" value={porte} onChangeText={setPorte} outlineStyle="none" />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={adicionarOutro}>
                <Text style={styles.buttonText}>+ Pet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.btnPrimary]} onPress={finalizar}>
                <Text style={styles.buttonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  phoneContainer: { backgroundColor: "white", borderRadius: 20, overflow: "hidden" },
  container: { flex: 1, backgroundColor: "#ADCED9", paddingHorizontal: 28 },
  title: { fontSize: 26, marginTop: 40, marginBottom: 15, color: "#424242", fontFamily: "QuicksandBold" },
  label: { fontSize: 16, marginTop: 14, marginBottom: 7, color: "#424242", fontFamily: "Quicksand" },
  description: { fontSize: 15, color: "#424242", marginTop: 20, marginBottom: 10, fontFamily: "Quicksand" },
  input: { backgroundColor: "#56AEC4", borderRadius: 12, padding: 14, color: "#424242", outlineStyle: "none", fontFamily: "Quicksand" },
  inputFilled: { backgroundColor: "#FFFFFF" },
  photoUpload: { backgroundColor: "#FFFFFF", height: 145, borderRadius: 15, justifyContent: "center", alignItems: "center", marginVertical: 12, overflow: 'hidden', outlineStyle: 'none' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  button: { flex: 0.47, padding: 15, borderRadius: 30, alignItems: "center", outlineStyle: "none" },
  btnPrimary: { backgroundColor: "#347C8C" },
  btnSecondary: { backgroundColor: "#4FA3B8" },
  buttonText: { color: "white", fontSize: 17, fontFamily: "QuicksandBold" }
});