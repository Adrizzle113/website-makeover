import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const PRESETS = {
  small: { price: "400", nights: "2", bookings: "3", commission: "10" },
  growing: { price: "600", nights: "3", bookings: "10", commission: "12" },
  highVolume: { price: "800", nights: "4", bookings: "25", commission: "15" },
};

interface CalculatorHeroSectionProps {
  activePreset: string | null;
  onApplyPreset: (preset: keyof typeof PRESETS) => void;
}

export function CalculatorHeroSection({ activePreset, onApplyPreset }: CalculatorHeroSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="text-foreground lg:pt-8">

      <h1 className="font-heading text-heading-xl sm:text-display-lg lg:text-display-xl mb-6 uppercase tracking-tight leading-[0.95]">
        {t("calc.title").split(" ").slice(0, 3).join(" ")}<br />
        {t("calc.title").split(" ").slice(3).join(" ")}
      </h1>
      <p className="text-muted-foreground text-body-lg mb-8 max-w-md">
        {t("calc.description")}
      </p>
      
      {/* Stats Chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-full">
          <span className="font-heading text-sm text-primary">25%</span>
          <span className="text-muted-foreground text-xs">{t("calc.stats.maxSavings")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-full">
          <span className="font-heading text-sm text-primary">25%</span>
          <span className="text-muted-foreground text-xs">{t("calc.stats.maxMargin")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-full">
          <span className="font-heading text-sm text-primary">0</span>
          <span className="text-muted-foreground text-xs">{t("calc.stats.monthlyFees")}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-full">
          <span className="font-heading text-sm text-primary">24h</span>
          <span className="text-muted-foreground text-xs">{t("calc.stats.toGetStarted")}</span>
        </div>
      </div>
      
      {/* Preset Scenarios */}
      <div className="mb-8">
        <p className="text-muted-foreground text-sm mb-3">{t("calc.presets.title")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onApplyPreset("small")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activePreset === "small"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            }`}
          >
            {t("calc.presets.small")}
          </button>
          <button
            onClick={() => onApplyPreset("growing")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activePreset === "growing"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            }`}
          >
            {t("calc.presets.growing")}
          </button>
          <button
            onClick={() => onApplyPreset("highVolume")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activePreset === "highVolume"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            }`}
          >
            {t("calc.presets.highVolume")}
          </button>
        </div>
      </div>
      
      <Button
        asChild
        size="lg"
        className="h-14 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group"
      >
        <Link to="/auth/register">
          {t("calc.cta")}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
      
      <p className="text-muted-foreground text-sm mt-10">
        {t("calc.disclaimer")}
      </p>
    </div>
  );
}

export { PRESETS };
