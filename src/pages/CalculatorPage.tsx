import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";

function calcBookingJa({
  retailPrice,
  hotelDiscountPct,
  roomsPerMonth,
  currentCommissionPct,
  agentMarginPct,
  clientDiscountPct = 0
}: {
  retailPrice: number;
  hotelDiscountPct: number;
  roomsPerMonth: number;
  currentCommissionPct: number;
  agentMarginPct: number;
  clientDiscountPct?: number;
}) {
  const R = Number(retailPrice);
  const d = Number(hotelDiscountPct) / 100;
  const m = Number(agentMarginPct) / 100;
  const c = Number(currentCommissionPct) / 100;
  const x = Number(clientDiscountPct) / 100;
  const rooms = Number(roomsPerMonth);

  if (!R || R <= 0) return null;

  // Hidden platform fee (NOT shown)
  const platformFee = 0.10;

  // Cost: (retail - hotelDiscount) + platformFee
  const base = R * (1 - d);
  const cost = base * (1 + platformFee);

  // Agent sets margin on cost
  const sellBeforeDiscount = cost * (1 + m);

  // Optional: apply client discount off retail
  const clientPrice = R * (1 - x);

  // Actual sell price
  const sellPrice = x > 0 ? clientPrice : sellBeforeDiscount;

  const profitPerRoom = Math.max(0, sellPrice - cost);
  const effectiveMarginPct = cost > 0 ? (profitPerRoom / cost) * 100 : 0;

  const todayProfitPerRoom = R * c;

  // Max client discount (where profit = 0)
  const maxClientDiscountPct = Math.max(0, (1 - cost / R) * 100);

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
      agentMarginPct: m * 100,
      sellBeforeDiscount,
      clientDiscountPct: x * 100,
      sellPrice,
      profitPerRoom,
      effectiveMarginPct,
      clientSavingsPct: Math.max(0, (1 - sellPrice / R) * 100),
      monthlyProfit: profitPerRoom * rooms,
      maxClientDiscountPct
    },
    difference: {
      perRoom: profitPerRoom - todayProfitPerRoom,
      perMonth: (profitPerRoom - todayProfitPerRoom) * rooms
    }
  };
}

export default function CalculatorPage() {
  const [retailPrice, setRetailPrice] = useState<string>("500");
  const [hotelDiscount, setHotelDiscount] = useState<string>("30");
  const [roomsPerMonth, setRoomsPerMonth] = useState<string>("10");
  const [currentCommission, setCurrentCommission] = useState<string>("12");
  const [agentMargin, setAgentMargin] = useState<number>(20);
  const [clientDiscount, setClientDiscount] = useState<number>(0);
  const [showClientDiscount, setShowClientDiscount] = useState(false);

  const retailNum = parseFloat(retailPrice) || 0;
  const discountNum = parseFloat(hotelDiscount) || 30;
  const roomsNum = parseInt(roomsPerMonth) || 0;
  const commissionNum = parseFloat(currentCommission) || 12;

  const result = calcBookingJa({
    retailPrice: retailNum,
    hotelDiscountPct: discountNum,
    roomsPerMonth: roomsNum,
    currentCommissionPct: commissionNum,
    agentMarginPct: agentMargin,
    clientDiscountPct: clientDiscount
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
                      Public price (R$/night)
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
                    <Label htmlFor="hotelDiscount" className="text-body-sm font-medium mb-2 block text-foreground">
                      Savings vs public (%)
                    </Label>
                    <Input
                      id="hotelDiscount"
                      type="number"
                      placeholder="30"
                      min="0"
                      max="50"
                      value={hotelDiscount}
                      onChange={(e) => setHotelDiscount(e.target.value)}
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

                {/* Margin Slider */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-body-sm font-medium text-foreground">
                      Your margin
                    </Label>
                    <span className="text-heading-sm font-heading text-accent">{agentMargin}%</span>
                  </div>
                  <Slider
                    value={[agentMargin]}
                    onValueChange={(v) => setAgentMargin(v[0])}
                    min={10}
                    max={35}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>10%</span>
                    <span>35%</span>
                  </div>
                </div>

                {/* Optional Client Discount */}
                <button
                  onClick={() => setShowClientDiscount(!showClientDiscount)}
                  className="mt-4 flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showClientDiscount ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Give client a discount
                </button>

                {showClientDiscount && result && (
                  <div className="mt-3 p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-body-sm font-medium text-foreground">
                        Client discount (off retail)
                      </Label>
                      <span className="text-heading-sm font-heading text-foreground">{clientDiscount}%</span>
                    </div>
                    <Slider
                      value={[clientDiscount]}
                      onValueChange={(v) => setClientDiscount(v[0])}
                      min={0}
                      max={Math.floor(result.bookingJa.maxClientDiscountPct)}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                      <span>0%</span>
                      <span>Max {Math.floor(result.bookingJa.maxClientDiscountPct)}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Results Section */}
              <div className="bg-secondary/50 p-6">
                {result && retailNum > 0 ? (
                  <div className="space-y-5">
                    {/* Comparison Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Today Column */}
                      <div className="bg-background rounded-xl p-4">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3">Today</p>
                        <p className="font-heading text-heading-lg text-foreground mb-1">
                          {formatCurrency(result.today.profitPerRoom)}
                        </p>
                        <p className="text-muted-foreground text-body-sm">per night</p>
                        {roomsNum > 0 && (
                          <p className="text-muted-foreground text-xs mt-2">
                            {formatCurrency(result.today.monthlyProfit)}/month
                          </p>
                        )}
                      </div>

                      {/* Booking Já Column */}
                      <div className="bg-primary rounded-xl p-4">
                        <p className="text-primary-foreground/70 text-xs uppercase tracking-wide mb-3">With Booking Já</p>
                        <p className="font-heading text-heading-lg text-primary-foreground mb-1">
                          {formatCurrency(result.bookingJa.profitPerRoom)}
                        </p>
                        <p className="text-primary-foreground/70 text-body-sm">per night</p>
                        {roomsNum > 0 && (
                          <p className="text-primary-foreground/60 text-xs mt-2">
                            {formatCurrency(result.bookingJa.monthlyProfit)}/month
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Difference Highlight */}
                    {result.difference.perRoom > 0 && (
                      <div className="bg-accent/15 border border-accent/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-accent" />
                          <span className="text-foreground text-body-sm font-medium">
                            Extra earnings
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-heading text-heading-md text-accent">
                            +{formatCurrency(result.difference.perRoom)}/night
                          </p>
                          {roomsNum > 0 && (
                            <p className="text-accent/80 text-xs">
                              +{formatCurrency(result.difference.perMonth)}/month
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span>Your cost: <span className="font-medium text-foreground">{formatCurrency(result.bookingJa.cost)}</span></span>
                      <span>Sell price: <span className="font-medium text-foreground">{formatCurrency(result.bookingJa.sellPrice)}</span></span>
                      {clientDiscount > 0 && (
                        <span>Client saves: <span className="font-medium text-foreground">{result.bookingJa.clientSavingsPct.toFixed(0)}%</span></span>
                      )}
                    </div>
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
