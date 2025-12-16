import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-heading text-heading-standard text-white">
              TravelBooking
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-white/90 hover:text-white transition-colors text-body-small font-medium"
            >
              Search Hotels
            </Link>
            <Link
              to="/bookings"
              className="text-white/90 hover:text-white transition-colors text-body-small font-medium"
            >
              My Bookings
            </Link>
            <Link
              to="/support"
              className="text-white/90 hover:text-white transition-colors text-body-small font-medium"
            >
              Support
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button className="bg-white text-primary hover:bg-white/90">
              Register
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-accent/95 backdrop-blur-sm rounded-lg p-4 mb-4">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-white hover:text-primary-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Search Hotels
              </Link>
              <Link
                to="/bookings"
                className="text-white hover:text-primary-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                My Bookings
              </Link>
              <Link
                to="/support"
                className="text-white hover:text-primary-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-white/20">
                <Button variant="ghost" className="text-white hover:bg-white/10 justify-start">
                  Sign In
                </Button>
                <Button className="bg-white text-primary hover:bg-white/90">
                  Register
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
