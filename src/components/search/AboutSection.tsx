import { Headphones, Shield, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import santoriniHouse from "@/assets/santorini-house.png";
import { useLanguage } from "@/hooks/useLanguage";

function StepsGrid({ steps }: { steps: { step: string; title: string; description: string }[] }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = itemRefs.current.map((ref, index) => {
      if (!ref) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, index]);
            }, index * 150);
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {steps.map((item, index) => (
        <div
          key={index}
          ref={(el) => (itemRefs.current[index] = el)}
          className={`flex gap-4 transition-all duration-500 ${
            visibleItems.includes(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
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
  );
}

export function AboutSection() {
  const { t } = useLanguage();
  
  const features = [{
    icon: Shield,
    label: t('about.feature.noFee')
  }, {
    icon: Headphones,
    label: t('about.feature.helpline')
  }];
  
  const steps = [{
    step: "1",
    title: t('about.step1.title'),
    description: t('about.step1.description')
  }, {
    step: "2",
    title: t('about.step2.title'),
    description: t('about.step2.description')
  }, {
    step: "3",
    title: t('about.step3.title'),
    description: t('about.step3.description')
  }, {
    step: "4",
    title: t('about.step4.title'),
    description: t('about.step4.description')
  }];
  
  return <section id="about" className="py-24 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="badge-pill bg-secondary text-secondary-foreground mb-6">
              {t('about.badge')}
            </span>
            <h2 className="font-heading text-display-md text-foreground mb-6">
              {t('about.title')}
            </h2>
            <p className="text-body-lg text-muted-foreground mb-8">{t('about.description')}</p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-4 mb-10">
              {features.map((feature, index) => <div key={index} className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-body-sm font-medium">{feature.label}</span>
                </div>)}
            </div>

            {/* Steps Grid */}
            <StepsGrid steps={steps} />
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img src={santoriniHouse} alt="Beautiful Santorini architecture with pink flowers" className="w-full h-full object-cover" />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-card max-w-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="font-heading text-heading-sm">{t('about.card.title')}</span>
              </div>
              <p className="text-body-sm text-muted-foreground">
                {t('about.card.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}