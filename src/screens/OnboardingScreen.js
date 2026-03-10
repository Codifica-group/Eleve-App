import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

const TOTAL = 6;

const topImages = [
  require("../../assets/carrossel_apresentacao_1.png"),
  require("../../assets/carrossel_apresentacao_2.png"),
  require("../../assets/carrossel_apresentacao_3.png"),
  require("../../assets/carrossel_apresentacao_4.png"),
  require("../../assets/carrossel_apresentacao_5.png"),
  require("../../assets/carrossel_apresentacao_6.png"),
];

export default function OnboardingScreen({ onFinish }) {
  const [index, setIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (index + 1) / TOTAL,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [index]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        if (prev < TOTAL - 1) return prev + 1;
        onFinish();
        return prev;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  function goNext() {
    if (index < TOTAL - 1) {
      setIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  }

  function goBack() {
    if (index > 0) setIndex(prev => prev - 1);
  }

  const getNextIconSource = () => {
    if (index === 2) return require("../../assets/passar_carrossel_amarelo.png");
    if (index === 4) return require("../../assets/passar_carrossel_laranja.png");
    return require("../../assets/passar_carrossel_azul.png");
  };

  const getPrevIconSource = () => {
    if (index === 3) return require("../../assets/passar_carrossel_amarelo.png");
    if (index === 5) return require("../../assets/passar_carrossel_laranja.png");
    return require("../../assets/passar_carrossel_azul.png");
  };

  return (
    <View style={styles.container}>
      {/* ÁREA DA IMAGEM */}
      <View style={styles.imageWrapper}>
        <Image
          source={topImages[index]}
          style={styles.topImage}
        />

        {/* SETA voltar */}
        {index > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={goBack}>
            <Image
              source={getPrevIconSource()}
              style={[styles.arrowIcon, styles.arrowFlipped]}
            />
          </TouchableOpacity>
        )}

        {/* SETA avançar */}
        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Image source={getNextIconSource()} style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* BARRA de progresso contínua */}
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

      {/* ÁREA INFERIOR BRANCA com botão */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.startButton} onPress={onFinish}>
          <Text style={styles.startText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDF1",
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
    backgroundColor: "#FDFDF1",
  },
  startButton: {
    backgroundColor: "#6FB4C7",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 20,
  },
  startText: {
    fontFamily: "QuicksandBold",
    fontSize: 22,
    color: "white",
  },
});