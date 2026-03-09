import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions
} from "react-native";

const { width, height } = Dimensions.get("window");
const phoneWidth = Math.min(width * 0.9, height * 0.9 * (9 / 16));
const phoneHeight = phoneWidth * (16 / 9);

export default function RegisterScreen({ onNext }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");

  function validarEProsseguir() {
    if (!nome || !telefone || !email || !senha || !endereco || !cep) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (onNext) onNext();
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Crie sua conta</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Nome Completo:</Text>
            <TextInput style={[styles.input, nome !== "" && styles.inputFilled]} placeholder="Ex: Luisa Mel" value={nome} onChangeText={setNome} outlineStyle="none" />

            <Text style={styles.label}>Telefone:</Text>
            <TextInput style={[styles.input, telefone !== "" && styles.inputFilled]} placeholder="Ex: 11986400678" keyboardType="numeric" value={telefone} onChangeText={setTelefone} outlineStyle="none" />

            <Text style={styles.label}>Email:</Text>
            <TextInput style={[styles.input, email !== "" && styles.inputFilled]} placeholder="Ex: luisamel@gmail.com" keyboardType="email-address" value={email} onChangeText={setEmail} outlineStyle="none" />

            <Text style={styles.label}>Senha:</Text>
            <TextInput style={[styles.input, senha !== "" && styles.inputFilled]} placeholder="Ex: princesa123" secureTextEntry value={senha} onChangeText={setSenha} outlineStyle="none" />

            <Text style={styles.label}>Endereço Completo:</Text>
            <TextInput style={[styles.input, endereco !== "" && styles.inputFilled]} placeholder="Ex: Rua Roque..." value={endereco} onChangeText={setEndereco} outlineStyle="none" />

            <Text style={styles.label}>CEP:</Text>
            <TextInput style={[styles.input, cep !== "" && styles.inputFilled]} placeholder="Ex: 09341020" keyboardType="numeric" value={cep} onChangeText={setCep} outlineStyle="none" />
          </View>

          <TouchableOpacity style={styles.button} onPress={validarEProsseguir} activeOpacity={0.7}>
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  phoneContainer: { backgroundColor: "white", borderRadius: 20, overflow: "hidden", elevation: 5 },
  container: { flex: 1, backgroundColor: "#9BBAC4", paddingHorizontal: 28 },
  title: { fontSize: 31, marginTop: 40, marginBottom: 20, color: "#424242", fontFamily: "QuicksandBold" },
  formContainer: { gap: 2 },
  label: { fontSize: 16, marginTop: 15, marginBottom: 7, color: "#424242", fontFamily: "Quicksand" },
  input: { backgroundColor: "#4FA3B8", borderRadius: 12, padding: 14, color: "#424242", fontFamily: "Quicksand", outlineStyle: "none" },
  inputFilled: { backgroundColor: "#FFFFFF" },
  button: { marginTop: 55, backgroundColor: "#347C8C", padding: 17, borderRadius: 40, alignItems: "center", outlineStyle: "none" },
  buttonText: { color: "white", fontSize: 18, fontFamily: "QuicksandBold" }
});