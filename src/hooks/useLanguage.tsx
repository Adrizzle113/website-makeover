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
    // Hero
    "hero.tagline": "Stop losing money with expensive suppliers.",
    "hero.title1": "BETTER RATES",
    "hero.title2": "HIGHER COMMISSIONS",
    "hero.title3": "MADE FOR BRAZILIAN AGENTS",
    "hero.description": "Access rates 20–30% lower than TAAP, Booking.com, and HotelBeds — and keep the profit you deserve.",
    "hero.cta": "Create Free Account",
    // Hero Card
    "hero.card.title": "Luxury Suite",
    "hero.card.description": "Experience premium comfort",
    "hero.social.count": "84k+ People",
    "hero.social.label": "Joined our tours",
    // About Section
    "about.badge": "How It Works",
    "about.title": "U.S.A. hotel rates, now available in Brasil!",
    "about.description": "We make it simple for Brazilian travel agents to access industry-leading rates and book with confidence.",
    "about.feature.noFee": "No Booking Fee",
    "about.feature.helpline": "24/7 Helpline",
    "about.step1.title": "Create Your Free Account",
    "about.step1.description": "Sign up in seconds and unlock exclusive hotel rates instantly.",
    "about.step2.title": "Search & Compare",
    "about.step2.description": "Browse thousands of properties with 20–30% lower pricing than major platforms.",
    "about.step3.title": "Book & Earn More",
    "about.step3.description": "Keep the profit margin you deserve on every reservation.",
    "about.step4.title": "Get WhatsApp Support",
    "about.step4.description": "Talk to our team anytime in Portuguese—fast, friendly, expert help.",
    "about.card.title": "International Rates",
    "about.card.description": "The same hotel pricing trusted by US travel agents.",
    // Services Section
    "services.badge": "Commission Comparison",
    "services.title": "See how much more you could earn",
    "services.description": "Compare your current commissions with Booking Já's rates. Create a free account to access real pricing and start earning more on every booking.",
    "services.cta": "Create free account",
    "services.savings.label": "Average savings",
    "services.savings.value": "20-30% lower",
    "services.savings.description": "Than major OTAs like Booking.com and Expedia",
    "services.profit.label": "Your profit margin",
    "services.profit.value": "You keep it all",
    "services.profit.description": "No hidden fees or commission splits on your bookings",
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
    // Hero
    "hero.tagline": "Pare de perder dinheiro com fornecedores caros.",
    "hero.title1": "MELHORES TAXAS",
    "hero.title2": "COMISSÕES MAIORES",
    "hero.title3": "FEITO PARA AGENTES BRASILEIROS",
    "hero.description": "Acesse tarifas 20 a 30% mais baixas do que as da TAAP, Booking.com e HotelBeds — e fique com o lucro que você merece.",
    "hero.cta": "Crie sua conta gratuita",
    // Hero Card
    "hero.card.title": "Suíte de Luxo",
    "hero.card.description": "Experimente conforto premium",
    "hero.social.count": "84 mil+ Pessoas",
    "hero.social.label": "Já se juntaram",
    // About Section
    "about.badge": "Como funciona",
    "about.title": "Tarifas de hotéis dos EUA, agora disponíveis no Brasil!",
    "about.description": "Facilitamos o acesso dos agentes de viagens brasileiros às melhores tarifas do mercado, com um processo de reservas transparente e confiável.",
    "about.feature.noFee": "Sem taxa de reserva",
    "about.feature.helpline": "Linha de apoio 24 horas por dia, 7 dias por semana",
    "about.step1.title": "Crie sua conta gratuita",
    "about.step1.description": "Cadastre-se em segundos e desbloqueie tarifas exclusivas de hotéis instantaneamente.",
    "about.step2.title": "Pesquise e compare",
    "about.step2.description": "Veja milhares de imóveis com preços 20 a 30% mais baixos do que nas principais plataformas.",
    "about.step3.title": "Reserve e Ganhe Mais",
    "about.step3.description": "Mantenha a margem de lucro que você merece em cada reserva.",
    "about.step4.title": "Obtenha suporte pelo WhatsApp",
    "about.step4.description": "Fale com nossa equipe a qualquer hora em português — ajuda rápida, amigável e especializada.",
    "about.card.title": "Tarifas internacionais",
    "about.card.description": "Os mesmos preços de hotéis em que os agentes de viagens dos EUA confiam.",
    // Services Section
    "services.badge": "Comparação de Comissões",
    "services.title": "Veja quanto mais você pode ganhar",
    "services.description": "Compare suas comissões atuais com as taxas da Booking Já. Crie uma conta gratuita para acessar preços reais e comece a ganhar mais em cada reserva.",
    "services.cta": "Criar conta gratuita",
    "services.savings.label": "Economia média",
    "services.savings.value": "20-30% menor",
    "services.savings.description": "Em comparação com as principais Agências de Viagens Online, como Booking.com e Expedia",
    "services.profit.label": "Sua margem de lucro",
    "services.profit.value": "É toda sua",
    "services.profit.description": "Sem taxas ocultas ou divisão de comissões sobre suas reservas",
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
