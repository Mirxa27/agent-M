import React, { useRef, useEffect, useState, useCallback, lazy, Suspense, Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { backgroundEffectBus } from "@/lib/background-effect-bus";
// Using React.lazy for dynamic import instead of next/dynamic
const Spline = lazy(() => import("@splinetool/react-spline"));

// Simple ErrorBoundary component to catch and handle errors in the Spline component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Spline error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return <div className="w-full h-full bg-gradient-to-b from-background/30 to-background/50" />;
    }

    return this.props.children;
  }
}

interface SplineBackgroundProps {
  url: string;
  opacity?: number;
  overlayColor?: string;
  gradientOverlay?: boolean;
  zIndex?: number;
}

export function SplineBackground({
  url,
  opacity = 0.4,
  overlayColor = "#000010",
  gradientOverlay = false,
  zIndex = 0,
}: SplineBackgroundProps) {
  // Create refs for accessing DOM elements or spline object
  const splineRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track the animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [scale, setScale] = useState(1);
  const [effectOpacity, setEffectOpacity] = useState(opacity);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  // Throttle function to limit how often we update state
  const throttle = (callback: Function, delay: number) => {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) return;
      lastCall = now;
      return callback(...args);
    };
  };

  // Handle mouse movement across the screen
  const handleMouseMove = throttle((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    // Calculate mouse position relative to the window
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Convert to normalized coordinates (-1 to 1)
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    
    // Update position for subtle movement effect
    setPosition({ 
      x: x * 10, // Limit movement range
      y: y * 10
    });
    
    // Update rotation for subtle tilt effect
    setRotation({
      x: y * 1.5, // Tilt based on vertical mouse position
      y: -x * 1.5 // Tilt based on horizontal mouse position (inverted)
    });
    
    // Also pass event to background effect bus for other components
    backgroundEffectBus.triggerEffect({
      x: clientX / innerWidth,
      y: clientY / innerHeight,
      type: 'mousemove'
    });
  }, 20); // Throttle to 50fps

  // Handle the background effect animation (for clicks and interactions)
  const handleTriggerEffect = (event?: { x?: number; y?: number; type?: string }) => {
    if (isAnimating) return; // Prevent multiple animations at once
    
    setIsAnimating(true);
    
    // Different effects based on event type
    if (event?.type === 'mousemove') {
      // Mouse movement already handled by handleMouseMove
      return;
    } else if (event?.type === 'click') {
      // Stronger effect for clicks
      setScale(1.08);
      setEffectOpacity(opacity * 0.7);
    } else {
      // Default effect
      setScale(1.05);
      setEffectOpacity(opacity * 0.8);
    }
    
    // Reset after animation completes
    setTimeout(() => {
      setScale(1);
      setEffectOpacity(opacity);
      
      // Add a small delay before allowing another animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    }, 800);
  };

  // Subscribe to the global background effect events
  useEffect(() => {
    const unsubscribe = backgroundEffectBus.addListener(handleTriggerEffect);
    
    // Add global mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Add click listener for click effects
    const handleClick = () => {
      backgroundEffectBus.triggerEffect({ type: 'click' });
    };
    window.addEventListener('click', handleClick);
    
    // Clean up the subscriptions
    return () => {
      unsubscribe();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [isAnimating]); // Re-subscribe when animation state changes

  // Handle loading errors for the Spline component
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Handler for Spline loading
  const handleSplineLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  // Handler for Spline errors
  const handleSplineError = useCallback(() => {
    console.warn("Spline background loading failed, falling back to gradient");
    setHasError(true);
  }, []);

  // Effect to add error boundary for Spline loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // If not loaded after timeout, consider it failed
      if (!loaded && !hasError) {
        handleSplineError();
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timer);
  }, [loaded, hasError, handleSplineError]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ zIndex }}
    >
      {/* The Spline 3D model with animation effects */}
      <motion.div
        className="w-full h-full"
        animate={{
          scale,
          opacity: effectOpacity,
          x: position.x, // Move horizontally based on mouse position
          y: position.y, // Move vertically based on mouse position
          rotateX: rotation.x, // Tilt based on vertical position  
          rotateY: rotation.y, // Tilt based on horizontal position
          transition: { 
            duration: 0.8, 
            ease: "easeInOut",
            x: { 
              duration: 0.3,
              ease: "easeOut"
            },
            y: { 
              duration: 0.3,
              ease: "easeOut"
            },
            rotateX: { 
              duration: 0.3,
              ease: "easeOut"
            },
            rotateY: { 
              duration: 0.3,
              ease: "easeOut"
            }
          }
        }}
      >
        {!hasError && (
          <Suspense fallback={<div className="w-full h-full bg-gradient-to-b from-background/50 to-background/70" />}>
            <ErrorBoundary>
              <div className="w-full h-full">
                <Spline
                  ref={splineRef}
                  scene={url}
                  className="w-full h-full"
                  onLoad={handleSplineLoad}
                  onError={handleSplineError}
                />
              </div>
            </ErrorBoundary>
          </Suspense>
        )}
      </motion.div>
      
      {/* Fallback gradient if Spline fails */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60" />
      )}
      
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