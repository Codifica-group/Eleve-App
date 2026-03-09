import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const phoneWidth = Math.min(width * 0.9, height * 0.9 * (9 / 16));
const phoneHeight = phoneWidth * (16 / 9);

export default function LoadingScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 6000); // Simulate loading for 2 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
        <Image
          source={require("../../assets/eleve_logo.png")}
          style={styles.logo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center"
  },

  phoneContainer: {
    backgroundColor: "#6FB4C7",
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain"
  }
});