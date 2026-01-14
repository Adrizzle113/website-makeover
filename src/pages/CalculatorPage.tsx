import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Calculator, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const BOOKING_JA_COMMISSION = 0.20; // 20% commission with Booking Já

export default function CalculatorPage() {
  const [bookingValue, setBookingValue] = useState<string>("");
  const [currentCommission, setCurrentCommission] = useState<string>("");
  const [monthlyBookings, setMonthlyBookings] = useState<string>("");

  const bookingValueNum = parseFloat(bookingValue) || 0;
  const currentCommissionNum = parseFloat(currentCommission) / 100 || 0;
  const monthlyBookingsNum = parseInt(monthlyBookings) || 0;

  const currentEarnings = bookingValueNum * currentCommissionNum * monthlyBookingsNum;
  const bookingJaEarnings = bookingValueNum * BOOKING_JA_COMMISSION * monthlyBookingsNum;
  const difference = bookingJaEarnings - currentEarnings;

  const hasValidInputs = bookingValueNum > 0 && currentCommissionNum > 0 && monthlyBookingsNum > 0;

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
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="badge-pill bg-secondary text-secondary-foreground mb-6 inline-block">
              <Calculator className="w-4 h-4 mr-2 inline" />
              Commission Calculator
            </span>
            <h1 className="font-heading text-display-lg text-foreground mb-6">
              See how much more you could earn
            </h1>
            <p className="text-body-lg text-muted-foreground">
              Compare your current commissions with Booking Já's rates and discover your potential earnings.
            </p>
          </div>

          {/* Calculator Card */}
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="bg-card rounded-3xl p-8 shadow-card">
                <h2 className="font-heading text-heading-lg text-foreground mb-6">
                  Your current numbers
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="bookingValue" className="text-body-sm font-medium mb-2 block">
                      Average booking value (R$)
                    </Label>
                    <Input
                      id="bookingValue"
                      type="number"
                      placeholder="Ex: 2500"
                      value={bookingValue}
                      onChange={(e) => setBookingValue(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentCommission" className="text-body-sm font-medium mb-2 block">
                      Your current commission (%)
                    </Label>
                    <Input
                      id="currentCommission"
                      type="number"
                      placeholder="Ex: 10"
                      min="0"
                      max="100"
                      value={currentCommission}
                      onChange={(e) => setCurrentCommission(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyBookings" className="text-body-sm font-medium mb-2 block">
                      Number of bookings per month
                    </Label>
                    <Input
                      id="monthlyBookings"
                      type="number"
                      placeholder="Ex: 15"
                      value={monthlyBookings}
                      onChange={(e) => setMonthlyBookings(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-primary rounded-3xl p-8 text-primary-foreground">
                <h2 className="font-heading text-heading-lg mb-6">
                  Your potential earnings
                </h2>

                {hasValidInputs ? (
                  <div className="space-y-6">
                    <div className="bg-primary-foreground/10 rounded-2xl p-6">
                      <p className="text-primary-foreground/70 text-body-sm mb-1">
                        Current monthly earnings
                      </p>
                      <p className="font-heading text-heading-xl">
                        {formatCurrency(currentEarnings)}
                      </p>
                    </div>

                    <div className="bg-primary-foreground/10 rounded-2xl p-6">
                      <p className="text-primary-foreground/70 text-body-sm mb-1">
                        With Booking Já (20% commission)
                      </p>
                      <p className="font-heading text-heading-xl">
                        {formatCurrency(bookingJaEarnings)}
                      </p>
                    </div>

                    {difference > 0 && (
                      <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <p className="text-green-300 text-body-sm font-medium">
                            Extra earnings per month
                          </p>
                        </div>
                        <p className="font-heading text-heading-xl text-green-300">
                          +{formatCurrency(difference)}
                        </p>
                        <p className="text-green-300/80 text-body-sm mt-2">
                          You earn {formatCurrency(difference)} more per month with Booking Já.
                        </p>
                      </div>
                    )}

                    {difference <= 0 && (
                      <div className="bg-primary-foreground/10 rounded-2xl p-6">
                        <p className="text-primary-foreground/70 text-body-sm">
                          You're already earning great commissions! Booking Já offers consistent 20% rates on all bookings.
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
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mb-4">
                      <Calculator className="w-8 h-8 text-primary-foreground/50" />
                    </div>
                    <p className="text-primary-foreground/60 text-body-lg">
                      Fill in your numbers to see the comparison
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
