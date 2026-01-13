import { useLanguage } from "@/hooks/useLanguage";

// Simple flag components as SVGs
const USFlag = () => (
  <svg viewBox="0 0 512 512" className="w-full h-full">
    <rect fill="#bf0a30" width="512" height="512" />
    <rect fill="#fff" y="39.4" width="512" height="39.4" />
    <rect fill="#fff" y="118.2" width="512" height="39.4" />
    <rect fill="#fff" y="197" width="512" height="39.4" />
    <rect fill="#fff" y="275.8" width="512" height="39.4" />
    <rect fill="#fff" y="354.6" width="512" height="39.4" />
    <rect fill="#fff" y="433.4" width="512" height="39.4" />
    <rect fill="#002868" width="204.8" height="275.8" />
  </svg>
);

const BrazilFlag = () => (
  <svg viewBox="0 0 512 360" className="w-full h-full">
    <rect fill="#009739" width="512" height="360" />
    <polygon fill="#FEDD00" points="256,20 492,180 256,340 20,180" />
    <circle fill="#002776" cx="256" cy="180" r="80" />
    <path fill="#fff" d="M176,180 Q256,140 336,180 Q256,200 176,180" />
  </svg>
);

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "pt-BR" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-all hover:scale-110 shadow-md"
      aria-label={language === "en" ? "Switch to Portuguese" : "Switch to English"}
      title={language === "en" ? "Mudar para Português" : "Switch to English"}
    >
      {/* Show the flag you can switch TO */}
      {language === "en" ? <BrazilFlag /> : <USFlag />}
    </button>
  );
}
