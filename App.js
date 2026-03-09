import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFonts, Quicksand_400Regular, Quicksand_700Bold } from "@expo-google-fonts/quicksand";

// IMPORTANTE: Todos estes arquivos devem estar na pasta src/screens
import LoadingScreen from "./src/screens/LoadingScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import PetRegistration from "./src/screens/PetRegistration";
import UploadPhotoScreen from "./src/screens/UploadPhotoScreen";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [petImage, setPetImage] = useState(null);

  const [fontsLoaded] = useFonts({
    Quicksand: Quicksand_400Regular,
    QuicksandBold: Quicksand_700Bold
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6FB4C7' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (screen === "loading") {
    return <LoadingScreen onFinish={() => setScreen("onboarding")} />;
  }

  if (screen === "onboarding") {
    return <OnboardingScreen onFinish={() => setScreen("register")} />;
  }

  if (screen === "register") {
    return <RegisterScreen onNext={() => setScreen("petRegistration")} />;
  }

  if (screen === "petRegistration") {
    return (
      <PetRegistration 
        onAddPhoto={() => setScreen("uploadPhoto")} 
        savedImage={petImage}
      />
    );
  }

  if (screen === "uploadPhoto") {
    return (
      <UploadPhotoScreen 
        onBack={() => setScreen("petRegistration")} 
        onImageSelect={(uri) => setPetImage(uri)} 
      />
    );
  }

  return null;
}