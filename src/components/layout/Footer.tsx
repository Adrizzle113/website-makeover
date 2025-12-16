import { Link } from "react-router-dom";
import { Facebook, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <span className="font-heading text-heading-xl text-primary-foreground">
                Explo
              </span>
            </Link>
            <p className="text-body-md text-primary-foreground/70 mb-6">
              Creating unforgettable travel experiences since 2015. Let us turn 
              your travel dreams into reality.
            </p>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-heading text-heading-sm mb-6">Discover</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/about"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  to="/tours"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Tour Packages
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-heading text-heading-sm mb-6">Top Destinations</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/destinations/bali"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Bali, Indonesia
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations/switzerland"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Switzerland
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations/new-zealand"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  New Zealand
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations/iceland"
                  className="text-body-md text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Iceland
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-heading-sm mb-6">Contact</h4>
            <ul className="space-y-4 text-body-md text-primary-foreground/70">
              <li>hello@explo.travel</li>
              <li>+1 (800) 123-4567</li>
              <li>
                123 Adventure Street<br />
                San Francisco, CA 94102
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>

            {/* Copyright */}
            <div className="text-body-sm text-primary-foreground/50 text-center md:text-right">
              <p>© {currentYear} Explo Travel. All rights reserved.</p>
              <p className="mt-1">
                <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
                  Privacy Policy
                </Link>
                {" · "}
                <Link to="/terms" className="hover:text-primary-foreground transition-colors">
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}