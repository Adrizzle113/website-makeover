import { CheckCircle, Headphones, Shield, MapPin } from "lucide-react";

export function AboutSection() {
  const features = [
    { icon: Shield, label: "No Booking Fee" },
    { icon: Headphones, label: "24/7 Helpline" },
  ];

  const stats = [
    { value: "100%", label: "Verified" },
    { value: "239+", label: "Tours" },
    { value: "110", label: "Destinations" },
    { value: "15K+", label: "Happy Travelers" },
  ];

  return (
    <section id="about" className="py-24 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="badge-pill bg-secondary text-secondary-foreground mb-6">
              About Us
            </span>
            <h2 className="font-heading text-display-md text-foreground mb-6">
              Explore the Wonders of the Great Outdoors
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              We're passionate about connecting travelers with extraordinary 
              destinations. Our team of experts crafts unique experiences that 
              go beyond ordinary tourism, creating memories that last a lifetime.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-4 mb-10">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full"
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-body-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-heading-xl font-heading text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-body-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=800&q=80"
                alt="Travelers exploring nature"
                className="w-full h-full object-cover"
              />
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
    </section>
  );
}