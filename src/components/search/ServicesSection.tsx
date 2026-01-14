import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-primary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="badge-pill bg-primary-foreground/10 text-primary-foreground mb-6">
              Commission Comparison
            </span>
            <h2 className="font-heading text-display-md text-primary-foreground mb-6">
              See how much more you could earn
            </h2>
            <p className="text-body-lg text-primary-foreground/80 mb-10">
              Compare your current commissions with Booking Já's rates. Create a free account to access real pricing and start earning more on every booking.
            </p>

            <Button
              asChild
              size="lg"
              className="h-14 rounded-full px-8 bg-cream text-primary hover:bg-cream/90 font-semibold group"
            >
              <Link to="/signup">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Right Content - Stats */}
          <div className="space-y-6">
            <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cream/10 rounded-full flex items-center justify-center">
                  <span className="text-cream font-heading text-xl font-bold">%</span>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-body-sm">Average savings</p>
                  <p className="text-primary-foreground font-heading text-heading-lg">20-30% lower</p>
                </div>
              </div>
              <p className="text-primary-foreground/70 text-body-sm">
                Than major OTAs like Booking.com and Expedia
              </p>
            </div>

            <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cream/10 rounded-full flex items-center justify-center">
                  <span className="text-cream font-heading text-xl font-bold">$</span>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-body-sm">Your profit margin</p>
                  <p className="text-primary-foreground font-heading text-heading-lg">You keep it all</p>
                </div>
              </div>
              <p className="text-primary-foreground/70 text-body-sm">
                No hidden fees or commission splits on your bookings
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
