import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CallToActionSection() {
  return (
    <section className="py-24 bg-primary">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <span className="heading-spaced text-primary-foreground/70 mb-6 block">
            Newsletter
          </span>
          <h2 className="font-heading text-display-md text-primary-foreground mb-4">
            Get Travel Inspiration
          </h2>
          <p className="text-body-lg text-primary-foreground/80 mb-10">
            Subscribe to our newsletter and receive exclusive deals, travel tips, 
            and destination guides straight to your inbox.
          </p>

          {/* Newsletter Form */}
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-14 rounded-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 px-6"
            />
            <Button 
              type="submit"
              className="h-14 rounded-full px-8 bg-cream text-primary hover:bg-cream/90 font-semibold group"
            >
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          <p className="text-body-sm text-primary-foreground/60 mt-6">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}