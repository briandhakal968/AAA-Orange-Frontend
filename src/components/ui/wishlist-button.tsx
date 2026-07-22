"use client";

import { useState, useRef } from "react";
import { useWishlist } from "@/context/wishlist-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
  showLabel?: boolean;
}

export function WishlistButton({ productId, size = "md", className = "", asLink = false, showLabel = false }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const inWishlist = isInWishlist(productId);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (asLink) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isLoggedIn) {
            router.push("/login");
            return;
          }
          router.push("/wishlist");
        }}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center transition-all duration-200
          bg-white/90 text-neutral-600 hover:text-red-500 hover:bg-white border border-neutral-200
          ${className}
        `}
        title="View Wishlist"
      >
        <svg
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
    }
  };

  if (showLabel) {
    return (
      <div className="flex items-center justify-between">
        <button
          ref={buttonRef}
          onClick={handleClick}
          disabled={loading}
          className={`
            inline-flex items-center gap-2 transition-all duration-200
            ${inWishlist 
              ? "text-red-500" 
              : "text-neutral-600 hover:text-red-500"
            }
            ${isAnimating ? "scale-105" : "scale-100"}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className="w-5 h-5"
            fill={inWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-sm font-medium">{inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</span>
        </button>

        {inWishlist && (
          <button
            onClick={() => router.push("/wishlist")}
            className="text-sm text-neutral-500 hover:text-black underline"
          >
            View Wishlist
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center transition-all duration-200
        ${inWishlist 
          ? "bg-red-500 text-white hover:bg-red-600" 
          : "bg-white/90 text-neutral-600 hover:text-red-500 hover:bg-white border border-neutral-200"
        }
        ${isAnimating ? "scale-125" : "scale-100"}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        className={iconSizes[size]}
        fill={inWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
