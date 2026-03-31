import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";
import { ABAS } from "../../constants/data";

export default function BottomNavBar({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ABAS.map((aba) => (
        <TouchableOpacity
          key={aba.key}
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => onTabPress(aba.key)}
        >
          <Image
            source={aba.icon}
            style={[
              styles.navIcon,
              activeTab === aba.key && styles.navIconActive,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  navIcon: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    opacity: 0.45,
  },
  navIconActive: {
    opacity: 1,
  },
});
