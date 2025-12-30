import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

export interface BillingAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface BillingAddressSectionProps {
  value: BillingAddress;
  onChange: (address: BillingAddress) => void;
  errors?: Partial<Record<keyof BillingAddress, string>>;
  disabled?: boolean;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "NZ", name: "New Zealand" },
].sort((a, b) => a.name.localeCompare(b.name));

export function BillingAddressSection({
  value,
  onChange,
  errors = {},
  disabled = false,
}: BillingAddressSectionProps) {
  const updateField = (field: keyof BillingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Billing Address
          </h2>
        </div>

        <div className="space-y-4">
          {/* Address Line 1 */}
          <div>
            <Label htmlFor="addressLine1" className="text-sm font-medium">
              Address Line 1 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="addressLine1"
              value={value.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
              placeholder="123 Main Street"
              className={`mt-2 h-12 ${errors.addressLine1 ? "border-destructive" : ""}`}
              disabled={disabled}
            />
            {errors.addressLine1 && (
              <p className="text-sm text-destructive mt-1">{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <Label htmlFor="addressLine2" className="text-sm font-medium">
              Address Line 2 <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="addressLine2"
              value={value.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
              placeholder="Apt, Suite, Unit, Building (optional)"
              className="mt-2 h-12"
              disabled={disabled}
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={value.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City"
                className={`mt-2 h-12 ${errors.city ? "border-destructive" : ""}`}
                disabled={disabled}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state" className="text-sm font-medium">
                State / Province <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                value={value.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State or Province"
                className={`mt-2 h-12 ${errors.state ? "border-destructive" : ""}`}
                disabled={disabled}
              />
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postalCode"
                value={value.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                placeholder="12345"
                className={`mt-2 h-12 ${errors.postalCode ? "border-destructive" : ""}`}
                disabled={disabled}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country" className="text-sm font-medium">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value.country}
                onValueChange={(v) => updateField("country", v)}
                disabled={disabled}
              >
                <SelectTrigger 
                  id="country"
                  className={`mt-2 h-12 ${errors.country ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
