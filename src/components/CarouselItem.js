import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function CarouselItem({ image, width }) {
  return (
    <View style={[styles.container, { width }]}>
      <Image source={image} style={[styles.image, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: 140, // Adicionei a altura aqui para a imagem aparecer
  },
  image: {
    height: "100%",
    resizeMode: "cover"
  }
});