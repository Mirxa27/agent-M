import React from "react";
import { AnimatedLoader } from "./animated-loader";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface LoadingContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  loaderSize?: "sm" | "md" | "lg" | "xl";
  loaderVariant?: "spinner" | "bot" | "brain" | "gears" | "stars";
  loadingText?: string;
  overlay?: boolean;
  children: React.ReactNode;
}

export function LoadingContainer({
  isLoading,
  loaderSize = "md",
  loaderVariant = "bot",
  loadingText = "Loading...",
  overlay = false,
  children,
  className,
  ...props
}: LoadingContainerProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (overlay) {
    return (
      <div className="relative" {...props}>
        {children}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/60 z-10",
            className,
          )}
        >
          <AnimatedLoader
            variant={loaderVariant}
            size={loaderSize}
            text={loadingText}
          />
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn("flex flex-col items-center justify-center p-8", className)}
      {...props}
    >
      <AnimatedLoader
        variant={loaderVariant}
        size={loaderSize}
        text={loadingText}
      />
    </Card>
  );
}
