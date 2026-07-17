"use client";

import { useState, useEffect } from "react";
import { Star, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useCountry } from "@/context/country-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  author_name: string;
  is_verified_purchase: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  country?: {
    id: number;
    name: string;
    flag: string;
  };
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
}

interface ReviewsListProps {
  productId: number;
  showForm?: boolean;
  onFormClose?: () => void;
}

export function ReviewsList({ productId, showForm = false, onFormClose }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average_rating: 0, total_reviews: 0 });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFormState, setShowFormState] = useState(showForm);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const isLoggedIn = !!token;
  const { selectedCountry } = useCountry();

  const fetchReviews = async (page = 1) => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      let url = `${API_URL}/api/products/${productId}/reviews?page=${page}`;
      if (selectedCountry?.id) {
        url += `&country_id=${selectedCountry.id}`;
      }
      if (ratingFilter) {
        url += `&rating=${ratingFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, ratingFilter, selectedCountry?.id]);

  const handleReviewSubmit = () => {
    setShowFormState(false);
    onFormClose?.();
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => r.rating === rating).length;
    const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
    return { rating, count, percentage };
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold">{stats.average_rating}</div>
          <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.average_rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-neutral-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {stats.total_reviews} {stats.total_reviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="space-y-2">
          {ratingCounts.map(({ rating, count, percentage }) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
              className={cn(
                "flex items-center gap-3 w-full group",
                ratingFilter === rating && "bg-muted/50 rounded px-2 py-1 -mx-2"
              )}
            >
              <span className="text-sm w-12">{rating} star</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {ratingFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Filtered by {ratingFilter} stars</span>
          <button
            onClick={() => setRatingFilter(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Reviews</h3>
          {isLoggedIn ? (
            <Button onClick={() => setShowFormState(!showFormState)}>
              {showFormState ? "Cancel" : "Write a Review"}
            </Button>
          ) : (
            <Button onClick={() => setShowLoginPrompt(true)}>
              Write a Review
            </Button>
          )}
        </div>

        {showLoginPrompt && (
          <div className="mb-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
            <p className="text-neutral-600 mb-4">Please login to write a review</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowLoginPrompt(false);
                window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
              }}>
                Login
              </Button>
            </div>
          </div>
        )}

        {showFormState && (
          <div className="mb-8 p-6 bg-muted/30 rounded-lg">
            <ReviewFormInline productId={productId} onSuccess={handleReviewSubmit} />
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{review.author_name}</div>
                        {review.country && (
                          <span className="text-sm" title={review.country.name}>
                            {review.country.flag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(review.created_at)}</span>
                        {review.is_verified_purchase && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-none text-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-4 text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-neutral-200">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchReviews(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchReviews(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewFormInline({ productId, onSuccess }: { productId: number; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const { selectedCountry } = useCountry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!token) {
      setError("Please login to submit a review");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          country_id: selectedCountry?.id || null,
        }),
      });

      if (response.status === 401) {
        setError("Please login to submit a review");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || "Failed to submit review");
      }

      setRating(0);
      setComment("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Your Rating *</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-neutral-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product"
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
