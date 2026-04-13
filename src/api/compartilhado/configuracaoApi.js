import { Platform } from "react-native";
import Constants from "expo-constants";

function normalizarEnderecoBase(enderecoBase) {
  if (!enderecoBase || typeof enderecoBase !== "string") {
    return null;
  }

  const enderecoSemEspacos = enderecoBase.trim();
  if (!enderecoSemEspacos) {
    return null;
  }

  return enderecoSemEspacos.replace(/\/+$/, "");
}

function extrairIpDoHostUri() {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoConfig?.extra?.metro?.host ||
    "";
  const match = String(hostUri).match(
    /(?:(?:http|https):\/\/)?((?:\d{1,3}\.){3}\d{1,3})/
  );
  return match ? match[1] : null;
}

function obterEnderecoBasePadrao() {
  if (Platform.OS === "android") {
    const ipLan = extrairIpDoHostUri();
    if (ipLan) {
      return `http://${ipLan}:8080/api`;
    }
    return "http://10.0.2.2:8080/api";
  }

  const ipLan = extrairIpDoHostUri();
  if (ipLan) {
    return `http://${ipLan}:8080/api`;
  }
  return "http://localhost:8080/api";
}

export function obterEnderecoBaseApi() {
  const possiveis = [
    process.env.EXPO_PUBLIC_ENDERECO_API,
    process.env.EXPO_PUBLIC_API_URL,
  ];

  const configurado = possiveis.map(normalizarEnderecoBase).find(Boolean);
  return configurado || obterEnderecoBasePadrao();
}
