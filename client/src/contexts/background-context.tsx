import React, { createContext, useContext, useCallback, ReactNode } from "react";
import { backgroundEffectBus } from "@/components/ui/spline-background";

interface BackgroundContextProps {
  triggerBackgroundEffect: () => void;
}

// Create the context
const BackgroundContext = createContext<BackgroundContextProps | undefined>(undefined);

// Create the provider component
export function BackgroundProvider({ children }: { children: ReactNode }) {
  // Function to trigger the background effect
  const triggerBackgroundEffect = useCallback(() => {
    backgroundEffectBus.triggerEffect();
  }, []);

  // Provide the context
  return (
    <BackgroundContext.Provider value={{ triggerBackgroundEffect }}>
      {children}
    </BackgroundContext.Provider>
  );
}

// Custom hook to use the background context
export function useBackground(): BackgroundContextProps {
  const context = useContext(BackgroundContext);
  
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  
  return context;
}