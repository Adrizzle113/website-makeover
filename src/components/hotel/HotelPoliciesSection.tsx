import { Clock, Info, Wallet, PawPrint, BedDouble } from "lucide-react";
import type { HotelDetails } from "@/types/booking";

interface DepositPolicy {
  type: string;
  price: string;
}

interface AdditionalBedPolicy {
  maxNumber?: string;
  price: string;
  note?: string;
}

interface PetPolicy {
  availability: string;
  price: string;
}

interface HotelPoliciesSectionProps {
  hotel: HotelDetails;
  deposit?: DepositPolicy;
  additionalBed?: AdditionalBedPolicy;
  pets?: PetPolicy;
}

const defaultDeposit: DepositPolicy = {
  type: "Price",
  price: "200 USD per room for the whole period of stay",
};

const defaultAdditionalBed: AdditionalBedPolicy = {
  maxNumber: "Needs to be clarified on the spot",
  price: "25 USD per guest per night",
};

const defaultPets: PetPolicy = {
  availability: "Any pets are allowed",
  price: "25 USD per each pet for the whole period of stay",
};

export function HotelPoliciesSection({
  hotel,
  deposit = defaultDeposit,
  additionalBed = defaultAdditionalBed,
  pets = defaultPets,
}: HotelPoliciesSectionProps) {
  const hasCheckTimes = hotel.checkInTime || hotel.checkOutTime;
  const hasPolicies = hotel.policies && hotel.policies.length > 0;

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Check-in/Check-out */}
          {hasCheckTimes && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Check-in/out Times</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {hotel.checkInTime && (
                  <div>
                    <span className="text-muted-foreground block">Check-in</span>
                    <span className="font-medium text-foreground">{hotel.checkInTime}</span>
                  </div>
                )}
                {hotel.checkOutTime && (
                  <div>
                    <span className="text-muted-foreground block">Check-out</span>
                    <span className="font-medium text-foreground">{hotel.checkOutTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deposit */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Deposit</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground block">Deposit type</span>
                <span className="font-medium text-foreground">{deposit.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Price</span>
                <span className="font-medium text-foreground">{deposit.price}</span>
              </div>
            </div>
          </div>

          {/* Additional Bed */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Additional bed</h3>
            </div>
            <div className="space-y-2 text-sm">
              {additionalBed.maxNumber && (
                <div>
                  <span className="text-muted-foreground block">Maximum number</span>
                  <span className="font-medium text-foreground">{additionalBed.maxNumber}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block">Price</span>
                <span className="font-medium text-foreground">{additionalBed.price}</span>
              </div>
            </div>
          </div>

          {/* Pets */}
          <div className="bg-muted/50 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Pets</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground block">Availability</span>
                <span className="font-medium text-foreground">{pets.availability}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Price</span>
                <span className="font-medium text-foreground">{pets.price}</span>
              </div>
            </div>
          </div>

          {/* General Policies */}
          {hasPolicies && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Hotel Policies</h3>
              </div>
              <ul className="space-y-2">
                {hotel.policies!.map((policy, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {policy}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
