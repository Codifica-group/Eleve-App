import React, { useEffect, useRef } from "react";
import { Image, Animated, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import { COLORS } from "../constants/theme";
import { resolverAcessoPosLogin } from "../api/compartilhado/posLogin";
import { extrairEmailDoToken } from "../utils/tokenJwt";

const LOADING_DURATION = 3000;
const ONBOARDING_SEEN_KEY = "@eleve:onboarding_seen";
const TOKEN_KEY = "@eleve:token_acesso";

export default function LoadingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let isActive = true;
    let timerId = null;

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

    Promise.all([
      AsyncStorage.getItem(ONBOARDING_SEEN_KEY),
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem('@eleve:email_usuario'),
      AsyncStorage.getItem('@eleve:nome_usuario')
    ]).then(([onboardingVal, tokenVal, emailVal, nomeVal]) => {
      if (!isActive) return;

      const onboardingSeen = onboardingVal === "true";
      const emailRecuperado = emailVal || extrairEmailDoToken(tokenVal);

      timerId = setTimeout(async () => {
        if (!isActive) return;

        if (onboardingSeen && tokenVal) {
          try {
            if (!emailRecuperado) {
              throw new Error("Sessão incompleta.");
            }

            if (!emailVal && emailRecuperado) {
              await AsyncStorage.setItem("@eleve:email_usuario", emailRecuperado);
            }

            const acesso = await resolverAcessoPosLogin({
              email: emailRecuperado,
              tokenAcesso: tokenVal,
            });

            if (!acesso.temCliente || !acesso.clienteId) {
              throw new Error("Cadastro de cliente não localizado.");
            }

            await AsyncStorage.setItem("@eleve:cliente_id", String(acesso.clienteId));

            if (!acesso.temPet) {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "PetRegistration",
                    params: {
                      nomeUsuario: acesso.nomeUsuario || nomeVal || "Usuário",
                      email: emailRecuperado,
                      token: tokenVal,
                    },
                  },
                ],
              });
              return;
            }

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Home",
                  params: {
                    tokenAcesso: tokenVal,
                    email: emailRecuperado,
                    nomeUsuario: acesso.nomeUsuario || nomeVal || "Usuário",
                  },
                },
              ],
            });
          } catch {
            await AsyncStorage.multiRemove([
              TOKEN_KEY,
              "@eleve:email_usuario",
              "@eleve:nome_usuario",
              "@eleve:cliente_id",
            ]);

            if (isActive) {
              navigation.replace("Login");
            }
          }
        } 
        else if (onboardingSeen) {
          navigation.replace("Login");
        } 
        else {
          navigation.replace("Onboarding");
        }
      }, LOADING_DURATION);

    }).catch(() => {
      if (isActive) {
        setTimeout(() => navigation.replace("Onboarding"), LOADING_DURATION);
      }
    });

    return () => {
      isActive = false;
      if (timerId) {
        clearTimeout(timerId);
      }
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
