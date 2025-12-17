import {
  Star,
  Building2,
  BedDouble,
  Accessibility,
  ConciergeBell,
  UtensilsCrossed,
  Wifi,
  Car,
  Languages,
  Map,
  Palmtree,
  ParkingCircle,
  Waves,
  Briefcase,
  Dumbbell,
  Sparkles,
  Baby,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

interface AmenityCategory {
  title: string;
  icon: React.ElementType;
  items: string[];
}

interface FacilitiesAmenitiesSectionProps {
  amenities?: Partial<Record<string, string[]>>;
}

const defaultAmenities: Record<string, string[]> = {
  popular: [
    "Free WiFi",
    "Swimming Pool",
    "Spa",
    "Fitness Center",
    "Restaurant",
  ],
  general: [
    "Air conditioning",
    "Heating",
    "Elevator",
    "Non-smoking rooms",
    "Family rooms",
    "Soundproof rooms",
  ],
  rooms: [
    "Flat-screen TV",
    "Minibar",
    "Coffee maker",
    "Safe",
    "Desk",
    "Wardrobe",
  ],
  accessibility: [
    "Wheelchair accessible",
    "Accessible parking",
    "Elevator access",
    "Accessible bathroom",
  ],
  services: [
    "24-hour front desk",
    "Concierge service",
    "Luggage storage",
    "Laundry service",
    "Dry cleaning",
    "Room service",
  ],
  meals: [
    "Breakfast available",
    "Restaurant on-site",
    "Bar/Lounge",
    "Room service",
    "Special diet menus",
  ],
  internet: [
    "Free WiFi in all areas",
    "WiFi in rooms",
    "Business center with internet",
  ],
  transfer: [
    "Airport shuttle",
    "Car rental",
    "Taxi service",
    "Shuttle service",
  ],
  languages: [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
  ],
  tourist: [
    "Tour desk",
    "Ticket service",
    "Currency exchange",
    "ATM on site",
  ],
  recreation: [
    "Garden",
    "Terrace",
    "Library",
    "Game room",
  ],
  parking: [
    "On-site parking",
    "Valet parking",
    "Covered parking",
    "Electric vehicle charging",
  ],
  poolBeach: [
    "Outdoor pool",
    "Indoor pool",
    "Pool bar",
    "Sun loungers",
    "Beach access",
  ],
  business: [
    "Business center",
    "Meeting rooms",
    "Conference facilities",
    "Fax/Photocopying",
  ],
  sports: [
    "Fitness center",
    "Tennis court",
    "Golf course",
    "Water sports",
  ],
  beautyWellness: [
    "Spa",
    "Massage",
    "Sauna",
    "Steam room",
    "Beauty salon",
  ],
  kids: [
    "Kids club",
    "Playground",
    "Babysitting service",
    "Kids pool",
    "High chairs",
  ],
  pets: [
    "Pets allowed",
    "Pet bowls",
    "Pet bed available",
  ],
  healthSafety: [
    "Daily housekeeping",
    "Hand sanitizer",
    "First aid kit",
    "Fire extinguishers",
    "Security 24/7",
  ],
};

const categoryConfig: { key: string; title: string; icon: React.ElementType }[] = [
  { key: "popular", title: "Popular", icon: Star },
  { key: "general", title: "General", icon: Building2 },
  { key: "rooms", title: "Rooms", icon: BedDouble },
  { key: "accessibility", title: "Accessibility", icon: Accessibility },
  { key: "services", title: "Services and Amenities", icon: ConciergeBell },
  { key: "meals", title: "Meals", icon: UtensilsCrossed },
  { key: "internet", title: "Internet", icon: Wifi },
  { key: "transfer", title: "Transfer", icon: Car },
  { key: "languages", title: "Languages Spoken", icon: Languages },
  { key: "tourist", title: "Tourist Services", icon: Map },
  { key: "recreation", title: "Recreation", icon: Palmtree },
  { key: "parking", title: "Parking", icon: ParkingCircle },
  { key: "poolBeach", title: "Pool and Beach", icon: Waves },
  { key: "business", title: "Business", icon: Briefcase },
  { key: "sports", title: "Sports", icon: Dumbbell },
  { key: "beautyWellness", title: "Beauty and Wellness", icon: Sparkles },
  { key: "kids", title: "Kids", icon: Baby },
  { key: "pets", title: "Pets", icon: PawPrint },
  { key: "healthSafety", title: "Health and Safety Measures", icon: ShieldCheck },
];

export function FacilitiesAmenitiesSection({ amenities }: FacilitiesAmenitiesSectionProps) {
  const mergedAmenities = { ...defaultAmenities, ...amenities };

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <h2 className="font-heading text-heading-standard text-foreground mb-6">
          Facilities & Amenities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryConfig.map(({ key, title, icon: Icon }) => {
            const items = mergedAmenities[key];
            if (!items || items.length === 0) return null;

            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
