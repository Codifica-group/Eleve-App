import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import pt from './pt.json';
import es from './es.json';

const resources = {
  pt: { translation: pt },
  es: { translation: es },
};

// Pega o idioma principal do dispositivo
const deviceLanguage = Localization.getLocales()[0].languageCode;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage === 'es' ? 'es' : 'pt', // Usa espanhol se for o idioma do celular, caso contrário usa PT
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;