import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Text, 
  Pressable, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView ,
  Platform
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from "../../constants/theme";
import { enviarRequisicaoHttp } from "../../api/compartilhado/clienteHttp";
import { anexarArquivoAoFormData } from "../../utils/AIUtils";
import Markdown from 'react-native-markdown-display';

export default function AIBar() {
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const PROMPT_VETERINARIO = "Você é um veterinário experiente e especialista em saúde, nutrição e comportamento de cachorros. Escute a dúvida do usuário e responda de forma clara, acolhedora e altamente profissional.";

  async function handleRecordPress() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        alert('É necessário conceder permissão de microfone para usar esta função.');
      }
    } catch (err) {
      console.error('Falha ao iniciar a gravação:', err);
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);
      
      enviarAudioParaAPI(uri, 'audio_gravado.m4a', 'audio/mp4');
    } catch (error) {
      console.error('Falha ao parar a gravação:', error);
    }
  }

  async function pickAudioFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        enviarAudioParaAPI(file.uri, file.name, file.mimeType || 'audio/mpeg');
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo de áudio:', error);
    }
  }

  async function enviarAudioParaAPI(uri, name, type) {
    setModalVisible(false);
    setResultModalVisible(true);
    setIsLoading(true);
    setAiResponse("");

    try {
      const formData = new FormData();
      formData.append('prompt', PROMPT_VETERINARIO);

      await anexarArquivoAoFormData(formData, 'audio', uri, name || 'audio.m4a', type || 'audio/mp4');

      const respostaApi = await enviarRequisicaoHttp({
        metodo: 'POST',
        endpoint: '/audio/processar',
        corpoFormData: formData
      });

      setAiResponse(respostaApi?.resposta || respostaApi);

    } catch (error) {
      console.error('Erro na requisição da IA:', error);
      
      setAiResponse(
        error?.mensagem || 
        error?.message || 
        "Não foi possível se conectar à Inteligência Artificial. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Pressable style={styles.container} onPress={() => setModalVisible(true)}>
        <Text style={styles.input}>
          Pergunte a nossa IA
        </Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            
            <TouchableOpacity 
              style={[styles.roundButton, isRecording && styles.roundButtonRecording]} 
              onPress={handleRecordPress}
            >
              <FontAwesome name={isRecording ? "stop" : "microphone"} size={32} color={COLORS.white} />
              <Text style={styles.roundButtonText}>
                {isRecording ? "Parar" : "Falar"}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.fileButton} onPress={pickAudioFile}>
              <FontAwesome name="file-audio-o" size={18} color={COLORS.dark} style={{ marginRight: 8 }} />
              <Text style={styles.fileButtonText}>Enviar Arquivo de Áudio</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={resultModalVisible}
      >
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContent}>
            
            <TouchableOpacity 
              style={styles.closeIcon} 
              onPress={() => !isLoading && setResultModalVisible(false)}
              disabled={isLoading}
            >
              <FontAwesome name="times" size={24} color={isLoading ? "#ccc" : COLORS.dark} />
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>O Dr. IA está analisando sua pergunta...</Text>
              </View>
            ) : (
              <ScrollView style={styles.responseScroll} showsVerticalScrollIndicator={false}>
                <Markdown style={markdownStyles}>
                  {aiResponse}
                </Markdown>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    padding: 0,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white || "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  roundButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  roundButtonRecording: {
    backgroundColor: "#E53935",
  },
  roundButtonText: {
    color: COLORS.white || "#FFF",
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
    marginBottom: 20,
  },
  fileButton: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  fileButtonText: {
    color: COLORS.dark || "#333",
    fontFamily: FONTS.regular,
    fontSize: 15,
  },
  resultModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", 
  },
  resultModalContent: {
    width: '90%',
    height: '60%',
    backgroundColor: COLORS.white || "#FFF",
    borderRadius: 20,
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    fontSize: 16,
    textAlign: "center",
  },
  responseScroll: {
    flex: 1,
    marginTop: 10,
  },
  responseText: {
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    fontSize: 16,
    lineHeight: 24,
  }
});

const markdownStyles = {
  body: {
    fontFamily: FONTS?.regular,
    color: COLORS?.dark || '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontFamily: FONTS?.bold,
    fontSize: 22,
    color: COLORS?.primary || '#000',
    marginTop: 10,
    marginBottom: 5,
  },
  heading2: {
    fontFamily: FONTS?.bold,
    fontSize: 20,
    color: COLORS?.primary || '#000',
    marginTop: 10,
    marginBottom: 5,
  },
  strong: {
    fontFamily: FONTS?.bold,
  },
  paragraph: {
    marginTop: 5,
    marginBottom: 10,
  },
  list_item: {
    marginTop: 5,
  },
  bullet_list: {
    marginBottom: 10,
  },
  ordered_list: {
    marginBottom: 10,
  }
};