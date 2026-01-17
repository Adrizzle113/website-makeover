import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/hooks/useLanguage";

interface HeaderProps {
  variant?: "light" | "dark";
}

export function Header({ variant = "light" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  // Light variant = light background, use dark text; Dark variant = dark background, use white text
  const textColor = variant === "light" ? "text-foreground" : "text-white";
  const textColorMuted = variant === "light" ? "text-muted-foreground" : "text-white/80";
  const hoverColor = variant === "light" ? "hover:text-primary" : "hover:text-white";
  
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({
      behavior: "smooth"
    });
    setIsMenuOpen(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 mt-4 md:mt-8 mx-[21px] md:mx-[37px]">
      <div className="container">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className={`font-heading text-heading-lg ${textColor}`}>
              Booking Já 
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/calculator" className={`${textColorMuted} ${hoverColor} transition-colors text-body-md font-medium`}>
              {t("nav.calculator")}
            </Link>
            <button onClick={() => scrollToSection("about")} className={`${textColorMuted} ${hoverColor} transition-colors text-body-md font-medium`}>
              {t("nav.about")}
            </button>
            <Link to="/contact" className={`${textColorMuted} ${hoverColor} transition-colors text-body-md font-medium`}>
              {t("nav.contact")}
            </Link>
          </nav>

          {/* CTA Button & Language Toggle */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageToggle />
            <Link to="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                {t("nav.dashboard")}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <LanguageToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`${textColor} p-2`}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-primary/95 backdrop-blur-sm rounded-2xl p-6 mb-4">
            <nav className="flex flex-col gap-4">
              <Link to="/calculator" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-cream transition-colors py-2 text-body-md text-left">
                Calculator
              </Link>
              <button onClick={() => scrollToSection("about")} className="text-white hover:text-cream transition-colors py-2 text-body-md text-left">
                About
              </button>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-cream transition-colors py-2 text-body-md text-left">
                Contact
              </Link>
              <div className="pt-4 border-t border-white/20 flex flex-col gap-2">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-cream text-primary hover:bg-cream/90 rounded-full">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}