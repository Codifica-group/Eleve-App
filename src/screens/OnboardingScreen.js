import React, { useState, useEffect } from "react";
import {
  View,
  Dimensions,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet
} from "react-native";

import ProgressBar from "../components/ProgressBar";

const { width, height } = Dimensions.get("window");

const phoneWidth = Math.min(width * 0.9, height * 0.9 * (9 / 16));
const phoneHeight = phoneWidth * (16 / 9);

const topImages = [
  require("../../assets/carrossel_apresentacao_1.png"),
  require("../../assets/carrossel_apresentacao_2.png"),
  require("../../assets/carrossel_apresentacao_3.png"),
  require("../../assets/carrossel_apresentacao_4.png"),
  require("../../assets/carrossel_apresentacao_5.png"),
  require("../../assets/carrossel_apresentacao_6.png")
];

export default function OnboardingScreen({ onFinish }) {
  const [topImageIndex, setTopImageIndex] = useState(1);

  function nextSlide() {
    setTopImageIndex(prev => (prev < 6 ? prev + 1 : 1));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const getIconSource = () => {
    if (topImageIndex === 3) return require("../../assets/passar_carrossel_amarelo.png");
    if (topImageIndex === 5) return require("../../assets/passar_carrossel_laranja.png");
    return require("../../assets/passar_carrossel_azul.png");
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
        
        {/* IMAGEM DE FUNDO: Ocupa a área de cima com o arredondamento */}
        <View style={styles.imageWrapper}>
            <Image
            source={topImages[topImageIndex - 1]}
            style={[styles.topImage, { width: phoneWidth, height: phoneHeight - 140 }]}
            />
            
            {/* SETA: Posicionada sobre a imagem */}
            <TouchableOpacity style={styles.skipButton} onPress={nextSlide}>
            <Image source={getIconSource()} style={styles.skipIcon} />
            </TouchableOpacity>

            {/* BARRA: Fixada na parte de baixo da imagem (dentro do azul) */}
            <View style={styles.progressContainer}>
                <ProgressBar total={6} current={topImageIndex} />
            </View>
        </View>

        {/* ÁREA INFERIOR: Botão começar na parte clara */}
        <TouchableOpacity style={styles.startButton} onPress={onFinish}>
          <Text style={styles.startText}>Começar</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center"
  },
  phoneContainer: {
    backgroundColor: "#FDFDF1", 
    borderRadius: 20,
    overflow: "hidden"
  },
  imageWrapper: {
    // Esta View define exatamente onde a imagem acaba
    height: phoneHeight - 140,
    position: 'relative',
  },
  topImage: {
    resizeMode: "cover",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20, // Fixa a barra a 20px do fim da imagem azul
    width: '100%',
    alignItems: 'center',
  },
  skipButton: {
    position: "absolute",
    right: 20,
    top: "45%",
  },
  skipIcon: {
    width: 25,
    height: 35,
    resizeMode: "contain"
  },
  startButton: {
    position: "absolute",
    bottom: 40, // Ajustado para ficar na parte clara de baixo
    alignSelf: "center",
    backgroundColor: "#6FB4C7",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 20,
    outlineStyle: 'none'
  },
  startText: {
    fontFamily: "QuicksandBold",
    fontSize: 22,
    color: "white"
  }
});