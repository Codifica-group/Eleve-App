import React, { useRef } from "react";
import { Text, Image, View, Pressable, Animated, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function ServiceCard({ servico, onPress, isSelected = true }) {
  const escala = useRef(new Animated.Value(1)).current;

  const pressionar = () => {
    Animated.spring(escala, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 3 }).start();
    if (onPress) onPress(servico.id);
  };

  const soltar = () =>
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();

  return (
    <Pressable onPressIn={pressionar} onPressOut={soltar} style={styles.pressable}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: escala }], shadowColor: servico.sombra },
          !isSelected && styles.cardUnselected
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: isSelected ? servico.cor : '#e0e0e0' }]}>
          <Image 
            source={servico.icon} 
            style={[styles.icon, !isSelected && { tintColor: '#999' }]} 
          />
        </View>
        <Text style={[styles.label, !isSelected && { color: '#999' }]}>{servico.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1, marginHorizontal: 5 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 22, paddingVertical: 18, paddingHorizontal: 6,
    alignItems: "center", gap: 10, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2,
    shadowRadius: 14, elevation: 7,
  },
  cardUnselected: {
    backgroundColor: '#f5f5f5', shadowOpacity: 0, elevation: 0, opacity: 0.7
  },
  iconCircle: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  icon: { width: 55, height: 55, resizeMode: "contain" },
  label: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.primaryMedium },
});