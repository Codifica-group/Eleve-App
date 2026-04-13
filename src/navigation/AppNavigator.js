import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoadingScreen from "../screens/LoadingScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import PetRegistrationScreen from "../screens/PetRegistration";
import UploadPhotoScreen from "../screens/UploadPhotoScreen";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PetRegistration" component={PetRegistrationScreen} />
      <Stack.Screen
        name="UploadPhoto"
        component={UploadPhotoScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="Home" component={TabNavigator} />
    </Stack.Navigator>
  );
}
