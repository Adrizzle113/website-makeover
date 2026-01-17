import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

export function ServicesSection() {
  const { t } = useLanguage();
  
  return (
    <section id="services" className="py-24 bg-primary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="badge-pill bg-primary-foreground/10 text-primary-foreground mb-6">
              {t('services.badge')}
            </span>
            <h2 className="font-heading text-display-md text-primary-foreground mb-6">
              {t('services.title')}
            </h2>
            <p className="text-body-lg text-primary-foreground/80 mb-10">
              {t('services.description')}
            </p>

            <Button
              asChild
              size="lg"
              className="h-14 rounded-full px-8 bg-cream text-primary hover:bg-cream/90 font-semibold group"
            >
              <Link to="/signup">
                {t('services.cta')}
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
                  <p className="text-primary-foreground/60 text-body-sm">{t('services.savings.label')}</p>
                  <p className="text-primary-foreground font-heading text-heading-lg">{t('services.savings.value')}</p>
                </div>
              </div>
              <p className="text-primary-foreground/70 text-body-sm">
                {t('services.savings.description')}
              </p>
            </div>

            <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-cream/10 rounded-full flex items-center justify-center">
                  <span className="text-cream font-heading text-xl font-bold">$</span>
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-body-sm">{t('services.profit.label')}</p>
                  <p className="text-primary-foreground font-heading text-heading-lg">{t('services.profit.value')}</p>
                </div>
              </div>
              <p className="text-primary-foreground/70 text-body-sm">
                {t('services.profit.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
