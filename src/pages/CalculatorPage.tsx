import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import nycSkyline from "@/assets/nyc-skyline.webp";
import {
  CalculatorHeroSection,
  CalculatorFormSection,
  PlatformComparisonSection,
  PRESETS,
} from "@/components/calculator";

const TOTAL_MARGIN_PCT = 25;

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

  const handleInputChange = () => {
    setActivePreset(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="light" />
      
      {/* Hero Section with Image Background on Right */}
      <section className="relative">
        {/* Background Image - Right Half on Desktop */}
        <div 
          className="hidden lg:block absolute top-0 right-0 w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${nycSkyline})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        
        <div className="relative pt-32 md:pt-36">
          <div className="container">
            {/* Two Column Hero Layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
              
              {/* Left Column - Marketing Copy */}
              <CalculatorHeroSection
                activePreset={activePreset}
                onApplyPreset={applyPreset}
              />
            
              {/* Right Column - Calculator Card */}
              <CalculatorFormSection
                retailPrice={retailPrice}
                setRetailPrice={setRetailPrice}
                nightsPerStay={nightsPerStay}
                setNightsPerStay={setNightsPerStay}
                bookingsPerMonth={bookingsPerMonth}
                setBookingsPerMonth={setBookingsPerMonth}
                currentCommission={currentCommission}
                setCurrentCommission={setCurrentCommission}
                agentCommission={agentCommission}
                setAgentCommission={setAgentCommission}
                clientSavings={clientSavings}
                result={result}
                retailNum={retailNum}
                formatCurrency={formatCurrency}
                onInputChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Platform Comparison Section */}
      {result && retailNum > 0 && (
        <PlatformComparisonSection
          competitors={result.competitors}
          agentCommission={agentCommission}
          formatCurrency={formatCurrency}
        />
      )}

      <Footer />
    </div>
  );
}
