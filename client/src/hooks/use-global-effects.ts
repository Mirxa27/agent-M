import { useCallback, useEffect } from "react";
import { useBackground } from "@/contexts/background-context";
import { backgroundEffectBus } from "@/lib/background-effect-bus";

/**
 * Hook to set up global interaction effects for the whole application
 * 
 * This hook adds event listeners to trigger background animations
 * based on user interactions across the entire site
 */
export function useGlobalEffects() {
  const { triggerBackgroundEffect } = useBackground();
  
  // Callback for click events anywhere on the document
  const handleDocumentClick = useCallback((event: MouseEvent) => {
    // Get the mouse coordinates for positioning effects
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    
    // Trigger the effect with coordinates
    backgroundEffectBus.triggerEffect({ 
      x: clientX / innerWidth,
      y: clientY / innerHeight,
      type: 'click'
    });
    
    // Also trigger the legacy background effect for compatibility
    triggerBackgroundEffect();
  }, [triggerBackgroundEffect]);
  
  // Callback for key presses
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only trigger on space or enter key
    if (event.key === " " || event.key === "Enter") {
      backgroundEffectBus.triggerEffect({ type: 'keypress' });
      triggerBackgroundEffect();
    }
  }, [triggerBackgroundEffect]);
  
  // Set up global document-level event listeners
  useEffect(() => {
    // Throttle function to prevent excessive animations
    let lastTriggered = 0;
    const THROTTLE_MS = 700; // Match with animation duration
    
    const throttledTrigger = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastTriggered > THROTTLE_MS) {
        handleDocumentClick(event);
        lastTriggered = now;
      }
    };
    
    // Add event listeners
    document.addEventListener("click", throttledTrigger);
    document.addEventListener("keydown", handleKeyPress);
    
    // Navigation trigger - detect route changes via URL
    let lastPath = window.location.pathname;
    
    const checkPathChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        backgroundEffectBus.triggerEffect({ type: 'navigation' });
        triggerBackgroundEffect();
        lastPath = currentPath;
      }
    };
    
    // Check for route changes periodically
    const routeCheckInterval = setInterval(checkPathChange, 300);
    
    // Clean up
    return () => {
      document.removeEventListener("click", throttledTrigger);
      document.removeEventListener("keydown", handleKeyPress);
      clearInterval(routeCheckInterval);
    };
  }, [triggerBackgroundEffect, handleKeyPress, handleDocumentClick]);
}