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
    "nav.calculator": "Calculator",
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
    
    // Instagram Section
    "instagram.badge": "Follow Us",
    "instagram.title": "Follow us online!",
    
    // Testimonial Section
    "testimonial.quote": "Booking Já created something better than I ever could have imagined. The attention to detail and personalized service made our honeymoon absolutely perfect.",
    "testimonial.author": "Sarah Mitchell",
    "testimonial.role": "Travel Enthusiast",
    "testimonial.cta.start": "Start Your Journey",
    "testimonial.cta.stories": "Read More Stories",
    
    // FAQ Section
    "faq.badge": "FAQ",
    "faq.title": "Frequently Asked Questions",
    "faq.description": "Find answers to common questions about our tours and services.",
    "faq.q1.question": "How do I book a tour with Booking Já?",
    "faq.q1.answer": "Booking is simple! Browse our tour packages, select your preferred dates, and complete the booking form. Our team will confirm your reservation within 24 hours.",
    "faq.q2.question": "What's included in the tour packages?",
    "faq.q2.answer": "Our packages typically include accommodation, transportation, guided tours, and select meals. Each package page details exactly what's included and what's optional.",
    "faq.q3.question": "Can I customize my tour itinerary?",
    "faq.q3.answer": "Absolutely! We offer customization options for most tours. Contact our team to discuss your preferences and we'll create a personalized experience just for you.",
    "faq.q4.question": "What is your cancellation policy?",
    "faq.q4.answer": "We offer free cancellation up to 30 days before departure. Cancellations within 30 days may incur fees depending on the tour. Full details are provided at booking.",
    "faq.q5.question": "Do you offer group discounts?",
    "faq.q5.answer": "Yes! Groups of 6 or more receive a 10% discount, and groups of 12+ receive 15% off. Contact us for custom group pricing on larger bookings.",
    
    // Calculator Section
    "calc.title": "See How Much More You Earn",
    "calc.description": "Compare your current commission with Booking Já's margin model. Set your own margin and see the difference instantly.",
    "calc.cta": "Create free account",
    "calc.disclaimer": "* Examples only. Actual margins vary by property and dates.",
    "calc.input.roomPrice": "Average Room Price (R$/night)",
    "calc.input.currentCommission": "Your current commission (%)",
    "calc.input.nightsPerStay": "Nights per stay",
    "calc.input.bookingsPerMonth": "Bookings per month",
    "calc.slider.yourCommission": "Your Commission",
    "calc.slider.clientSaves": "Client Saves",
    "calc.slider.min": "0% (Client saves 25%)",
    "calc.slider.max": "25% (Client saves 0%)",
    "calc.result.monthlyEarnings": "Your Monthly Earnings",
    "calc.result.yearlyEarnings": "Your Yearly Earnings",
    "calc.result.withBookingJa": "with Booking Já",
    "calc.result.vsToday": "vs {amount}/month today",
    "calc.result.morePerMonth": "more per month",
    "calc.result.morePerYear": "more per year",
    "calc.result.clientSavesNote": "Your client saves {pct}% off the public price",
    "calc.result.clientSavesEmphasis": "Your clients save {pct}%",
    "calc.result.clientSavesReason": "Lower prices = more bookings with you",
    "calc.result.placeholder": "Enter the public hotel price to see your potential earnings",
    "calc.presets.title": "Quick scenarios",
    "calc.presets.small": "Small Agency",
    "calc.presets.growing": "Growing Agency",
    "calc.presets.highVolume": "High Volume",
    "calc.cta.startEarning": "Start Earning More Today",
    "calc.cta.freeAccount": "Free Account",
    "calc.stats.maxSavings": "max savings",
    "calc.stats.maxMargin": "max margin",
    "calc.stats.monthlyFees": "monthly fees",
    "calc.stats.toGetStarted": "to get started",
    "calc.socialProof": "Join 500+ Brazilian agents already earning more",
    "calc.comparison.title": "Platform Comparison",
    "calc.comparison.platform": "Platform",
    "calc.comparison.commission": "Commission",
    "calc.comparison.yourProfit": "Your Profit",
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
    "nav.calculator": "Calculadora",
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
    
    // Instagram Section
    "instagram.badge": "Siga-nos",
    "instagram.title": "Siga-nos online!",
    
    // Testimonial Section
    "testimonial.quote": "A Booking JÁ criou algo melhor do que eu jamais poderia ter imaginado. A atenção aos detalhes e o serviço personalizado tornaram nossa lua de mel absolutamente perfeita.",
    "testimonial.author": "Sarah Mitchell",
    "testimonial.role": "Entusiasta de Viagens",
    "testimonial.cta.start": "Comece sua jornada",
    "testimonial.cta.stories": "Leia mais histórias",
    
    // FAQ Section
    "faq.badge": "Perguntas frequentes",
    "faq.title": "Perguntas frequentes",
    "faq.description": "Encontre respostas para perguntas comuns sobre nossos serviços.",
    "faq.q1.question": "Como faço para reservar um passeio com a Booking JÁ?",
    "faq.q1.answer": "Reservar é simples! Navegue pelos nossos pacotes turísticos, selecione as datas de sua preferência e preencha o formulário de reserva. Nossa equipe confirmará sua reserva em até 24 horas.",
    "faq.q2.question": "O que está incluído nos pacotes turísticos?",
    "faq.q2.answer": "Nossos pacotes geralmente incluem acomodação, transporte, passeios guiados e algumas refeições. A página de cada pacote detalha exatamente o que está incluído e o que é opcional.",
    "faq.q3.question": "Posso personalizar meu roteiro de viagem?",
    "faq.q3.answer": "Com certeza! Oferecemos opções de personalização para a maioria das viagens. Entre em contato com nossa equipe para discutir suas preferências e criaremos uma experiência personalizada só para você.",
    "faq.q4.question": "Qual é a sua política de cancelamento?",
    "faq.q4.answer": "Oferecemos cancelamento gratuito até 30 dias antes da partida. Cancelamentos com menos de 30 dias de antecedência podem estar sujeitos a taxas, dependendo do passeio. Informações completas serão fornecidas no momento da reserva.",
    "faq.q5.question": "Vocês oferecem descontos para grupos?",
    "faq.q5.answer": "Sim! Grupos de 6 ou mais pessoas recebem 10% de desconto, e grupos de 12 ou mais recebem 15% de desconto. Entre em contato conosco para obter preços personalizados para grupos maiores.",
    
    // Calculator Section
    "calc.title": "Veja Quanto Mais Você Ganha",
    "calc.description": "Compare sua comissão atual com o modelo de margem da Booking Já. Defina sua própria margem e veja a diferença instantaneamente.",
    "calc.cta": "Criar conta gratuita",
    "calc.disclaimer": "* Apenas exemplos. Margens reais variam por hotel e datas.",
    "calc.input.roomPrice": "Preço Médio do Quarto (R$/noite)",
    "calc.input.currentCommission": "Sua comissão atual (%)",
    "calc.input.nightsPerStay": "Noites por estadia",
    "calc.input.bookingsPerMonth": "Reservas por mês",
    "calc.slider.yourCommission": "Sua Comissão",
    "calc.slider.clientSaves": "Cliente Economiza",
    "calc.slider.min": "0% (Cliente economiza 25%)",
    "calc.slider.max": "25% (Cliente economiza 0%)",
    "calc.result.monthlyEarnings": "Seus Ganhos Mensais",
    "calc.result.yearlyEarnings": "Seus Ganhos Anuais",
    "calc.result.withBookingJa": "com Booking Já",
    "calc.result.vsToday": "vs {amount}/mês hoje",
    "calc.result.morePerMonth": "a mais por mês",
    "calc.result.morePerYear": "a mais por ano",
    "calc.result.clientSavesNote": "Seu cliente economiza {pct}% do preço público",
    "calc.result.clientSavesEmphasis": "Seus clientes economizam {pct}%",
    "calc.result.clientSavesReason": "Preços mais baixos = mais reservas com você",
    "calc.result.placeholder": "Digite o preço do hotel para ver seus ganhos potenciais",
    "calc.presets.title": "Cenários rápidos",
    "calc.presets.small": "Agência Pequena",
    "calc.presets.growing": "Em Crescimento",
    "calc.presets.highVolume": "Alto Volume",
    "calc.cta.startEarning": "Comece a Ganhar Mais Hoje",
    "calc.cta.freeAccount": "Conta Gratuita",
    "calc.stats.maxSavings": "economia máxima",
    "calc.stats.maxMargin": "margem máxima",
    "calc.stats.monthlyFees": "taxas mensais",
    "calc.stats.toGetStarted": "para começar",
    "calc.socialProof": "Junte-se a mais de 500 agentes brasileiros que já ganham mais",
    "calc.comparison.title": "Comparação de Plataformas",
    "calc.comparison.platform": "Plataforma",
    "calc.comparison.commission": "Comissão",
    "calc.comparison.yourProfit": "Seu Lucro",
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
