import React, { useEffect, useRef } from "react";
import { Image, Animated, StyleSheet } from "react-native";
import SafeScreen from "../components/common/SafeScreen";
import { COLORS } from "../constants/theme";

const LOADING_DURATION = 3000;

export default function LoadingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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

    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
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