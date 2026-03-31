import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Image, FlatList, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH - 48;

export default function PromoCarousel({ data, autoScrollInterval = 4000 }) {
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % data.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoScrollInterval);
  }, [data.length, autoScrollInterval]);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(intervalRef.current);
  }, [startAutoScroll]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleScrollEnd = () => {
    startAutoScroll();
  };

  const renderItem = useCallback(
    ({ item }) => <Image source={item} style={styles.image} />,
    []
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: CAROUSEL_WIDTH,
      offset: CAROUSEL_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
      />
      <View style={styles.dotsContainer}>
        {data.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  image: {
    width: CAROUSEL_WIDTH,
    height: 200,
    borderRadius: 16,
    resizeMode: "cover",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dotActive: {
    backgroundColor: "#6FB4C7",
    width: 36,
  },
});
