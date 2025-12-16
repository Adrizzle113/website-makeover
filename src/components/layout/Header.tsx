import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
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
                Essential Pages
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur-sm">
                <DropdownMenuItem asChild>
                  <Link to="/">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/destinations">Destinations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tours">Tour Packages</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/about"
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              About
            </Link>
            <Link
              to="/blog"
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              Blogs
            </Link>
            <Link
              to="/trips"
              className="text-white/90 hover:text-white transition-colors text-body-md font-medium"
            >
              Trips
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
              View Package
            </Button>
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
              <Link
                to="/"
                className="text-white hover:text-cream transition-colors py-2 text-body-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/destinations"
                className="text-white hover:text-cream transition-colors py-2 text-body-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Destinations
              </Link>
              <Link
                to="/about"
                className="text-white hover:text-cream transition-colors py-2 text-body-md"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/blog"
                className="text-white hover:text-cream transition-colors py-2 text-body-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogs
              </Link>
              <Link
                to="/trips"
                className="text-white hover:text-cream transition-colors py-2 text-body-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Trips
              </Link>
              <div className="pt-4 border-t border-white/20">
                <Button className="w-full bg-cream text-primary hover:bg-cream/90 rounded-full">
                  View Package
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}