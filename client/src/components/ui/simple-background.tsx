import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

// Create an event bus for triggering the background effect from any component
class BackgroundEffectBus {
  private listeners: (() => void)[] = [];

  // Add a listener to the event bus
  addListener(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Trigger all registered listeners
  triggerEffect() {
    this.listeners.forEach(listener => listener());
  }
}

// Export a singleton instance of the bus
export const backgroundEffectBus = new BackgroundEffectBus();

interface SimpleBackgroundProps {
  gradientColors?: string[];
  opacity?: number;
  overlayColor?: string;
  gradientOverlay?: boolean;
  zIndex?: number;
}

export function SimpleBackground({
  gradientColors = ["#4f46e5", "#22c55e", "#3b82f6"],
  opacity = 0.4,
  overlayColor = "#000010",
  gradientOverlay = false,
  zIndex = 0,
}: SimpleBackgroundProps) {
  // Create ref for accessing DOM element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track the animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [scale, setScale] = useState(1);
  const [effectOpacity, setEffectOpacity] = useState(opacity);

  // Handle the background effect animation
  const handleTriggerEffect = () => {
    if (isAnimating) return; // Prevent multiple animations at once
    
    setIsAnimating(true);
    
    // Change scale and opacity for the animation effect
    setScale(1.06); // Scale up slightly
    setEffectOpacity(opacity * 0.8); // Reduce opacity a bit
    
    // Reset after animation completes
    setTimeout(() => {
      setScale(1);
      setEffectOpacity(opacity);
      
      // Add a small delay before allowing another animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    }, 1000);
  };

  // Subscribe to the global background effect events
  useEffect(() => {
    const unsubscribe = backgroundEffectBus.addListener(handleTriggerEffect);
    
    // Clean up the subscription
    return () => {
      unsubscribe();
    };
  }, [isAnimating]); // Re-subscribe when animation state changes

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ zIndex }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="w-full h-full bg-gradient-to-br animate-gradient-slow"
        style={{
          backgroundSize: "400% 400%",
          backgroundImage: `linear-gradient(135deg, ${gradientColors.join(", ")})`,
        }}
        animate={{
          scale,
          opacity: effectOpacity,
          transition: { duration: 0.8, ease: "easeInOut" }
        }}
      />
      
      {/* Color overlay with gradient or flat color */}
      {gradientOverlay ? (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/60 mix-blend-multiply"
          style={{ zIndex: zIndex + 1 }}
        />
      ) : (
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: overlayColor,
            opacity: 0.5,
            zIndex: zIndex + 1,
            mixBlendMode: "multiply"
          }}
        />
      )}
    </div>
  );
}