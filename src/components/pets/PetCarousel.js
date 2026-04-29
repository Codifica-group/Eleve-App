import React, { useRef } from "react";
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "../../constants/theme";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.85;
const ITEM_MARGIN = 20;

export default function PetCarousel({ pets, selectedPetId, onSelectPet }) {
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      onSelectPet(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

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
      snapToInterval={ITEM_WIDTH + ITEM_MARGIN}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: (width - ITEM_WIDTH) / 2, paddingVertical: 10 }}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}

const styles = StyleSheet.create({
  petCard: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 22,
    marginRight: ITEM_MARGIN,
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
    marginBottom: 0,
  },
  petCardTitle: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    color: COLORS.primaryDark,
    lineHeight: 28,
  },
  petPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.primary },
  petPhotoPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.blueLight, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.primary },
  petInfoValue: { fontSize: 16, fontFamily: FONTS.regular, color: COLORS.dark },
});