import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  label: string;
}

const languages: Language[] = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  const currentLang =
    languages.find((l) => l.code === i18n.language.split("-")[0]) ||
    languages[0];

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#111] hover:bg-white/5 border border-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-lg"
      >
        <Globe size={16} className="text-[var(--accent-color)]" />
        <span className="text-xs font-black text-white uppercase tracking-widest mt-[1px]">
          {currentLang.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-32 bg-[#0b0f19] border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  i18n.language.split("-")[0] === lang.code
                    ? "bg-[var(--accent-color)] text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {lang.label}
                {i18n.language.split("-")[0] === lang.code && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
