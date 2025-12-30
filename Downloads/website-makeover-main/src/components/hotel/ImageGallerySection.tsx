import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { HotelImage } from "@/types/booking";

interface ImageGallerySectionProps {
  images: HotelImage[];
  hotelName: string;
}

export function ImageGallerySection({ images, hotelName }: ImageGallerySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [
    { url: "/placeholder.svg", alt: hotelName },
  ];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <h2 className="font-heading text-heading-standard text-foreground mb-6">
          Photo Gallery
        </h2>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayImages.slice(0, 8).map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsOpen(true);
              }}
              className={`relative overflow-hidden rounded-lg aspect-[4/3] group ${
                index === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <img
                src={image.url}
                alt={image.alt || `${hotelName} - Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {index === 7 && displayImages.length > 8 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{displayImages.length - 8} more
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-5xl bg-black/95 border-none p-0">
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-50 text-white/80 hover:text-white"
              >
                <X className="h-8 w-8" />
              </button>

              {/* Image */}
              <div className="relative aspect-video">
                <img
                  src={displayImages[currentIndex].url}
                  alt={displayImages[currentIndex].alt || hotelName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Navigation */}
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {currentIndex + 1} / {displayImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
