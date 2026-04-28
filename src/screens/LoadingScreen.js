import React, { useEffect, useRef } from "react";
import { Image, Animated, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import { COLORS } from "../constants/theme";

const LOADING_DURATION = 3000;
const ONBOARDING_SEEN_KEY = "@eleve:onboarding_seen";
const TOKEN_KEY = "@eleve:token_acesso";

export default function LoadingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let isActive = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 6,
      }),
    ]).start();

    // Busca o Onboarding e a Sessão ao mesmo tempo
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_SEEN_KEY),
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem('@eleve:email_usuario'),
      AsyncStorage.getItem('@eleve:nome_usuario')
    ]).then(([onboardingVal, tokenVal, emailVal, nomeVal]) => {
      if (!isActive) return;

      const onboardingSeen = onboardingVal === "true";

      const timer = setTimeout(() => {
        if (!isActive) return;

        // Se tem token, vai pra Home logado
        if (onboardingSeen && tokenVal) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "Home",
                params: {
                  tokenAcesso: tokenVal,
                  email: emailVal || "",
                  nomeUsuario: nomeVal || "Usuário",
                },
              },
            ],
          });
        } 
        // Se já viu o onboarding mas não tem token, vai pro Login
        else if (onboardingSeen) {
          navigation.replace("Login");
        } 
        // Primeira vez no app
        else {
          navigation.replace("Onboarding");
        }
      }, LOADING_DURATION);

    }).catch(() => {
      // Em caso de erro na leitura, envia pro Onboarding por segurança
      if (isActive) {
        setTimeout(() => navigation.replace("Onboarding"), LOADING_DURATION);
      }
    });

    return () => {
      isActive = false;
    };
  }, [navigation]);

  return (
    <SafeScreen backgroundColor={COLORS.primary} style={styles.container}>
      <Animated.Image
        source={require("../../assets/eleve_logo.png")}
        style={[
          styles.logo,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
});