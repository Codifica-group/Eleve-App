import React from "react";
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "../../constants/theme";

const { width } = Dimensions.get("window");

export default function PetCarousel({ pets, selectedPetId, onSelectPet }) {
  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedPetId;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectPet(item.id)}>
        <View style={[styles.petCard, isSelected && styles.petCardSelected]}>
          <View style={styles.petHeader}>
            <View>
              <Text style={styles.petCardTitle}>{item.nome}</Text>
            <Text style={styles.petInfoValue}>{item.raca?.nome || "Não informada"}</Text>
            </View>
            {item.foto ? (
              <Image source={{ uri: item.foto }} style={styles.petPhoto} />
            ) : (
              <View style={styles.petPhotoPlaceholder}>
                <FontAwesome name="paw" size={28} color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToAlignment="center"
      snapToInterval={width * 0.85 + 20}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  petCard: {
    width: width * 0.85,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 22,
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  petCardSelected: {
    borderColor: COLORS.primary,
  },
  petHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  petCardTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    lineHeight: 28,
  },
  petPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.primary },
  petPhotoPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.blueLight, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.primary },
  petInfoGrid: { flexDirection: "row", flexWrap: "wrap" },
  petInfoItem: { width: "100%", marginBottom: 16 },
  petInfoLabel: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primaryMedium, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  petInfoValue: { fontSize: 16, fontFamily: FONTS.regular, color: COLORS.dark },
});