import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface SplineBackgroundProps {
  url: string;
  opacity?: number;
  overlayColor?: string;
  zIndex?: number;
  gradientOverlay?: boolean;
  disableInteraction?: boolean;
}

// Create a global event bus to trigger background effects
export const backgroundEffectBus = {
  listeners: new Set<() => void>(),
  
  // Register a listener
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // Trigger the effect
  triggerEffect() {
    this.listeners.forEach(callback => callback());
  }
};

export function SplineBackground({
  url,
  opacity = 0.5, // Increased default opacity for better text contrast
  overlayColor = 'black',
  zIndex = -1,
  gradientOverlay = false,
  disableInteraction = false
}: SplineBackgroundProps) {
  const [isHovered, setIsHovered] = useState(false);
  const effectTimeout = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();
  
  // Handle the hover effect
  const handleInteraction = () => {
    if (disableInteraction) return;
    
    setIsHovered(true);
    
    // Reset the timeout if it exists
    if (effectTimeout.current) {
      clearTimeout(effectTimeout.current);
    }
    
    // Set a timeout to revert the effect
    effectTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000); // Effect lasts for 2 seconds
  };
  
  // Listen for global interaction events
  useEffect(() => {
    const unsubscribe = backgroundEffectBus.subscribe(handleInteraction);
    
    // Clean up event listener and timeout
    return () => {
      unsubscribe();
      if (effectTimeout.current) {
        clearTimeout(effectTimeout.current);
      }
    };
  }, []);
  
  // Listen for user interactions across the entire site
  useEffect(() => {
    const handleDocumentInteraction = () => {
      backgroundEffectBus.triggerEffect();
    };
    
    // Add event listeners for various interactions
    document.addEventListener('click', handleDocumentInteraction);
    document.addEventListener('keydown', handleDocumentInteraction);
    document.addEventListener('mousedown', handleDocumentInteraction);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleDocumentInteraction);
      document.removeEventListener('keydown', handleDocumentInteraction);
      document.removeEventListener('mousedown', handleDocumentInteraction);
    };
  }, []);
  
  // Animation variants for the background
  const frameVariants = {
    default: { 
      scale: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    },
    active: { 
      scale: 1.05, 
      opacity: 0.9,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  // Update the animation state when hover changes
  useEffect(() => {
    controls.start(isHovered ? 'active' : 'default');
  }, [isHovered, controls]);

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex }}
    >
      {/* Spline 3D Model Background */}
      <motion.div
        initial="default"
        animate={controls}
        variants={frameVariants}
        className="w-full h-full"
      >
        <iframe
          src={url}
          frameBorder="0"
          width="100%"
          height="100%"
          style={{
            pointerEvents: 'none',
            border: 'none',
            background: 'transparent'
          }}
          title="Mirxa AI 3D Background"
        ></iframe>
      </motion.div>
      
      {/* Overlay to ensure content readability */}
      {gradientOverlay ? (
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity }}
          animate={{ 
            opacity: isHovered ? opacity * 0.85 : opacity 
          }}
          transition={{ duration: 0.5 }}
          style={{ 
            background: `linear-gradient(to bottom, ${overlayColor}CC, ${overlayColor}99)`,
          }}
        ></motion.div>
      ) : (
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity }}
          animate={{ 
            opacity: isHovered ? opacity * 0.85 : opacity 
          }}
          transition={{ duration: 0.5 }}
          style={{ 
            backgroundColor: overlayColor,
          }}
        ></motion.div>
      )}
    </div>
  );
}