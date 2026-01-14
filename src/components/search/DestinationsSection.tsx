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
  return;
}