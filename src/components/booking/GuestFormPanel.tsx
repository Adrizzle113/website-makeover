import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, ChevronDown, Plus, X, Shield, Lock } from "lucide-react";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, RoomSelection } from "@/types/booking";
import type { Guest } from "@/components/booking/GuestInformationSection";
import { sanitizeGuestName } from "@/lib/guestValidation";

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52" },
];

interface GuestFormPanelProps {
  rooms: RoomSelection[];
  hotel: HotelDetails;
  isLoading: boolean;
  onGuestsChange: (guests: Guest[]) => void;
  onDetailsChange: (details: { countryCode: string; phoneNumber: string; specialRequests: string }) => void;
  onTermsChange: (valid: boolean) => void;
  onContinue: () => void;
}

export function GuestFormPanel({
  rooms,
  hotel,
  isLoading,
  onGuestsChange,
  onDetailsChange,
  onTermsChange,
  onContinue,
}: GuestFormPanelProps) {
  const { setResidency, searchParams, setSearchParams } = useBookingStore();
  
  // Lead guest state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [citizenship, setCitizenship] = useState("US");
  
  // Additional guests state
  const [additionalGuestsOpen, setAdditionalGuestsOpen] = useState(false);
  const [additionalGuests, setAdditionalGuests] = useState<{ firstName: string; lastName: string }[]>([]);
  
  // Other state
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedCountry = countries.find(c => c.code === countryCode);

  // Sync citizenship with store
  useEffect(() => {
    setResidency(citizenship);
  }, [citizenship, setResidency]);

  // Update parent with guests
  useEffect(() => {
    const guests: Guest[] = [
      {
        id: "lead-guest",
        firstName,
        lastName,
        email,
        type: "adult",
        isLead: true,
        roomIndex: 0,
        citizenship,
      },
      ...additionalGuests.map((g, idx) => ({
        id: `additional-${idx}`,
        firstName: g.firstName,
        lastName: g.lastName,
        type: "adult" as const,
        isLead: false,
        roomIndex: 0,
      })),
    ];
    onGuestsChange(guests);
  }, [firstName, lastName, email, citizenship, additionalGuests, onGuestsChange]);

  // Update parent with details
  useEffect(() => {
    const dialCode = selectedCountry?.dialCode || "+1";
    onDetailsChange({
      countryCode: dialCode,
      phoneNumber: phone,
      specialRequests,
    });
  }, [phone, countryCode, specialRequests, selectedCountry, onDetailsChange]);

  // Update terms validity
  useEffect(() => {
    onTermsChange(termsAccepted);
  }, [termsAccepted, onTermsChange]);

  const addAdditionalGuest = () => {
    setAdditionalGuests(prev => [...prev, { firstName: "", lastName: "" }]);
  };

  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalGuest = (index: number, field: "firstName" | "lastName", value: string) => {
    // Sanitize guest names - RateHawk doesn't allow digits in names
    const sanitizedValue = sanitizeGuestName(value);
    setAdditionalGuests(prev =>
      prev.map((g, i) => (i === index ? { ...g, [field]: sanitizedValue } : g))
    );
  };

  return (
    <div className="h-full flex flex-col bg-white p-6 lg:p-10 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Complete Your Booking
        </h1>
        <p className="text-muted-foreground">
          Fill in your details to confirm your reservation
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email address <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="h-12"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Booking confirmation will be sent here
          </p>
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First name <span className="text-destructive">*</span>
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(sanitizeGuestName(e.target.value))}
              placeholder="John"
              className="h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Last name <span className="text-destructive">*</span>
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(sanitizeGuestName(e.target.value))}
              placeholder="Doe"
              className="h-12"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Phone number
          </label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[120px] h-12">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{selectedCountry?.flag}</span>
                    <span>{selectedCountry?.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.dialCode}</span>
                      <span className="text-muted-foreground">{country.name}</span>
                    </span>
                  </SelectItem>
                ))
                }
              </SelectContent>
            </Select>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555 123 4567"
              className="flex-1 h-12"
            />
          </div>
        </div>

        {/* Citizenship */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Citizenship <span className="text-destructive">*</span>
          </label>
          <Select value={citizenship} onValueChange={setCitizenship}>
            <SelectTrigger className="h-12">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span>{countries.find(c => c.code === citizenship)?.flag}</span>
                  <span>{countries.find(c => c.code === citizenship)?.name}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))
              }
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Used for rate eligibility
          </p>
        </div>

        {/* Additional Guests */}
        <Collapsible open={additionalGuestsOpen} onOpenChange={setAdditionalGuestsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
            <span className="text-sm font-medium text-foreground">Additional guests</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${additionalGuestsOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {additionalGuests.map((guest, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    value={guest.firstName}
                    onChange={(e) => updateAdditionalGuest(idx, "firstName", e.target.value)}
                    placeholder="First name"
                    className="h-10"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={guest.lastName}
                    onChange={(e) => updateAdditionalGuest(idx, "lastName", e.target.value)}
                    placeholder="Last name"
                    className="h-10"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdditionalGuest(idx)}
                  className="h-10 w-10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
            }
            <Button
              variant="outline"
              onClick={addAdditionalGuest}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add guest
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Special requests
          </label>
          <Textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requests for your stay..."
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional - Subject to availability
          </p>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
          >
            I confirm the guest details are correct and agree to the{" "}
            <a href="#" className="text-primary hover:underline">
              cancellation policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              booking terms
            </a>
            .
          </label>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 pt-6 border-t border-border">
        <Button
          onClick={onContinue}
          disabled={!termsAccepted || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg h-14"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking availability...
            </>
          ) : (
            "Continue to Payment"
          )}
        </Button>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure Booking</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4 text-green-600" />
            <span>SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

