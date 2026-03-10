import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";

import LoadingScreen from "./src/screens/LoadingScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import PetRegistration from "./src/screens/PetRegistration";
import UploadPhotoScreen from "./src/screens/UploadPhotoScreen";
import HomeScreen from "./src/screens/HomeScreen";

// ─────────────────────────────────────────────
// Rotas disponíveis via URL (apenas web):
//   /carregamento    → tela de loading
//   /apresentacao    → slides de onboarding
//   /cadastro-cliente→ formulário do usuário
//   /cadastro-pet    → formulário do pet
//   /foto-pet        → upload de foto
//   /inicio          → tela home
//
// Ex: http://localhost:8081/inicio
// Se nenhuma rota bater, começa pelo carregamento.
// ─────────────────────────────────────────────
const ROTAS_VALIDAS = ["carregamento", "apresentacao", "cadastro-cliente", "cadastro-pet", "foto-pet", "inicio"];

function getRotaInicial() {
  if (typeof window !== "undefined" && window.location && window.location.pathname) {
    const caminho = window.location.pathname.replace(/^\//, "");
    if (ROTAS_VALIDAS.includes(caminho)) return caminho;
  }
  return "carregamento";
}

const ROTA_INICIAL = getRotaInicial();

export default function App() {
  const [tela, setTela] = useState(ROTA_INICIAL);
  const [fotoPet, setFotoPet] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState("Gabriel");

  const [fontsLoaded] = useFonts({
    Quicksand: Nunito_400Regular,
    QuicksandBold: Nunito_700Bold,
    NunitoExtraBold: Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6FB4C7' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (tela === "carregamento") {
    return <LoadingScreen onFinish={() => setTela("apresentacao")} />;
  }

  if (tela === "apresentacao") {
    return <OnboardingScreen onFinish={() => setTela("cadastro-cliente")} />;
  }

  if (tela === "cadastro-cliente") {
    return (
      <RegisterScreen
        onNext={(nome) => {
          setNomeUsuario(nome);
          setTela("cadastro-pet");
        }}
      />
    );
  }

  if (tela === "cadastro-pet") {
    return (
      <PetRegistration
        onAddPhoto={() => setTela("foto-pet")}
        onFinish={() => setTela("inicio")}
        savedImage={fotoPet}
      />
    );
  }

  if (tela === "foto-pet") {
    return (
      <UploadPhotoScreen
        onBack={() => setTela("cadastro-pet")}
        onImageSelect={(uri) => setFotoPet(uri)}
      />
    );
  }

  if (tela === "inicio") {
    return <HomeScreen nomeUsuario={nomeUsuario} />;
  }

  return null;
}