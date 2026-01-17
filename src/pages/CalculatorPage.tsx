import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import nycSkyline from "@/assets/nyc-skyline.webp";
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
    <div className="min-h-screen bg-background">
      <Header variant="light" />
      
      {/* Hero Section with Image Background on Right */}
      <div className="relative">
        {/* Background Image - Right Half on Desktop */}
        <div 
          className="hidden lg:block absolute top-0 right-0 w-1/2 h-[calc(100vh-80px)] bg-cover bg-center"
          style={{ backgroundImage: `url(${nycSkyline})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        
        <main className="relative pt-32 md:pt-36 pb-20">
          <div className="container">
            {/* Social Proof Banner */}
            <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
              <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{t("calc.socialProof")}</span>
              </div>
            </div>

            {/* Two Column Hero Layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
              
              {/* Left Column - Marketing Copy */}
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
                      onClick={() => applyPreset("small")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        activePreset === "small"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                      }`}
                    >
                      {t("calc.presets.small")}
                    </button>
                    <button
                      onClick={() => applyPreset("growing")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        activePreset === "growing"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                      }`}
                    >
                      {t("calc.presets.growing")}
                    </button>
                    <button
                      onClick={() => applyPreset("highVolume")}
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
          </div>
          
          {/* Platform Comparison Section - Outside hero background */}
          {result && retailNum > 0 && (
            <div className="relative z-10 mt-24 py-16 bg-muted w-screen -ml-[calc((100vw-100%)/2)]">
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
                        {formatCurrency(result.competitors.booking.profit * 12)}
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
                        {formatCurrency(result.competitors.expedia.profit * 12)}
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
                        {formatCurrency(result.competitors.bookingJa.profit * 12)}
                      </p>
                      <p className="text-muted-foreground text-xs">/ano</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>

    <Footer />
  </div>
  );
}