import React, { createContext, useContext, useState, ReactNode } from "react";

interface BackgroundContextType {
  isAnimating: boolean;
  triggerBackgroundEffect: () => void;
}

// Create context with default values
const BackgroundContext = createContext<BackgroundContextType>({
  isAnimating: false,
  triggerBackgroundEffect: () => {},
});

// Props for the provider component
interface BackgroundProviderProps {
  children: ReactNode;
}

// Provider component that will wrap the app
export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to trigger the background animation effect
  const triggerBackgroundEffect = () => {
    // If already animating, don't restart the animation
    if (isAnimating) return;
    
    // Set animation flag to true
    setIsAnimating(true);
    
    // Reset after animation is complete
    setTimeout(() => {
      setIsAnimating(false);
    }, 700); // Match timing with CSS transition
  };

  return (
    <BackgroundContext.Provider
      value={{
        isAnimating,
        triggerBackgroundEffect,
      }}
    >
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