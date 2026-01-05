import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Share2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { HotelDetails, HotelImage } from "@/types/booking";

interface HotelHeroSectionProps {
  hotel: HotelDetails;
}

export function HotelHeroSection({ hotel }: HotelHeroSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages: HotelImage[] =
    hotel.images?.length > 0
      ? hotel.images
      : hotel.mainImage
        ? [{ url: hotel.mainImage, alt: hotel.name }]
        : [{ url: "/placeholder.svg", alt: hotel.name }];

  const mainImage = displayImages[0]?.url || "/placeholder.svg";
  const sideImage1 = displayImages[1]?.url || displayImages[0]?.url || "/placeholder.svg";
  const sideImage2 = displayImages[2]?.url || displayImages[0]?.url || "/placeholder.svg";

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  return (
    <>
      {/* Header Bar */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/search"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Search</span>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hotel Info Section */}
      <section className="px-4 md:px-8 pb-6">
        <div className="container p-0">
          <div className="space-y-4">
            {/* Category Label */}
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Hotel in {hotel.city}
            </span>

            {/* Title Row with Review Score */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Name */}
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
                {hotel.name}
              </h1>

              {/* Review Score Badge */}
              {hotel.reviewScore !== undefined && hotel.reviewScore !== null && hotel.reviewScore > 0 ? (
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 shrink-0">
                  <div className="bg-primary text-primary-foreground w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl">
                    {hotel.reviewScore.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {hotel.reviewScore >= 9 ? "Exceptional" : hotel.reviewScore >= 8 ? "Excellent" : "Very Good"}
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {hotel.reviewCount ? `${hotel.reviewCount.toLocaleString()} reviews` : "Guest reviews"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-4 py-3 shrink-0">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not yet rated</span>
                </div>
              )}
            </div>

            {/* Rating & Location Row */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {/* Star Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starRating = hotel.starRating || 0;
                    const isFilled = i < starRating;
                    return (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${isFilled ? "text-gold" : "text-muted-foreground"}`}
                        fill={isFilled ? "currentColor" : "none"}
                      />
                    );
                  })}
                </div>
                <span className="font-medium text-foreground">
                  {hotel.starRating || 0} Star{hotel.starRating !== 1 ? "s" : ""}
                </span>
              </div>

              <span className="text-muted-foreground/40">•</span>

              {/* Location */}
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-body">
                  {hotel.address}, {hotel.city}, {hotel.country}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Hero */}
      <section className="px-3 md:px-8 pb-4 md:pb-6">
        <div className="container p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 h-[250px] sm:h-[300px] md:h-[380px] lg:h-[620px] overflow-hidden">
            {/* Main Large Image */}
            <button
              onClick={() => openLightbox(0)}
              className="md:col-span-2 h-full w-full relative overflow-hidden rounded-2xl group"
            >
              <img
                src={mainImage}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {displayImages.length > 3 && (
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-sm font-medium">
                  +{displayImages.length - 3} photos
                </div>
              )}
            </button>

            {/* Stacked Side Images */}
            <div className="hidden md:flex flex-col gap-2 md:gap-3 h-full w-full">
              <button
                onClick={() => openLightbox(1)}
                className="flex-1 min-h-0 w-full relative overflow-hidden rounded-2xl group"
              >
                <img
                  src={sideImage1}
                  alt={displayImages[1]?.alt || `${hotel.name} - Photo 2`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <span className="text-white font-medium text-sm">{displayImages[1]?.alt || "Room Interior"}</span>
                </div>
                {/* Corner accent */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/0 group-hover:border-white/60 transition-colors duration-300 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/0 group-hover:border-white/60 transition-colors duration-300 rounded-bl-lg" />
              </button>
              <button
                onClick={() => openLightbox(2)}
                className="flex-1 min-h-0 w-full relative overflow-hidden rounded-2xl group"
              >
                <img
                  src={sideImage2}
                  alt={displayImages[2]?.alt || `${hotel.name} - Photo 3`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <span className="text-white font-medium text-sm">{displayImages[2]?.alt || "Amenities"}</span>
                </div>
                {/* Corner accent */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/0 group-hover:border-white/60 transition-colors duration-300 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/0 group-hover:border-white/60 transition-colors duration-300 rounded-bl-lg" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl bg-black/95 border-none p-0">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 text-white/80 hover:text-white"
            >
              <X className="h-8 w-8" />
            </button>

            <div className="relative aspect-video">
              <img
                src={displayImages[currentIndex]?.url}
                alt={displayImages[currentIndex]?.alt || hotel.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>

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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {currentIndex + 1} / {displayImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
