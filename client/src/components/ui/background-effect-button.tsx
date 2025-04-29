import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useBackground } from "@/contexts/background-context";

// Component extends the regular button but adds background effect
export function BackgroundEffectButton({
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const { triggerBackgroundEffect } = useBackground();
  
  // Handle the click event
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger the background effect
    triggerBackgroundEffect();
    
    // Call the original onClick handler if it exists
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <Button 
      className={className} 
      onClick={handleClick} 
      {...props}
    >
      {children}
    </Button>
  );
}