import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/HomeScreen";
import HistoricoScreen from "../screens/HistoricoScreen";
import PerfilScreen from "../screens/PerfilScreen";
import AgendaScreen from "../screens/AgendaScreen";
import NovoAgendamentoScreen from "../screens/NovoAgendamentoScreen";

import { ABAS } from "../constants/data";
import { COLORS } from "../constants/theme";

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const TAB_KEYS = ["inicio", "agenda", "historico", "perfil"];

  return (
    <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ABAS.map((aba, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={aba.key}
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => {
              const route = state.routes[index];
              if (route) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Image
              source={aba.icon}
              style={[styles.navIcon, isActive && styles.navIconActive]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PlaceholderScreen() {
  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}

export default function TabNavigator({ route }) {
  const parentParams = route?.params || {};

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        initialParams={parentParams}
      />
      <Tab.Screen 
        name="AgendaTab" 
        component={AgendaScreen} 
        initialParams={parentParams} 
      />
      <Tab.Screen
        name="HistoricoTab"
        component={HistoricoScreen}
        initialParams={parentParams}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilScreen}
        initialParams={parentParams}
      />
      <Tab.Screen 
        name="NovoAgendamentoTab" 
        component={NovoAgendamentoScreen} 
        initialParams={parentParams} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  navIcon: {
    width: 80,
    height: 55,
    resizeMode: "contain",
    opacity: 0.45,
  },
  navIconActive: {
    opacity: 1,
  },
});
