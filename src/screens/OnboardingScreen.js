import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeScreen from "../components/common/SafeScreen";
import { ONBOARDING_IMAGES } from "../constants/data";
import { COLORS, FONTS } from "../constants/theme";

const TOTAL = ONBOARDING_IMAGES.length;
const ONBOARDING_SEEN_KEY = "@eleve:onboarding_seen";

export default function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasNavigatedRef = useRef(false);

  const goToLogin = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true").catch(() => null);
    navigation.replace("Login");
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (index + 1) / TOTAL,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [index]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev < TOTAL - 1 ? prev + 1 : prev));
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (index !== TOTAL - 1) return;

    const endTimer = setTimeout(() => {
      goToLogin();
    }, 7000);

    return () => clearTimeout(endTimer);
  }, [index]);

  function goNext() {
    if (index < TOTAL - 1) {
      setIndex((prev) => prev + 1);
    } else {
      goToLogin();
    }
  }

  function goBack() {
    if (index > 0) setIndex((prev) => prev - 1);
  }

  const getNextIconSource = () => {
    if (index === 2)
      return require("../../assets/passar_carrossel_amarelo.png");
    if (index === 4)
      return require("../../assets/passar_carrossel_laranja.png");
    return require("../../assets/passar_carrossel_azul.png");
  };

  const getPrevIconSource = () => {
    if (index === 3)
      return require("../../assets/passar_carrossel_amarelo.png");
    if (index === 5)
      return require("../../assets/passar_carrossel_laranja.png");
    return require("../../assets/passar_carrossel_azul.png");
  };

  return (
    <SafeScreen
      backgroundColor={COLORS.backgroundLight}
      statusBarStyle="dark"
      style={styles.container}
    >
      {/* ÁREA DA IMAGEM */}
      <View style={styles.imageWrapper}>
        <Image source={ONBOARDING_IMAGES[index]} style={styles.topImage} />

        {index > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={goBack}>
            <Image
              source={getPrevIconSource()}
              style={[styles.arrowIcon, styles.arrowFlipped]}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Image source={getNextIconSource()} style={styles.arrowIcon} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ÁREA INFERIOR */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.startButton} onPress={goToLogin}>
          <Text style={styles.startText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  topImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  progressContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingHorizontal: 30,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 10,
  },
  prevButton: {
    position: "absolute",
    left: 20,
    top: "45%",
  },
  nextButton: {
    position: "absolute",
    right: 20,
    top: "45%",
  },
  arrowIcon: {
    width: 25,
    height: 35,
    resizeMode: "contain",
  },
  arrowFlipped: {
    transform: [{ scaleX: -1 }],
  },
  bottomArea: {
    paddingVertical: 30,
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 20,
  },
  startText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.white,
  },
});
