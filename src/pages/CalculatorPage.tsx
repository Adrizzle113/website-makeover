import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const TOTAL_MARGIN_PCT = 35; // Total available margin pool

function calcBookingJa({
  retailPrice,
  hotelDiscountPct,
  roomsPerMonth,
  currentCommissionPct,
  agentCommissionPct, // 0-35%, client savings = 35 - this
}: {
  retailPrice: number;
  hotelDiscountPct: number;
  roomsPerMonth: number;
  currentCommissionPct: number;
  agentCommissionPct: number;
}) {
  const R = Number(retailPrice);
  const d = Number(hotelDiscountPct) / 100;
  const rooms = Number(roomsPerMonth);
  const c = Number(currentCommissionPct) / 100;
  
  // Inverse relationship: as agent commission goes up, client savings go down
  const clientSavingsPct = TOTAL_MARGIN_PCT - agentCommissionPct;

  if (!R || R <= 0) return null;

  // Hidden platform fee (NOT shown)
  const platformFee = 0.10;

  // Cost: (retail - hotelDiscount) + platformFee
  const base = R * (1 - d);
  const cost = base * (1 + platformFee);

  // Client pays retail minus their savings
  const sellPrice = R * (1 - clientSavingsPct / 100);

  const profitPerRoom = Math.max(0, sellPrice - cost);

  const todayProfitPerRoom = R * c;

  return {
    today: {
      retail: R,
      commissionPct: c * 100,
      profitPerRoom: todayProfitPerRoom,
      monthlyProfit: todayProfitPerRoom * rooms
    },
    bookingJa: {
      retail: R,
      cost,
      agentCommissionPct,
      sellPrice,
      profitPerRoom,
      clientSavingsPct,
      monthlyProfit: profitPerRoom * rooms,
    },
    difference: {
      perRoom: profitPerRoom - todayProfitPerRoom,
      perMonth: (profitPerRoom - todayProfitPerRoom) * rooms
    }
  };
}

export default function CalculatorPage() {
  const [retailPrice, setRetailPrice] = useState<string>("500");
  const [roomsPerMonth, setRoomsPerMonth] = useState<string>("10");
  const [currentCommission, setCurrentCommission] = useState<string>("12");
  const [agentCommission, setAgentCommission] = useState<number>(20);

  const retailNum = parseFloat(retailPrice) || 0;
  const roomsNum = parseInt(roomsPerMonth) || 0;
  const commissionNum = parseFloat(currentCommission) || 12;
  
  // Inverse: client savings = 35 - agent commission
  const clientSavings = TOTAL_MARGIN_PCT - agentCommission;

  // Fixed 30% hotel discount (hidden from user)
  const result = calcBookingJa({
    retailPrice: retailNum,
    hotelDiscountPct: 30,
    roomsPerMonth: roomsNum,
    currentCommissionPct: commissionNum,
    agentCommissionPct: agentCommission,
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
                See How Much<br />More You Earn
              </h1>
              <p className="text-primary-foreground/80 text-body-lg mb-8 max-w-md">
                Compare your current commission with Booking Já's margin model. Set your own margin and see the difference instantly.
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
            <div className="bg-card rounded-3xl shadow-card overflow-hidden">
              {/* Input Section */}
              <div className="p-6 pb-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="retailPrice" className="text-body-sm font-medium mb-2 block text-foreground">
                      Average Room Price (R$/night)
                    </Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      placeholder="500"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="h-11 text-base bg-background border-border"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currentCommission" className="text-body-sm font-medium mb-2 block text-foreground">
                      Your current commission (%)
                    </Label>
                    <Input
                      id="currentCommission"
                      type="number"
                      placeholder="12"
                      min="0"
                      max="30"
                      value={currentCommission}
                      onChange={(e) => setCurrentCommission(e.target.value)}
                      className="h-11 text-base bg-background border-border"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="roomsPerMonth" className="text-body-sm font-medium mb-2 block text-foreground">
                      Rooms per month
                    </Label>
                    <Input
                      id="roomsPerMonth"
                      type="number"
                      placeholder="10"
                      min="0"
                      value={roomsPerMonth}
                      onChange={(e) => setRoomsPerMonth(e.target.value)}
                      className="h-11 text-base bg-background border-border"
                    />
                  </div>
                  
                </div>

                {/* Commission/Savings Slider */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-body-sm font-medium text-foreground">
                        Your Commission
                      </Label>
                      <span className="text-heading-sm font-heading text-accent">{agentCommission}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <span>Client Saves:</span>
                      <span className="font-heading text-foreground">{clientSavings}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[agentCommission]}
                    onValueChange={(v) => setAgentCommission(v[0])}
                    min={0}
                    max={35}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>0% (Client saves 35%)</span>
                    <span>35% (Client saves 0%)</span>
                  </div>
                </div>
              </div>
              
              {/* Results Section */}
              <div className="bg-secondary/50 p-6">
                {result && retailNum > 0 ? (
                  <div className="space-y-5">
                    {/* Monthly Earnings Hero */}
                    <div className="bg-primary rounded-2xl p-6 text-center">
                      <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-2">
                        Your Monthly Earnings
                      </p>
                      <p className="font-heading text-display-md text-primary-foreground mb-1">
                        {formatCurrency(result.bookingJa.monthlyProfit)}
                      </p>
                      <p className="text-primary-foreground/60 text-body-sm">
                        with Booking Já
                      </p>
                      
                      {/* Comparison */}
                      <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                        <p className="text-primary-foreground/60 text-body-sm">
                          vs <span className="font-medium text-primary-foreground">{formatCurrency(result.today.monthlyProfit)}</span>/month today
                        </p>
                      </div>
                    </div>

                    {/* Extra Earnings Highlight */}
                    {result.difference.perMonth > 0 && (
                      <div className="bg-accent/15 border border-accent/30 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <TrendingUp className="w-5 h-5 text-accent" />
                          <span className="font-heading text-heading-lg text-accent">
                            +{formatCurrency(result.difference.perMonth)}
                          </span>
                        </div>
                        <p className="text-foreground/70 text-body-sm">
                          more per month
                        </p>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Per night</p>
                        <p className="font-heading text-heading-sm text-foreground">
                          {formatCurrency(result.bookingJa.profitPerRoom)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Your cost</p>
                        <p className="font-heading text-heading-sm text-foreground">
                          {formatCurrency(result.bookingJa.cost)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Sell price</p>
                        <p className="font-heading text-heading-sm text-foreground">
                          {formatCurrency(result.bookingJa.sellPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Client savings note */}
                    {clientSavings > 0 && (
                      <p className="text-center text-body-sm text-muted-foreground">
                        Your client saves <span className="font-medium text-foreground">{clientSavings}%</span> off the public price
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
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
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">30%</p>
              <p className="text-primary-foreground/60 text-body-sm">average savings</p>
            </div>
            <div>
              <p className="font-heading text-heading-xl lg:text-display-md text-accent mb-1">35%</p>
              <p className="text-primary-foreground/60 text-body-sm">max margin</p>
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
