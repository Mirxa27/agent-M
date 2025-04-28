import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import enTranslation from '../locales/en.json';
import arTranslation from '../locales/ar.json';

// Configure i18next
i18n
  // Use language detector to automatically detect preferred language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ar: {
        translation: arTranslation
      }
    },
    fallbackLng: 'en',
    // Debug enabled in development environment only
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    
    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      
      // Keys or params to lookup language from
      lookupLocalStorage: 'mirxaLanguage',
      
      // Cache user language on localStorage
      caches: ['localStorage'],
      
      // Only detect languages that are in the 'resources' list
      checkWhitelist: true
    },
    
    // React specific options
    react: {
      useSuspense: true,
    }
  });

export default i18n;