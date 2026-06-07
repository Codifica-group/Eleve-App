import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import Feedback from "./src/utils/FeedbackComponent";
import AppNavigator from "./src/navigation/AppNavigator";

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import "./src/i18n"; 

export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand: Nunito_400Regular,
    QuicksandBold: Nunito_700Bold,
    NunitoExtraBold: Nunito_800ExtraBold,
  });

  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    async function carregarIdiomaPersistido() {
      try {
        const idiomaSalvo = await AsyncStorage.getItem("@eleve:idioma");
        if (idiomaSalvo) {
          await i18n.changeLanguage(idiomaSalvo);
        }
      } catch (error) {
        console.error("Erro ao recuperar o idioma do AsyncStorage:", error);
      } finally {
        // Define como carregado mesmo em caso de erro para não travar o app (usará o padrão do dispositivo)
        setLanguageLoaded(true);
      }
    }

    carregarIdiomaPersistido();
  }, []);

  // Condicional de carregamento expandida para incluir a verificação do idioma
  if (!fontsLoaded || !languageLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#6FB4C7",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <Feedback />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
