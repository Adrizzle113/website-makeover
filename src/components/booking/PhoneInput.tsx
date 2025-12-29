import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (phone: string) => void;
  onCountryCodeChange: (code: string) => void;
  required?: boolean;
  error?: string;
}

const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+852", country: "HK", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+351", country: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "+30", country: "GR", flag: "🇬🇷", name: "Greece" },
  { code: "+353", country: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+62", country: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", country: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "+66", country: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", country: "VN", flag: "🇻🇳", name: "Vietnam" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines" },
];

export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  required = false,
  error,
}: PhoneInputProps) {
  const selectedCountry = countryCodes.find((c) => c.code === countryCode) || countryCodes[0];

  const formatPhoneNumber = (input: string) => {
    // Remove non-digit characters
    const digits = input.replace(/\D/g, "");
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onValueChange(formatted);
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-[110px] shrink-0">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {countryCodes.map((country) => (
              <SelectItem key={`${country.country}-${country.code}`} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm font-medium">{country.code}</span>
                  <span className="text-muted-foreground text-xs">{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder="Phone number"
            className={`pl-10 ${error ? "border-destructive" : ""}`}
            required={required}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
