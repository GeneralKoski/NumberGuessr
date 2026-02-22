import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import it from "./locales/it/translation.json";

const supportedLngs = ["en", "it", "fr", "es"];

function detectLanguage(): string {
  const browserLang = navigator.language.split("-")[0];
  return supportedLngs.includes(browserLang) ? browserLang : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
