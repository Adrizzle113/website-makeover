import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface CompetitorData {
  booking: { name: string; commission: number; profit: number };
  expedia: { name: string; commission: number; profit: number };
  bookingJa: { name: string; commission: number; profit: number };
}

interface PlatformComparisonSectionProps {
  competitors: CompetitorData;
  agentCommission: number;
  formatCurrency: (value: number) => string;
}

export function PlatformComparisonSection({
  competitors,
  agentCommission,
  formatCurrency,
}: PlatformComparisonSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 py-16 bg-muted w-screen -ml-[calc((100vw-100%)/2)]">
      <div className="container">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <h3 className="font-heading text-heading-lg text-foreground text-center mb-2">
            {t("calc.comparison.title")}
          </h3>
          <p className="text-muted-foreground text-center mb-10 text-sm">
            Veja quanto você pode ganhar em cada plataforma
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Booking.com */}
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-muted-foreground">B</span>
              </div>
              <p className="text-foreground font-medium mb-1">Booking.com</p>
              <p className="text-muted-foreground text-xs mb-4">10% {t("calc.comparison.commission").toLowerCase()}</p>
              <p className="font-heading text-2xl text-muted-foreground mb-1">
                {formatCurrency(competitors.booking.profit * 12)}
              </p>
              <p className="text-muted-foreground text-xs">/ano</p>
            </div>
            
            {/* Expedia TAAP */}
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-muted-foreground">E</span>
              </div>
              <p className="text-foreground font-medium mb-1">Expedia TAAP</p>
              <p className="text-muted-foreground text-xs mb-4">8% {t("calc.comparison.commission").toLowerCase()}</p>
              <p className="font-heading text-2xl text-muted-foreground mb-1">
                {formatCurrency(competitors.expedia.profit * 12)}
              </p>
              <p className="text-muted-foreground text-xs">/ano</p>
            </div>
            
            {/* Booking Já - Highlighted */}
            <div className="bg-primary/5 border-2 border-primary rounded-xl p-6 text-center relative shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" /> MELHOR OPÇÃO
                </span>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                <span className="text-lg font-bold text-primary">BJ</span>
              </div>
              <p className="text-primary font-semibold mb-1">Booking Já</p>
              <p className="text-muted-foreground text-xs mb-4">{agentCommission}% {t("calc.comparison.commission").toLowerCase()}</p>
              <p className="font-heading text-2xl text-primary mb-1">
                {formatCurrency(competitors.bookingJa.profit * 12)}
              </p>
              <p className="text-muted-foreground text-xs">/ano</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
