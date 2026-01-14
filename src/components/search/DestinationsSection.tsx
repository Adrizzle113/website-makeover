import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
const destinations = [{
  name: "Indonesia",
  image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
  tours: 25
}, {
  name: "Switzerland",
  image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80",
  tours: 18
}, {
  name: "New Zealand",
  image: "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=600&q=80",
  tours: 22
}, {
  name: "Iceland",
  image: "https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=600&q=80",
  tours: 15
}, {
  name: "Norway",
  image: "https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=600&q=80",
  tours: 20
}];
export function DestinationsSection() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("destinations-scroll");
    if (container) {
      const scrollAmount = 320;
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount;
      container.scrollTo({
        left: newPosition,
        behavior: "smooth"
      });
      setScrollPosition(newPosition);
    }
  };
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="heading-spaced text-muted-foreground mb-2">Popular Destinations</p>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">Explore Top Locations</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll("left")} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll("right")} className="rounded-full">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div id="destinations-scroll" className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
          {destinations.map((destination) => (
            <div key={destination.name} className="flex-shrink-0 w-72 group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-3">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-heading text-xl mb-1">{destination.name}</h3>
                  <p className="text-white/80 text-sm">{destination.tours} Tours</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}