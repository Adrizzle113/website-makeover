import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CallToActionSection() {
  return (
    <section className="py-24 bg-primary">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-display-md text-primary-foreground mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-body-lg text-primary-foreground/80 mb-8">
            Subscribe to our newsletter for exclusive deals and travel inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="rounded-full bg-primary-foreground text-foreground"
            />
            <Button variant="secondary" className="rounded-full px-8">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
