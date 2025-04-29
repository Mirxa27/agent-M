import { useCallback, useEffect } from "react";
import { useBackground } from "@/contexts/background-context";

/**
 * Hook to set up global interaction effects for the whole application
 * 
 * This hook adds event listeners to trigger background animations
 * based on user interactions across the entire site
 */
export function useGlobalEffects() {
  const { triggerBackgroundEffect } = useBackground();
  
  // Callback for click events anywhere on the document
  const handleDocumentClick = useCallback(() => {
    triggerBackgroundEffect();
  }, [triggerBackgroundEffect]);
  
  // Callback for key presses
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only trigger on space or enter key
    if (event.key === " " || event.key === "Enter") {
      triggerBackgroundEffect();
    }
  }, [triggerBackgroundEffect]);
  
  // Set up global document-level event listeners
  useEffect(() => {
    // Throttle function to prevent excessive animations
    let lastTriggered = 0;
    const THROTTLE_MS = 700; // Match with animation duration
    
    const throttledTrigger = () => {
      const now = Date.now();
      if (now - lastTriggered > THROTTLE_MS) {
        triggerBackgroundEffect();
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
  }, [triggerBackgroundEffect, handleKeyPress]);
}