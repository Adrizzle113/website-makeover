import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TestimonialSection() {
  return (
    <section className="py-24 bg-muted">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Quote Icon */}
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <Quote className="h-8 w-8 text-primary-foreground" />
          </div>

          {/* Quote Text */}
          <blockquote className="font-heading text-heading-xl md:text-display-md text-foreground mb-10">
            "Explo created something better than I ever could have imagined. 
            The attention to detail and personalized service made our honeymoon 
            absolutely perfect."
          </blockquote>

          {/* Author */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
              alt="Sarah Mitchell"
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="text-left">
              <div className="font-heading text-heading-sm text-foreground">
                Sarah Mitchell
              </div>
              <div className="text-body-sm text-muted-foreground">
                Travel Enthusiast
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="rounded-full px-8">
              Start Your Journey
            </Button>
            <Button variant="outline" className="rounded-full px-8">
              Read More Stories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}