import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, CalendarCheck } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 mt-4 md:mt-8 mx-[21px] md:mx-[37px]">
      <div className="container">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-heading text-heading-lg text-white">
              Explo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-body-md font-medium">
                Explore
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-sm">
                <DropdownMenuItem 
                  onClick={() => scrollToSection("destinations")}
                  className="cursor-pointer"
                >
                  Destinations
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => scrollToSection("tour-packages")}
                  className="cursor-pointer"
                >
                  Tour Packages
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => scrollToSection("services")}
                  className="cursor-pointer"
                >
                  Services
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => scrollToSection("about")}
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("blog")}
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              Blog
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              Contact
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/my-bookings">
              <Button 
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-full px-4 gap-2"
              >
                <CalendarCheck className="h-4 w-4" />
                My Bookings
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
              >
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-primary/95 backdrop-blur-sm rounded-2xl p-6 mb-4">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("about")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("destinations")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                Destinations
              </button>
              <button
                onClick={() => scrollToSection("tour-packages")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                Tour Packages
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("blog")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                Blog
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-white hover:text-cream transition-colors py-2 text-body-md text-left"
              >
                Contact
              </button>
              <div className="pt-4 border-t border-white/20 flex flex-col gap-2">
                <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10 rounded-full gap-2"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    className="w-full bg-cream text-primary hover:bg-cream/90 rounded-full"
                  >
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
