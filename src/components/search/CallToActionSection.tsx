import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CallToActionSection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-heading text-heading-big text-primary-foreground mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-body-large text-primary-foreground/80 mb-8">
            Join thousands of travel agents who trust us for their hotel
            bookings. Get access to exclusive rates and start earning more
            today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-accent font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
