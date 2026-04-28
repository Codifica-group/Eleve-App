import { Platform } from "react-native";

export async function anexarArquivoAoFormData(formData, campo, uri, nome, tipo) {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append(campo, blob, nome || 'arquivo');
  } else {
    const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') ? `file://${uri}` : uri;
    formData.append(campo, {
      uri: fileUri,
      name: nome || 'arquivo',
      type: tipo || 'application/octet-stream',
    });
  }
}