import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare, User, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HotelDetails } from "@/types/booking";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  reviewer_name: string | null;
  review_date: string;
  helpful_count: number;
}

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface HotelReviewsSectionProps {
  hotel: HotelDetails;
}

const getRatingLabel = (score: number): string => {
  if (score >= 9) return "Exceptional";
  if (score >= 8) return "Excellent";
  if (score >= 7) return "Very Good";
  if (score >= 6) return "Good";
  if (score >= 5) return "Average";
  return "Below Average";
};

const getRatingColor = (score: number): string => {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-yellow-500";
  return "bg-orange-500";
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const HotelReviewsSection = React.forwardRef<HTMLElement, HotelReviewsSectionProps>(
  function HotelReviewsSection({ hotel }, ref) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown>({
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
    });

    useEffect(() => {
      fetchReviews();
    }, [hotel.id]);

    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Extract the actual hotel ID (could be in ratehawk_data or use the hotel.id)
        const hotelId = (hotel as any).ratehawk_data?.requested_hotel_id || 
                        (hotel as any).ratehawk_data?.ota_hotel_id || 
                        hotel.id;

        const { data, error } = await (supabase as any)
          .from("hotel_reviews")
          .select("*")
          .eq("hotel_id", hotelId)
          .order("review_date", { ascending: false })
          .limit(20);

        if (error) {
          // Gracefully handle auth/permission errors
          console.warn("Unable to load reviews:", error.message);
          setReviews([]);
          return;
        }

        if (data && data.length > 0) {
          setReviews(data as Review[]);
          
          // Calculate rating breakdown
          const breakdown: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          (data as Review[]).forEach((review) => {
            const roundedRating = Math.round(review.rating) as keyof RatingBreakdown;
            if (roundedRating >= 1 && roundedRating <= 5) {
              breakdown[roundedRating]++;
            }
          });
          setRatingBreakdown(breakdown);
        }
      } catch (error) {
        // Gracefully handle any errors (including 401)
        console.warn("Unable to load reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    // Use hotel's existing review data as fallback
    const reviewScore = hotel.reviewScore || 0;
    const reviewCount = hotel.reviewCount || reviews.length || 0;
    const hasReviews = reviews.length > 0 || reviewCount > 0;

    // Display reviews (limit to 3 unless expanded)
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
    const totalReviewsInBreakdown = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);

    if (loading) {
      return (
        <section ref={ref} className="space-y-6" id="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Guest Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-muted rounded-lg" />
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </section>
      );
    }

    return (
      <section ref={ref} className="space-y-6" id="reviews">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Guest Reviews
              {reviewCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Rating Summary */}
            {(reviewScore > 0 || hasReviews) && (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Score Badge */}
                <div className="flex items-center gap-4">
                  <div className={`${getRatingColor(reviewScore)} text-white rounded-xl p-4 text-center min-w-[80px]`}>
                    <div className="text-3xl font-bold">{reviewScore.toFixed(1)}</div>
                    <div className="text-xs opacity-90">out of 10</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{getRatingLabel(reviewScore)}</div>
                    <div className="text-sm text-muted-foreground">
                      Based on {reviewCount} guest {reviewCount === 1 ? "review" : "reviews"}
                    </div>
                  </div>
                </div>

                {/* Rating Breakdown */}
                {totalReviewsInBreakdown > 0 && (
                  <div className="flex-1 space-y-2">
                    {([5, 4, 3, 2, 1] as const).map((stars) => {
                      const count = ratingBreakdown[stars];
                      const percentage = totalReviewsInBreakdown > 0 
                        ? (count / totalReviewsInBreakdown) * 100 
                        : 0;
                      
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-16">
                            <span className="text-sm font-medium">{stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                          <Progress value={percentage} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Individual Reviews */}
            {reviews.length > 0 ? (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-lg">Recent Reviews</h4>
                
                {displayedReviews.map((review) => (
                  <div 
                    key={review.id} 
                    className="p-4 rounded-lg bg-muted/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {review.reviewer_name || "Anonymous Guest"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(review.review_date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(review.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{review.review_text}</p>
                    
                    {review.helpful_count > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{review.helpful_count} found this helpful</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show more/less toggle */}
                {reviews.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show All {reviews.length} Reviews
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : reviewCount > 0 ? (
              // Has review score but no individual reviews in DB
              <div className="pt-4 border-t text-center text-muted-foreground">
                <p>Individual reviews are not available for this property.</p>
                <p className="text-sm mt-1">
                  The overall rating is based on {reviewCount} verified guest {reviewCount === 1 ? "stay" : "stays"}.
                </p>
              </div>
            ) : (
              // No reviews at all
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No reviews yet</p>
                <p className="text-sm mt-1">Be the first to share your experience!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }
);
