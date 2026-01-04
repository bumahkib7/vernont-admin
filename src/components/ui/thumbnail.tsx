"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

type ThumbnailProps = {
  thumbnail?: string | null;
  images?: { url: string }[];
  size?: "small" | "medium" | "large" | "full" | "square";
  isFeatured?: boolean;
  className?: string;
  alt?: string;
};

/**
 * Thumbnail component for product images
 * Based on Medusa's Thumbnail component
 */
export function Thumbnail({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  alt = "Product image",
}: ThumbnailProps) {
  const initialImage = thumbnail || images?.[0]?.url;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-square": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        },
        className
      )}
    >
      <ImageOrPlaceholder image={initialImage} size={size} alt={alt} />
    </div>
  );
}

function ImageOrPlaceholder({
  image,
  size,
  alt,
}: {
  image?: string;
  size: string;
  alt: string;
}) {
  return image ? (
    <Image
      src={image}
      alt={alt}
      fill
      sizes={
        size === "full"
          ? "(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          : size === "large"
          ? "440px"
          : size === "medium"
          ? "290px"
          : "180px"
      }
      className="absolute inset-0 object-cover object-center transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <Package className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

/**
 * Stacked thumbnails for displaying multiple product images
 */
type StackedThumbnailsProps = {
  images: string[];
  maxVisible?: number;
  size?: "small" | "medium";
  className?: string;
};

export function StackedThumbnails({
  images,
  maxVisible = 3,
  size = "small",
  className,
}: StackedThumbnailsProps) {
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  const sizeClasses = {
    small: "h-10 w-10",
    medium: "h-14 w-14",
  };

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleImages.map((image, index) => (
        <div
          key={index}
          className={cn(
            "relative overflow-hidden rounded-md border-2 border-background",
            sizeClasses[size]
          )}
        >
          <Image
            src={image}
            alt={`Image ${index + 1}`}
            fill
            className="object-cover"
            sizes={size === "small" ? "40px" : "56px"}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-md border-2 border-background bg-muted text-xs font-medium",
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
