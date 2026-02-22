import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import it from "./locales/it/translation.json";

const supportedLngs = ["en", "it", "fr", "es"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: "en",
    supportedLngs,
    interpolation: { escapeValue: false },
    detection: {
      order: ["navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage", "cookie"],
    },
  });

export default i18n;
