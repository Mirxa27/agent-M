import React, { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { withBackgroundEffect } from "@/components/ui/with-background-effect";
import { cn } from "@/lib/utils";

// Create a button component that triggers background effect on click
export const BackgroundEffectButton = withBackgroundEffect<
  ButtonHTMLAttributes<HTMLButtonElement>
>(
  React.forwardRef<
    HTMLButtonElement, 
    ButtonHTMLAttributes<HTMLButtonElement>
  >(({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn("transition-all", className)}
      {...props}
    >
      {children}
    </Button>
  ))
);

// Add a display name for better debuggability
BackgroundEffectButton.displayName = "BackgroundEffectButton";