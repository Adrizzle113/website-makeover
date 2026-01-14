import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Percent, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-primary text-primary-foreground">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Stats/Icons row */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="w-16 h-16 rounded-full bg-cream/10 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-cream" />
            </div>
            <div className="w-16 h-16 rounded-full bg-cream/10 flex items-center justify-center">
              <Percent className="w-8 h-8 text-cream" />
            </div>
            <div className="w-16 h-16 rounded-full bg-cream/10 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-cream" />
            </div>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-display-lg text-primary-foreground mb-6">
            See how much more you could earn
          </h2>

          {/* Subtext */}
          <p className="text-body-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Compare your current commissions with Booking Já's rates.
          </p>

          {/* CTA Button */}
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full px-10 bg-cream text-primary hover:bg-cream/90 font-semibold text-lg group"
          >
            <Link to="/signup">
              Create free account to access real rates
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}