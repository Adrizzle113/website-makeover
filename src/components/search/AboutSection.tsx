import { CheckCircle, Headphones, Shield, MapPin } from "lucide-react";
export function AboutSection() {
  const features = [{
    icon: Shield,
    label: "No Booking Fee"
  }, {
    icon: Headphones,
    label: "24/7 Helpline"
  }];
  const steps = [{
    step: "1",
    title: "Create Your Free Account",
    description: "Sign up in seconds and unlock exclusive hotel rates instantly."
  }, {
    step: "2",
    title: "Search & Compare",
    description: "Browse thousands of properties with 20–30% lower pricing than major platforms."
  }, {
    step: "3",
    title: "Book & Earn More",
    description: "Keep the profit margin you deserve on every reservation."
  }, {
    step: "4",
    title: "Get WhatsApp Support",
    description: "Talk to our team anytime in Portuguese—fast, friendly, expert help."
  }];
  return <section id="about" className="py-24 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="badge-pill bg-secondary text-secondary-foreground mb-6">
              How It Works  
            </span>
            <h2 className="font-heading text-display-md text-foreground mb-6">
              U.S.A. hotel rates, now available in Brasil!
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">We make it simple for Brazilian travel agents to access industry-leading rates and book with confidence.</p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-4 mb-10">
              {features.map((feature, index) => <div key={index} className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-body-sm font-medium">{feature.label}</span>
                </div>)}
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-heading font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-heading-sm text-foreground mb-1">
                      {item.title}
                    </h4>
                    <p className="text-body-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=800&q=80" alt="Travelers exploring nature" className="w-full h-full object-cover" />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-card max-w-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="font-heading text-heading-sm">Expert Guides</span>
              </div>
              <p className="text-body-sm text-muted-foreground">
                Local experts who know every hidden gem
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}