import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { AnimatedNumber } from "./AnimatedNumber";

interface CalculatorResult {
  today: {
    retail: number;
    commissionPct: number;
    profitPerRoom: number;
    monthlyProfit: number;
    yearlyProfit: number;
  };
  bookingJa: {
    retail: number;
    cost: number;
    agentCommissionPct: number;
    sellPrice: number;
    profitPerRoom: number;
    clientSavingsPct: number;
    monthlyProfit: number;
    yearlyProfit: number;
  };
  difference: {
    perRoom: number;
    perMonth: number;
    perYear: number;
    percentIncrease: number;
  };
  competitors: {
    booking: { name: string; commission: number; profit: number };
    expedia: { name: string; commission: number; profit: number };
    bookingJa: { name: string; commission: number; profit: number };
  };
}

interface CalculatorFormSectionProps {
  retailPrice: string;
  setRetailPrice: (value: string) => void;
  nightsPerStay: string;
  setNightsPerStay: (value: string) => void;
  bookingsPerMonth: string;
  setBookingsPerMonth: (value: string) => void;
  currentCommission: string;
  setCurrentCommission: (value: string) => void;
  agentCommission: number;
  setAgentCommission: (value: number) => void;
  clientSavings: number;
  result: CalculatorResult | null;
  retailNum: number;
  formatCurrency: (value: number) => string;
  onInputChange: () => void;
}

export function CalculatorFormSection({
  retailPrice,
  setRetailPrice,
  nightsPerStay,
  setNightsPerStay,
  bookingsPerMonth,
  setBookingsPerMonth,
  currentCommission,
  setCurrentCommission,
  agentCommission,
  setAgentCommission,
  clientSavings,
  result,
  retailNum,
  formatCurrency,
  onInputChange,
}: CalculatorFormSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-3xl shadow-card overflow-hidden">
      {/* Input Section */}
      <div className="p-6 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="retailPrice" className="text-body-sm font-medium mb-2 block text-foreground">
              {t("calc.input.roomPrice")}
            </Label>
            <Input
              id="retailPrice"
              type="number"
              placeholder="500"
              value={retailPrice}
              onChange={(e) => {
                setRetailPrice(e.target.value);
                onInputChange();
              }}
              className="h-11 text-base bg-background border-border"
            />
          </div>
          
          <div>
            <Label htmlFor="currentCommission" className="text-body-sm font-medium mb-2 block text-foreground">
              {t("calc.input.currentCommission")}
            </Label>
            <Input
              id="currentCommission"
              type="number"
              placeholder="12"
              min="0"
              max="30"
              value={currentCommission}
              onChange={(e) => {
                setCurrentCommission(e.target.value);
                onInputChange();
              }}
              className="h-11 text-base bg-background border-border"
            />
          </div>
          
          <div>
            <Label htmlFor="nightsPerStay" className="text-body-sm font-medium mb-2 block text-foreground">
              {t("calc.input.nightsPerStay")}
            </Label>
            <Input
              id="nightsPerStay"
              type="number"
              placeholder="3"
              min="1"
              value={nightsPerStay}
              onChange={(e) => {
                setNightsPerStay(e.target.value);
                onInputChange();
              }}
              className="h-11 text-base bg-background border-border"
            />
          </div>
          
          <div>
            <Label htmlFor="bookingsPerMonth" className="text-body-sm font-medium mb-2 block text-foreground">
              {t("calc.input.bookingsPerMonth")}
            </Label>
            <Input
              id="bookingsPerMonth"
              type="number"
              placeholder="5"
              min="0"
              value={bookingsPerMonth}
              onChange={(e) => {
                setBookingsPerMonth(e.target.value);
                onInputChange();
              }}
              className="h-11 text-base bg-background border-border"
            />
          </div>
        </div>

        {/* Commission/Savings Slider */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Label className="text-body-sm font-medium text-foreground">
                {t("calc.slider.yourCommission")}
              </Label>
              <span className="text-heading-sm font-heading text-accent">{agentCommission}%</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <span>{t("calc.slider.clientSaves")}:</span>
              <span className="font-heading text-foreground">{clientSavings}%</span>
            </div>
          </div>
          <Slider
            value={[agentCommission]}
            onValueChange={(v) => setAgentCommission(v[0])}
            min={0}
            max={25}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Results Section */}
      <div className="bg-secondary/50 p-6">
        {result && retailNum > 0 ? (
          <div className="space-y-5">
            {/* Monthly Earnings Hero */}
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 text-center relative overflow-hidden">
              {/* Glow effect when positive */}
              {result.difference.perMonth > 0 && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
              )}
              
              <p className="text-foreground/70 text-xs uppercase tracking-wider mb-2 relative">
                {t("calc.result.monthlyEarnings")}
              </p>
              <p className="font-heading text-display-md text-foreground mb-1 relative">
                <AnimatedNumber value={result.bookingJa.monthlyProfit} formatter={formatCurrency} />
              </p>
              <p className="text-muted-foreground text-body-sm relative">
                {t("calc.result.withBookingJa")}
              </p>
              
              {/* Comparison */}
              <div className="mt-4 pt-4 border-t border-border relative">
                <p className="text-muted-foreground text-body-sm">
                  {t("calc.result.vsToday").replace("{amount}", formatCurrency(result.today.monthlyProfit))}
                </p>
              </div>
            </div>

            {/* Extra Earnings Highlight */}
            {result.difference.perMonth > 0 && (
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 text-center relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-heading text-heading-lg text-primary">
                    +<AnimatedNumber value={result.difference.perMonth} formatter={formatCurrency} />
                  </span>
                  {result.difference.percentIncrease > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      +{Math.round(result.difference.percentIncrease)}%
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-body-sm">
                  {t("calc.result.morePerMonth")}
                </p>
                
                {/* Annual projection */}
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-heading text-heading-sm text-primary">
                      +<AnimatedNumber value={result.difference.perYear} formatter={formatCurrency} />
                    </span>
                    <span className="text-muted-foreground text-sm">/{t("calc.result.morePerYear").split(" ").slice(-2).join(" ")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Client Savings Emphasis - show when earning same or less */}
            {result.difference.perMonth <= 0 && clientSavings > 0 && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                <p className="font-heading text-heading-lg text-primary mb-1">
                  {t("calc.result.clientSavesEmphasis").replace("{pct}", String(clientSavings))}
                </p>
                <p className="text-foreground/70 text-body-sm">
                  {t("calc.result.clientSavesReason")}
                </p>
              </div>
            )}

            {/* Client savings note */}
            {clientSavings > 0 && (
              <p className="text-center text-body-sm text-muted-foreground">
                {t("calc.result.clientSavesNote").replace("{pct}", String(clientSavings))}
              </p>
            )}

            {/* CTA in results */}
            <Button
              asChild
              size="lg"
              className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group"
            >
              <Link to="/auth/register">
                {t("calc.cta.startEarning")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-body-sm">
              {t("calc.result.placeholder")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
