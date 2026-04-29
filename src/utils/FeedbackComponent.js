import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, PanResponder } from 'react-native';
import FeedbackManager from './FeedbackManager';

const Feedback = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  // Valor animado para o eixo Y (150 significa que começa escondido para baixo)
  const panY = useRef(new Animated.Value(150)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    // Registra o componente no gerenciador global
    FeedbackManager.setRef({
      show: (msg, feedbackType = 'success') => {
        setMessage(msg);
        setType(feedbackType);
        setVisible(true);

        // Animação de entrada subindo
        panY.setValue(150);
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();

        // Reseta o timer caso seja chamado várias vezes seguidas
        if (timerRef.current) clearTimeout(timerRef.current);
        
        // Timer de 5 segundos
        timerRef.current = setTimeout(() => {
          hideFeedback();
        }, 5000);
      },
    });
  }, []);

  const hideFeedback = () => {
    // Animação para descer o alerta e desaparecer
    Animated.timing(panY, {
      toValue: 150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  // Configuração do gesto de arrastar para baixo
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Permite apenas arrastar para baixo
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Se arrastou mais de 50 pixels para baixo, esconde o alerta
        if (gestureState.dy > 50) {
          if (timerRef.current) clearTimeout(timerRef.current);
          hideFeedback();
        } else {
          // Se não arrastou o suficiente, volta para a posição original com mola
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  // Definição das cores baseadas no tipo
  const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY: panY }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Altura padrão para ficar em cima da TabBar inferior
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999, // Garante que ficará sobre qualquer outra coisa
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Feedback;