import React, { createContext, useContext, ReactNode, useState } from "react";
import { backgroundEffectBus } from "@/components/ui/simple-background";

// Define the shape of our context
interface BackgroundContextType {
  isAnimating: boolean;
  triggerBackgroundEffect: () => void;
}

// Create the context with a default value
const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

// Provider component to wrap around components that need access to the background context
interface BackgroundProviderProps {
  children: ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to trigger the background effect
  const triggerBackgroundEffect = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    backgroundEffectBus.triggerEffect();
    
    // Reset animating state after the animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 1200); // Slightly longer than the animation duration to prevent rapid triggering
  };

  // Context value
  const value = {
    isAnimating,
    triggerBackgroundEffect,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

// Custom hook to use the background context
export function useBackground(): BackgroundContextType {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}