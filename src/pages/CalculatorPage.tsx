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
    <div className="min-h-screen bg-primary">
      <Header variant="dark" />
      
      <main className="pt-24 pb-20">
        <div className="container">
          {/* Two Column Hero Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
            
            {/* Left Column - Marketing Copy */}
            <div className="text-primary-foreground pt-8 lg:pt-16">
              <h1 className="font-heading text-display-lg lg:text-display-xl mb-6 uppercase tracking-tight leading-[0.95]">
                See How Much<br />You Can Earn
              </h1>
              <p className="text-primary-foreground/80 text-body-lg mb-8 max-w-md">
                Compare public hotel prices with Booking Já rates and choose how much you keep or pass on to your client.
              </p>
              
              <Button
                asChild
                size="lg"
                className="h-14 px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold group"
              >
                <Link to="/auth/register">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <p className="text-primary-foreground/50 text-sm mt-10">
                * Examples only. Actual margins vary by property and dates.
              </p>
            </div>
            
            {/* Right Column - Calculator Card */}
            <div className="bg-card rounded-3xl p-8 shadow-card">
              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="publicPrice" className="text-body-sm font-medium mb-2 block text-foreground">
                    Public hotel price (R$)
                  </Label>
                  <Input
                    id="publicPrice"
                    type="number"
                    placeholder="1,000.00"
                    value={publicPrice}
                    onChange={(e) => setPublicPrice(e.target.value)}
                    className="h-12 text-base bg-background border-border"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="discount" className="text-body-sm font-medium mb-2 block text-foreground">
                    Discount vs public (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="25"
                    min="0"
                    max="50"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-12 text-base bg-background border-border"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="nights" className="text-body-sm font-medium mb-2 block text-foreground">
                    Number of nights
                  </Label>
                  <Input
                    id="nights"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={nights}
                    onChange={(e) => setNights(e.target.value)}
                    className="h-12 text-base bg-background border-border"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="bookingsPerMonth" className="text-body-sm font-medium mb-2 block text-foreground">
                    Bookings/month <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="bookingsPerMonth"
                    type="number"
                    placeholder="10"
                    min="0"
                    value={bookingsPerMonth}
                    onChange={(e) => setBookingsPerMonth(e.target.value)}
                    className="h-12 text-base bg-background border-border"
                  />
                </div>
              </div>
              
              {/* Results Section */}
              <div className="bg-secondary/50 rounded-2xl p-6">
                {result && publicPriceNum > 0 ? (
                  <div className="space-y-4">
                    {/* Primary Results Row */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-muted-foreground text-body-sm mb-1">
                          Your net cost
                        </p>
                        <p className="font-heading text-heading-xl text-foreground">
                          {formatCurrency(result.agentCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-body-sm mb-1">
                          Max profit (full price)
                        </p>
                        <p className="font-heading text-heading-xl text-accent">
                          {result.scenarios[0] ? formatCurrency(result.scenarios[0].profit) : '—'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-border/50" />
                    
                    {/* Secondary Info */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm">
                      <span className="text-muted-foreground">
                        Max discount: <span className="font-semibold text-foreground">{result.maxDiscountPct.toFixed(0)}%</span>
                      </span>
                      {result.scenarios[1] && (
                        <span className="text-muted-foreground">
                          At 10% off: <span className="font-semibold text-foreground">{formatCurrency(result.scenarios[1].profit)}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Monthly Upside */}
                    {result.monthly.length > 0 && (
                      <>
                        <div className="border-t border-border/50" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-body-sm">Monthly potential</span>
                          <span className="font-heading text-heading-md text-accent">
                            {formatCurrency(result.monthly[0].monthlyProfit)}/mo
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calculator className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-body-sm">
                      Enter the public hotel price to see your potential earnings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 max-w-5xl mx-auto mt-20 pt-12 border-t border-primary-foreground/10">
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">25%</p>
              <p className="text-primary-foreground/60 text-body-sm">average discount</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">100%</p>
              <p className="text-primary-foreground/60 text-body-sm">margin control</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">0</p>
              <p className="text-primary-foreground/60 text-body-sm">monthly fees</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">24h</p>
              <p className="text-primary-foreground/60 text-body-sm">to get started</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
