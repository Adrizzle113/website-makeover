import { Shield, Clock, HeadphonesIcon, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description:
      "Your transactions are protected with industry-leading security protocols.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description:
      "Our dedicated team is available around the clock to assist you.",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Assistance",
    description:
      "Get personalized recommendations from our travel specialists.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description:
      "Access to over 2 million properties in destinations worldwide.",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-accent-text text-primary uppercase tracking-widest mb-3">
            Why Choose Us
          </p>
          <h2 className="font-heading text-heading-big text-foreground">
            Your Trusted Partner
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center group hover:transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-heading-small text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-body-small text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
