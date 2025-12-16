import { Calendar, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const tours = [
  {
    title: "Bali Paradise Escape",
    description: "Experience the magic of Bali's temples, rice terraces, and pristine beaches on this unforgettable journey.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    duration: "7-10 Days",
    price: "$1,299",
  },
  {
    title: "Swiss Alps Adventure",
    description: "Trek through breathtaking mountain landscapes and charming villages in the heart of Switzerland.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80",
    duration: "5-8 Days",
    price: "$2,499",
  },
  {
    title: "New Zealand Discovery",
    description: "From fjords to glaciers, explore the stunning natural wonders of New Zealand's North and South Islands.",
    image: "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=1200&q=80",
    duration: "10-14 Days",
    price: "$3,199",
  },
];

export function TourPackagesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="heading-spaced text-primary mb-4 block">
            Tour Packages
          </span>
          <h2 className="font-heading text-display-md text-foreground mb-4">
            Popular Tour Packages
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked adventures designed to give you the most authentic and 
            memorable travel experiences.
          </p>
        </div>

        {/* Tour Cards */}
        <div className="space-y-8">
          {tours.map((tour, index) => (
            <div
              key={index}
              className="group bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="font-heading text-heading-xl text-foreground mb-4">
                    {tour.title}
                  </h3>
                  <p className="text-body-md text-muted-foreground mb-6">
                    {tour.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-2 text-body-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span>Starting from {tour.price}</span>
                    </div>
                  </div>

                  <Button className="w-fit rounded-full px-6 group/btn">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* See All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" className="rounded-full px-8 group">
            See All Tours
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}