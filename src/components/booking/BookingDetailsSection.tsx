import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookingDetailsSectionProps {
  onDetailsChange?: (details: {
    countryCode: string;
    phoneNumber: string;
    groupOfClients: string;
    specialRequests: string;
  }) => void;
}

const countryCodes = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+91", flag: "🇮🇳", name: "India" },
];

const clientGroups = [
  { value: "individual", label: "Individual" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
  { value: "group", label: "Group" },
  { value: "couple", label: "Couple" },
  { value: "friends", label: "Friends" },
];

export function BookingDetailsSection({ onDetailsChange }: BookingDetailsSectionProps) {
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [groupOfClients, setGroupOfClients] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const handleChange = (field: string, value: string) => {
    const newDetails = {
      countryCode: field === "countryCode" ? value : countryCode,
      phoneNumber: field === "phoneNumber" ? value : phoneNumber,
      groupOfClients: field === "groupOfClients" ? value : groupOfClients,
      specialRequests: field === "specialRequests" ? value : specialRequests,
    };

    if (field === "countryCode") setCountryCode(value);
    if (field === "phoneNumber") setPhoneNumber(value);
    if (field === "groupOfClients") setGroupOfClients(value);
    if (field === "specialRequests") setSpecialRequests(value);

    onDetailsChange?.(newDetails);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
          Booking Details
        </h2>

        {/* Phone Number */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>We'll use this to contact you about your booking</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex gap-3">
            <div className="w-28">
              <Select 
                value={countryCode} 
                onValueChange={(value) => handleChange("countryCode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem
                      key={`${country.code}-${country.name}`}
                      value={country.code}
                    >
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Input
                value={phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>
          </div>
        </div>

        {/* Group of Clients */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Group / Client Type
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>For agent use - categorize this booking</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Select 
            value={groupOfClients} 
            onValueChange={(value) => handleChange("groupOfClients", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not chosen (optional)" />
            </SelectTrigger>
            <SelectContent>
              {clientGroups.map((group) => (
                <SelectItem key={group.value} value={group.value}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Special Requests
          </label>
          <Textarea
            value={specialRequests}
            onChange={(e) => handleChange("specialRequests", e.target.value)}
            placeholder="Enter any special requests (e.g., early check-in, high floor, connecting rooms, dietary requirements...)"
            className="resize-none h-24"
          />
          <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Special requests are sent to the property but are not guaranteed. 
              The hotel will do their best to accommodate your requests based on availability.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
