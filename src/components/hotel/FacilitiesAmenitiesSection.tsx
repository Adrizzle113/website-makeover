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
  Check,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FacilitiesAmenitiesSectionProps {
  amenities?: Partial<Record<string, string[]>>;
}

const categoryConfig: { key: string; title: string; icon: React.ElementType }[] = [
  { key: "popular", title: "Popular", icon: Star },
  { key: "general", title: "General", icon: Building2 },
  { key: "rooms", title: "Rooms", icon: BedDouble },
  { key: "accessibility", title: "Accessibility", icon: Accessibility },
  { key: "services", title: "Services", icon: ConciergeBell },
  { key: "meals", title: "Meals", icon: UtensilsCrossed },
  { key: "internet", title: "Internet", icon: Wifi },
  { key: "transfer", title: "Transfer", icon: Car },
  { key: "languages", title: "Languages", icon: Languages },
  { key: "tourist", title: "Tourist", icon: Map },
  { key: "recreation", title: "Recreation", icon: Palmtree },
  { key: "parking", title: "Parking", icon: ParkingCircle },
  { key: "poolBeach", title: "Pool & Beach", icon: Waves },
  { key: "business", title: "Business", icon: Briefcase },
  { key: "sports", title: "Sports", icon: Dumbbell },
  { key: "beautyWellness", title: "Wellness", icon: Sparkles },
  { key: "kids", title: "Kids", icon: Baby },
  { key: "pets", title: "Pets", icon: PawPrint },
  { key: "healthSafety", title: "Health & Safety", icon: ShieldCheck },
  { key: "uncategorized", title: "Other", icon: MoreHorizontal },
];

export function FacilitiesAmenitiesSection({ amenities }: FacilitiesAmenitiesSectionProps) {
  const categoriesWithItems = categoryConfig.filter(({ key }) => 
    amenities?.[key] && amenities[key]!.length > 0
  );

  if (categoriesWithItems.length === 0) {
    return null;
  }

  const defaultCategory = categoriesWithItems[0].key;

  return (
    <section className="py-10 bg-muted/20">
      <div className="container">
        <div className="mb-6">
          <h2 className="font-heading text-heading-standard text-foreground">
            Facilities & Amenities
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Everything you need for a comfortable stay
          </p>
        </div>

        <Tabs defaultValue={defaultCategory} className="w-full">
          <TabsList className="h-auto p-1 bg-muted/50 rounded-xl flex flex-wrap gap-1 justify-start mb-6">
            {categoriesWithItems.map(({ key, title, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-4 w-4" />
                <span>{title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categoriesWithItems.map(({ key }) => {
            const items = amenities![key]!;
            return (
              <TabsContent key={key} value={key} className="mt-0 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-background rounded-lg px-4 py-3 border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}