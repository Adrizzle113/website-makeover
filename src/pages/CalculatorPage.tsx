import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, TrendingUp, Sparkles, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const TOTAL_MARGIN_PCT = 25;

// Animated number component
function AnimatedNumber({ value, formatter }: { value: number; formatter: (n: number) => string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      setDisplayValue(startValue + (endValue - startValue) * eased);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);
  
  return <>{formatter(displayValue)}</>;
}

// Preset scenarios
const PRESETS = {
  small: { price: "400", nights: "2", bookings: "3", commission: "10" },
  growing: { price: "600", nights: "3", bookings: "10", commission: "12" },
  highVolume: { price: "800", nights: "4", bookings: "25", commission: "15" },
};

function calcBookingJa({
  retailPrice,
  roomsPerMonth,
  currentCommissionPct,
  agentCommissionPct,
}: {
  retailPrice: number;
  roomsPerMonth: number;
  currentCommissionPct: number;
  agentCommissionPct: number;
}) {
  const R = Number(retailPrice);
  const rooms = Number(roomsPerMonth);
  const c = Number(currentCommissionPct) / 100;
  const clientSavingsPct = TOTAL_MARGIN_PCT - agentCommissionPct;

  if (!R || R <= 0) return null;

  const cost = R * 0.75;
  const sellPrice = R * (1 - clientSavingsPct / 100);
  const profitPerRoom = sellPrice - cost;
  const todayProfitPerRoom = R * c;

  return {
    today: {
      retail: R,
      commissionPct: c * 100,
      profitPerRoom: todayProfitPerRoom,
      monthlyProfit: todayProfitPerRoom * rooms,
      yearlyProfit: todayProfitPerRoom * rooms * 12,
    },
    bookingJa: {
      retail: R,
      cost,
      agentCommissionPct,
      sellPrice,
      profitPerRoom,
      clientSavingsPct,
      monthlyProfit: profitPerRoom * rooms,
      yearlyProfit: profitPerRoom * rooms * 12,
    },
    difference: {
      perRoom: profitPerRoom - todayProfitPerRoom,
      perMonth: (profitPerRoom - todayProfitPerRoom) * rooms,
      perYear: (profitPerRoom - todayProfitPerRoom) * rooms * 12,
      percentIncrease: todayProfitPerRoom > 0 
        ? ((profitPerRoom - todayProfitPerRoom) / todayProfitPerRoom) * 100 
        : 0,
    },
    competitors: {
      booking: { name: "Booking.com", commission: 10, profit: R * 0.10 * rooms },
      expedia: { name: "Expedia TAAP", commission: 8, profit: R * 0.08 * rooms },
      bookingJa: { name: "Booking Já", commission: agentCommissionPct, profit: profitPerRoom * rooms },
    }
  };
}

