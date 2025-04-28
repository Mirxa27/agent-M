import React from "react";
import { AnimatedLoader } from "./animated-loader";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  animated?: boolean;
}

export function Skeleton({
  className,
  animated = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/50",
        animated && "animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

interface ContentSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  withHeader?: boolean;
  withImage?: boolean;
  type?: "list" | "card" | "table" | "grid";
  characterAnimation?: boolean;
}

export function ContentSkeleton({
  rows = 5,
  withHeader = true,
  withImage = false,
  type = "list",
  characterAnimation = true,
  className,
  ...props
}: ContentSkeletonProps) {
  if (type === "card" && characterAnimation) {
    return (
      <Card
        className={cn("p-6 relative flex flex-col items-center", className)}
        {...props}
      >
        <AnimatedLoader variant="bot" size="md" className="mb-4" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-3 w-5/6 mb-2" />
        <Skeleton className="h-3 w-4/6 mb-2" />
        <Skeleton className="h-3 w-5/6 mb-2" />
      </Card>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {characterAnimation && (
          <div className="flex justify-center mb-4">
            <AnimatedLoader variant="gears" size="sm" />
          </div>
        )}
        {withHeader && (
          <div className="flex gap-4 p-3">
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
          </div>
        )}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-4 p-3 border-b">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          className,
        )}
        {...props}
      >
        {characterAnimation && (
          <div className="flex justify-center col-span-full mb-4">
            <AnimatedLoader variant="stars" size="sm" />
          </div>
        )}
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-4 flex flex-col">
            {withImage && <Skeleton className="h-32 w-full mb-3" />}
            <Skeleton className="h-4 w-4/5 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
            <div className="mt-auto pt-2">
              <Skeleton className="h-8 w-full mt-2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Default list type
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {characterAnimation && (
        <div className="flex justify-center mb-4">
          <AnimatedLoader variant="brain" size="sm" />
        </div>
      )}
      {withHeader && <Skeleton className="h-8 w-1/3 mb-4" />}
      {withImage && <Skeleton className="h-48 w-full mb-4" />}
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  );
}
