import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { SplineBackground } from "@/components/ui/spline-background";
import { backgroundEffectBus } from "@/lib/background-effect-bus";

interface BackgroundContextType {
  isAnimating: boolean;
  triggerBackgroundEffect: () => void;
  backgroundType: "spline" | "simple";
  setBackgroundType: (type: "spline" | "simple") => void;
}

// Create context with default values
const BackgroundContext = createContext<BackgroundContextType>({
  isAnimating: false,
  triggerBackgroundEffect: () => {},
  backgroundType: "spline",
  setBackgroundType: () => {},
});

// Props for the provider component
interface BackgroundProviderProps {
  children: ReactNode;
}

// Provider component that will wrap the app
export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [backgroundType, setBackgroundType] = useState<"spline" | "simple">("spline");

  // Function to trigger the background animation effect
  const triggerBackgroundEffect = () => {
    // If already animating, don't restart the animation
    if (isAnimating) return;
    
    // Set animation flag to true
    setIsAnimating(true);
    
    // Also trigger the effect on the bus
    backgroundEffectBus.triggerEffect({ type: 'triggered' });
    
    // Reset after animation is complete
    setTimeout(() => {
      setIsAnimating(false);
    }, 700); // Match timing with CSS transition
  };
  
  // The URL to your Spline scene
  const splineSceneUrl = "https://prod.spline.design/uYFcDXx7j7hzMpyL/scene.splinecode";

  return (
    <BackgroundContext.Provider
      value={{
        isAnimating,
        triggerBackgroundEffect,
        backgroundType,
        setBackgroundType,
      }}
    >
      {/* 3D Spline Background */}
      {backgroundType === "spline" && (
        <SplineBackground 
          url={splineSceneUrl}
          opacity={0.5}
          gradientOverlay={true}
          zIndex={-1}
        />
      )}
      
      {children}
    </BackgroundContext.Provider>
  );
}

// Custom hook to use the background context
export function useBackground(): BackgroundContextType {
  const context = useContext(BackgroundContext);
  
  if (!context) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  
  return context;
}