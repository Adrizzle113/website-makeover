import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-accent text-white py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-heading-standard mb-4">
              TravelBooking
            </h3>
            <p className="text-white/70 text-body-small mb-6">
              Your trusted B2B partner for hotel bookings worldwide. Access
              exclusive rates and grow your travel business.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  Search Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/bookings"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/help"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-white/70 hover:text-white transition-colors text-body-small"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70 text-body-small">
                <Mail className="h-4 w-4" />
                support@travelbooking.com
              </li>
              <li className="flex items-center gap-3 text-white/70 text-body-small">
                <Phone className="h-4 w-4" />
                +1 (800) 123-4567
              </li>
              <li className="flex items-start gap-3 text-white/70 text-body-small">
                <MapPin className="h-4 w-4 mt-1" />
                <span>
                  123 Travel Street
                  <br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/50 text-body-small">
          <p>
            © {new Date().getFullYear()} TravelBooking. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
