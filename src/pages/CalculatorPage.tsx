import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Calculator, TrendingUp, Percent, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface Scenario {
  label: string;
  profit: number;
  viable: boolean;
}

interface MonthlyScenario {
  label: string;
  monthlyProfit: number;
}

function calcAgentView({
  retailRate,
  netDiscountPct,
  nights = 1,
  bookingsPerMonth = 0
}: {
  retailRate: number;
  netDiscountPct: number;
  nights?: number;
  bookingsPerMonth?: number;
}) {
  const R = Number(retailRate);
  const d = Number(netDiscountPct) / 100;
  const f = 0.10; // hidden platform fee
  const N = Number(nights);

  if (!R || R <= 0) return null;

  // Internal math (hidden from user)
  const net = R * (1 - d);
  const agentCost = net * (1 + f);

  const maxDiscountPct = Math.max(0, (1 - agentCost / R) * 100);

  const scenarios: Scenario[] = [
    { label: "Charge full price", price: R },
    { label: "Give 10% off", price: R * 0.9 },
    { label: "Give 15% off", price: R * 0.85 },
  ]
    .map(s => ({
      label: s.label,
      profit: (s.price - agentCost) * N,
      viable: s.price >= agentCost
    }))
    .filter(s => s.viable);

  const monthly: MonthlyScenario[] = bookingsPerMonth
    ? scenarios.map(s => ({
        label: s.label,
        monthlyProfit: s.profit * bookingsPerMonth
      }))
    : [];

  return {
    agentCost: agentCost * N,
    maxDiscountPct,
    scenarios,
    monthly
  };
}

export default function CalculatorPage() {
  const [publicPrice, setPublicPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("25");
  const [nights, setNights] = useState<string>("1");
  const [bookingsPerMonth, setBookingsPerMonth] = useState<string>("");

  const publicPriceNum = parseFloat(publicPrice) || 0;
  const discountNum = parseFloat(discount) || 25;
  const nightsNum = parseInt(nights) || 1;
  const bookingsNum = parseInt(bookingsPerMonth) || 0;

  const result = calcAgentView({
    retailRate: publicPriceNum,
    netDiscountPct: discountNum,
    nights: nightsNum,
    bookingsPerMonth: bookingsNum
  });

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
      <Header variant="dark" />
      
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="badge-pill bg-secondary text-secondary-foreground mb-6 inline-block">
              <Calculator className="w-4 h-4 mr-2 inline" />
              Margin Calculator
            </span>
            <h1 className="font-heading text-display-lg text-foreground mb-4">
              See how much you can earn
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Compare public hotel prices with Booking Já rates and choose how much you keep or pass on to your client.
            </p>
          </div>

          {/* Calculator Card */}
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Inputs - 2 columns */}
              <div className="lg:col-span-2 bg-card rounded-3xl p-8 shadow-card">
                <h2 className="font-heading text-heading-lg text-foreground mb-6">
                  Enter details
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="publicPrice" className="text-body-sm font-medium mb-2 block">
                      Public hotel price (R$)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="publicPrice"
                        type="number"
                        placeholder="Ex: 500"
                        value={publicPrice}
                        onChange={(e) => setPublicPrice(e.target.value)}
                        className="h-14 text-lg pl-12"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discount" className="text-body-sm font-medium mb-2 block">
                      Estimated discount vs public rates (%)
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="discount"
                        type="number"
                        placeholder="25"
                        min="0"
                        max="50"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="h-14 text-lg pl-12"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Average net rate discount from public prices
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="nights" className="text-body-sm font-medium mb-2 block">
                      Number of nights
                    </Label>
                    <Input
                      id="nights"
                      type="number"
                      placeholder="1"
                      min="1"
                      value={nights}
                      onChange={(e) => setNights(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bookingsPerMonth" className="text-body-sm font-medium mb-2 block">
                      Bookings per month <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="bookingsPerMonth"
                      type="number"
                      placeholder="Ex: 10"
                      min="0"
                      value={bookingsPerMonth}
                      onChange={(e) => setBookingsPerMonth(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Results - 3 columns */}
              <div className="lg:col-span-3 bg-primary rounded-3xl p-8 text-primary-foreground">
                <h2 className="font-heading text-heading-lg mb-6">
                  Your earnings
                </h2>

                {result && publicPriceNum > 0 ? (
                  <div className="space-y-6">
                    {/* Your Cost */}
                    <div className="bg-primary-foreground/10 rounded-2xl p-6">
                      <p className="text-primary-foreground/70 text-body-sm mb-1">
                        Your net booking cost
                      </p>
                      <p className="font-heading text-display-md">
                        {formatCurrency(result.agentCost)}
                      </p>
                      <p className="text-primary-foreground/60 text-xs mt-1">
                        For {nightsNum} night{nightsNum > 1 ? 's' : ''} • Everything included
                      </p>
                    </div>

                    {/* Margin Options */}
                    <div>
                      <p className="text-primary-foreground/70 text-body-sm mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        What you can do with the margin
                      </p>
                      
                      <div className="bg-primary-foreground/10 rounded-2xl p-5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-primary-foreground/80 text-body-sm">
                            Maximum discount you can offer
                          </span>
                          <span className="font-heading text-heading-md text-cream">
                            {result.maxDiscountPct.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {result.scenarios.map((scenario, index) => (
                          <div 
                            key={index}
                            className={`rounded-xl p-4 flex items-center justify-between ${
                              index === 0 
                                ? 'bg-green-500/20 border border-green-400/30' 
                                : 'bg-primary-foreground/5'
                            }`}
                          >
                            <span className={`text-body-sm ${index === 0 ? 'text-green-300 font-medium' : 'text-primary-foreground/70'}`}>
                              {scenario.label}
                            </span>
                            <span className={`font-heading text-heading-sm ${index === 0 ? 'text-green-300' : 'text-primary-foreground'}`}>
                              {formatCurrency(scenario.profit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Upside */}
                    {result.monthly.length > 0 && (
                      <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6">
                        <p className="text-green-300 text-body-sm font-medium mb-3">
                          Monthly potential
                        </p>
                        <p className="font-heading text-heading-xl text-green-300 mb-1">
                          {formatCurrency(result.monthly[0].monthlyProfit)}
                        </p>
                        <p className="text-green-300/80 text-body-sm">
                          At this rate, you earn approximately {formatCurrency(result.monthly[0].monthlyProfit)} per month.
                        </p>
                      </div>
                    )}

                    <Button
                      asChild
                      size="lg"
                      className="w-full h-14 rounded-full bg-cream text-primary hover:bg-cream/90 font-semibold group"
                    >
                      <Link to="/auth/register">
                        Create free account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mb-4">
                      <Calculator className="w-8 h-8 text-primary-foreground/50" />
                    </div>
                    <p className="text-primary-foreground/60 text-body-lg">
                      Enter the public hotel price to see your potential earnings
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-muted-foreground text-sm mt-8">
              Examples only. Actual margins vary by property and dates.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