export default function CalculatorPage() {
  const { t } = useLanguage();
  const [retailPrice, setRetailPrice] = useState<string>("500");
  const [nightsPerStay, setNightsPerStay] = useState<string>("3");
  const [bookingsPerMonth, setBookingsPerMonth] = useState<string>("5");
  const [currentCommission, setCurrentCommission] = useState<string>("12");
  const [agentCommission, setAgentCommission] = useState<number>(20);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const retailNum = parseFloat(retailPrice) || 0;
  const nightsNum = parseInt(nightsPerStay) || 0;
  const bookingsNum = parseInt(bookingsPerMonth) || 0;
  const totalRoomNights = nightsNum * bookingsNum;
  const commissionNum = parseFloat(currentCommission) || 12;
  const clientSavings = TOTAL_MARGIN_PCT - agentCommission;

  const result = calcBookingJa({
    retailPrice: retailNum,
    roomsPerMonth: totalRoomNights,
    currentCommissionPct: commissionNum,
    agentCommissionPct: agentCommission,
  });

  const applyPreset = (preset: keyof typeof PRESETS) => {
    setRetailPrice(PRESETS[preset].price);
    setNightsPerStay(PRESETS[preset].nights);
    setBookingsPerMonth(PRESETS[preset].bookings);
    setCurrentCommission(PRESETS[preset].commission);
    setActivePreset(preset);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header variant="dark" />
      
      <main className="pt-32 md:pt-36 pb-20">
        <div className="container">
          {/* Social Proof Banner */}
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{t("calc.socialProof")}</span>
            </div>
          </div>

          {/* Two Column Hero Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
            
            {/* Left Column - Marketing Copy */}
            <div className="text-primary-foreground lg:pt-8">
              <h1 className="font-heading text-heading-xl sm:text-display-lg lg:text-display-xl mb-6 uppercase tracking-tight leading-[0.95]">
                {t("calc.title").split(" ").slice(0, 3).join(" ")}<br />
                {t("calc.title").split(" ").slice(3).join(" ")}
              </h1>
              <p className="text-primary-foreground/80 text-body-lg mb-8 max-w-md">
                {t("calc.description")}
              </p>
              
              {/* Preset Scenarios */}
              <div className="mb-8">
                <p className="text-primary-foreground/60 text-sm mb-3">{t("calc.presets.title")}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyPreset("small")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activePreset === "small"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                    }`}
                  >
                    {t("calc.presets.small")}
                  </button>
                  <button
                    onClick={() => applyPreset("growing")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activePreset === "growing"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                    }`}
                  >
                    {t("calc.presets.growing")}
                  </button>
                  <button
                    onClick={() => applyPreset("highVolume")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activePreset === "highVolume"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                    }`}
                  >
                    {t("calc.presets.highVolume")}
                  </button>
                </div>
              </div>
              
              <Button
                asChild
                size="lg"
                className="h-14 px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold group"
              >
                <Link to="/auth/register">
                  {t("calc.cta")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <p className="text-primary-foreground/50 text-sm mt-10">
                {t("calc.disclaimer")}
              </p>
            </div>
            
            {/* Right Column - Calculator Card */}
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
                        setActivePreset(null);
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
                        setActivePreset(null);
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
                        setActivePreset(null);
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
                        setActivePreset(null);
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
                    <div className="bg-primary rounded-2xl p-6 text-center relative overflow-hidden">
                      {/* Glow effect when positive */}
                      {result.difference.perMonth > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent pointer-events-none" />
                      )}
                      
                      <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-2 relative">
                        {t("calc.result.monthlyEarnings")}
                      </p>
                      <p className="font-heading text-display-md text-primary-foreground mb-1 relative">
                        <AnimatedNumber value={result.bookingJa.monthlyProfit} formatter={formatCurrency} />
                      </p>
                      <p className="text-primary-foreground/60 text-body-sm relative">
                        {t("calc.result.withBookingJa")}
                      </p>
                      
                      {/* Comparison */}
                      <div className="mt-4 pt-4 border-t border-primary-foreground/20 relative">
                        <p className="text-primary-foreground/60 text-body-sm">
                          {t("calc.result.vsToday").replace("{amount}", formatCurrency(result.today.monthlyProfit))}
                        </p>
                      </div>
                    </div>

                    {/* Extra Earnings Highlight */}
                    {result.difference.perMonth > 0 && (
                      <div className="bg-accent/15 border-2 border-accent/40 rounded-xl p-4 text-center relative animate-pulse-subtle">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-accent" />
                          <span className="font-heading text-heading-lg text-accent">
                            +<AnimatedNumber value={result.difference.perMonth} formatter={formatCurrency} />
                          </span>
                          {result.difference.percentIncrease > 0 && (
                            <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                              +{Math.round(result.difference.percentIncrease)}%
                            </span>
                          )}
                        </div>
                        <p className="text-foreground/70 text-body-sm">
                          {t("calc.result.morePerMonth")}
                        </p>
                        
                        {/* Annual projection */}
                        <div className="mt-3 pt-3 border-t border-accent/20">
                          <div className="flex items-center justify-center gap-1">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span className="font-heading text-heading-sm text-accent">
                              +<AnimatedNumber value={result.difference.perYear} formatter={formatCurrency} />
                            </span>
                            <span className="text-foreground/60 text-sm">/{t("calc.result.morePerYear").split(" ").slice(-2).join(" ")}</span>
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
                      className="w-full h-12 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold group"
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
          </div>
          
          {/* Platform Comparison Section */}
          {result && retailNum > 0 && (
            <div className="max-w-4xl mx-auto mt-16 animate-fade-in">
              <h3 className="font-heading text-heading-lg text-primary-foreground text-center mb-6">
                {t("calc.comparison.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Booking.com */}
                <div className="bg-primary-foreground/5 rounded-2xl p-5 text-center border border-primary-foreground/10">
                  <p className="text-primary-foreground/60 text-sm mb-1">Booking.com</p>
                  <p className="text-primary-foreground/40 text-xs mb-3">10% {t("calc.comparison.commission").toLowerCase()}</p>
                  <p className="font-heading text-heading-md text-primary-foreground/70">
                    {formatCurrency(result.competitors.booking.profit * 12)}
                  </p>
                  <p className="text-primary-foreground/40 text-xs mt-1">/ano</p>
                </div>
                
                {/* Expedia TAAP */}
                <div className="bg-primary-foreground/5 rounded-2xl p-5 text-center border border-primary-foreground/10">
                  <p className="text-primary-foreground/60 text-sm mb-1">Expedia TAAP</p>
                  <p className="text-primary-foreground/40 text-xs mb-3">8% {t("calc.comparison.commission").toLowerCase()}</p>
                  <p className="font-heading text-heading-md text-primary-foreground/70">
                    {formatCurrency(result.competitors.expedia.profit * 12)}
                  </p>
                  <p className="text-primary-foreground/40 text-xs mt-1">/ano</p>
                </div>
                
                {/* Booking Já - Highlighted */}
                <div className="bg-accent/20 rounded-2xl p-5 text-center border-2 border-accent relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> MELHOR
                    </span>
                  </div>
                  <p className="text-accent text-sm font-medium mb-1 mt-2">Booking Já</p>
                  <p className="text-primary-foreground/60 text-xs mb-3">{agentCommission}% {t("calc.comparison.commission").toLowerCase()}</p>
                  <p className="font-heading text-heading-md text-accent">
                    {formatCurrency(result.competitors.bookingJa.profit * 12)}
                  </p>
                  <p className="text-primary-foreground/60 text-xs mt-1">/ano</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 max-w-5xl mx-auto mt-20 pt-12 border-t border-primary-foreground/10 text-center lg:text-left">
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">25%</p>
              <p className="text-primary-foreground/60 text-body-sm">{t("calc.stats.maxSavings")}</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">25%</p>
              <p className="text-primary-foreground/60 text-body-sm">{t("calc.stats.maxMargin")}</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">0</p>
              <p className="text-primary-foreground/60 text-body-sm">{t("calc.stats.monthlyFees")}</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">24h</p>
              <p className="text-primary-foreground/60 text-body-sm">{t("calc.stats.toGetStarted")}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}