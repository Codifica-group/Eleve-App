import React from "react";
import { View, StyleSheet } from "react-native";

export default function ProgressBar({ total, current }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            i < current ? styles.active : styles.inactive
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bar: {
    width: 35,
    height: 5,
    borderRadius: 10,
    marginHorizontal: 3
  },
  active: {
    backgroundColor: "white"
  },
  inactive: {
    backgroundColor: "rgba(255, 255, 255, 0.4)"
  }
});