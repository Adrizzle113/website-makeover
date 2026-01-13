import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "pt-BR";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  "en": {
    // Header
    "nav.explore": "Explore",
    "nav.destinations": "Destinations",
    "nav.tourPackages": "Tour Packages",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.dashboard": "Dashboard",
  },
  "pt-BR": {
    // Header
    "nav.explore": "Explorar",
    "nav.destinations": "Destinos",
    "nav.tourPackages": "Pacotes de Viagem",
    "nav.services": "Serviços",
    "nav.about": "Sobre",
    "nav.blog": "Blog",
    "nav.contact": "Contato",
    "nav.dashboard": "Painel",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("language");
    return (stored === "pt-BR" || stored === "en") ? stored : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

/**
 * Get the current language from localStorage (for use outside of React components)
 * Returns the stored language code (e.g., "en", "pt-BR")
 */
export function getLanguage(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("language");
    return stored || "en";
  }
  return "en";
}

/**
 * Set the language in localStorage (for use outside of React components)
 */
export function setLanguageStorage(lang: Language): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", lang);
  }
}
