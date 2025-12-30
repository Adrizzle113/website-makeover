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
  MoreHorizontal,
} from "lucide-react";

interface FacilitiesAmenitiesSectionProps {
  amenities?: Partial<Record<string, string[]>>;
}

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
  { key: "uncategorized", title: "Other Amenities", icon: MoreHorizontal },
];

export function FacilitiesAmenitiesSection({ amenities }: FacilitiesAmenitiesSectionProps) {
  // Only show categories that have data from API
  const categoriesWithItems = categoryConfig.filter(({ key }) => 
    amenities?.[key] && amenities[key]!.length > 0
  );

  // Hide section entirely if no API amenities
  if (categoriesWithItems.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <h2 className="font-heading text-heading-standard text-foreground mb-6">
          Facilities & Amenities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoriesWithItems.map(({ key, title, icon: Icon }) => {
            const items = amenities![key]!;

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