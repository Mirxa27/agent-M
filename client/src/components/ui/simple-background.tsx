import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useBackground } from "@/contexts/background-context";

interface SimpleBackgroundProps {
  gradientColors?: string[];
  opacity?: number;
  overlayColor?: string;
  gradientOverlay?: boolean;
  zIndex?: number;
  animationSpeed?: "slow" | "medium" | "fast";
  hoverEffect?: "zoom" | "pulse" | "brighten";
}

export function SimpleBackground({
  gradientColors = ["#4f46e5", "#3b82f6", "#0ea5e9"],
  opacity = 0.7,
  overlayColor = "rgba(0,0,10,0.4)",
  gradientOverlay = true,
  zIndex = 0,
  animationSpeed = "medium",
  hoverEffect = "zoom",
}: SimpleBackgroundProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const { isAnimating } = useBackground();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Build the gradient background
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${gradientColors.join(", ")})`,
    backgroundSize: "400% 400%",
    opacity,
  };
  
  // Animation classes based on speed
  const animationClass = {
    slow: "animate-gradient-slow",
    medium: "animate-gradient-medium",
    fast: "animate-gradient-fast",
  }[animationSpeed];
  
  // Set up pointer move effect for hover interaction
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const bgElement = backgroundRef.current;
      if (!bgElement) return;
      
      // Calculate relative position in the window
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      // Apply subtle shift to background position based on cursor
      bgElement.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    };
    
    // Add global pointer move listener
    window.addEventListener('mousemove', handlePointerMove);
    
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);
  
  // Handle animation effect triggered by interactions
  useEffect(() => {
    const bgElement = backgroundRef.current;
    if (!bgElement) return;
    
    // Mark as initialized after first render
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }
    
    if (isAnimating) {
      // Apply hover effect based on type
      switch (hoverEffect) {
        case 'zoom':
          bgElement.classList.add("scale-110");
          break;
        case 'pulse':
          bgElement.classList.add("pulse-effect");
          break;
        case 'brighten':
          bgElement.classList.add("brightness-125");
          break;
      }
      
      // Slightly reduce opacity during effect
      bgElement.style.opacity = (opacity * 0.8).toString();
      
      // Remove effect after animation
      const timer = setTimeout(() => {
        bgElement.classList.remove("scale-110", "pulse-effect", "brightness-125");
        bgElement.style.opacity = opacity.toString();
      }, 700);
      
      return () => clearTimeout(timer);
    }
  }, [isAnimating, opacity, isInitialized, hoverEffect]);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ zIndex }}
    >
      {/* Gradient Background */}
      <div
        ref={backgroundRef}
        className={cn(
          "absolute inset-0 w-full h-full transition-all duration-700",
          animationClass
        )}
        style={gradientStyle}
      />
      
      {/* Optional overlay gradient */}
      {gradientOverlay && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${overlayColor} 100%)`,
          }}
        />
      )}
    </div>
  );
}