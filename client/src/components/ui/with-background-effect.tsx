import React, { 
  forwardRef, 
  useRef, 
  MouseEvent, 
  KeyboardEvent, 
  ComponentProps,
  ElementType,
  ForwardRefExoticComponent, 
  RefAttributes 
} from "react";
import { useBackground } from "@/contexts/background-context";
import { backgroundEffectBus } from "@/lib/background-effect-bus";

// Helper type for the HOC
type ComponentPropsWithHandlers<T extends ElementType> = 
  ComponentProps<T> & {
    onClick?: (e: MouseEvent<HTMLElement>) => void,
    onMouseDown?: (e: MouseEvent<HTMLElement>) => void,
    onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
  };

/**
 * Higher-order component that adds background effect trigger to any component
 * 
 * This wraps the component and adds event handlers for mouse clicks, key presses,
 * and other interactions that will trigger the background animation effect.
 */
export function withBackgroundEffect<
  T extends ElementType
>(
  Component: T
): any {
  // Create a new forwarded ref component
  const WithBackgroundEffect = forwardRef<HTMLElement, ComponentPropsWithHandlers<T>>((props, ref) => {
    const { triggerBackgroundEffect } = useBackground();
    const internalRef = useRef<HTMLElement | null>(null);
    
    // Event handlers to trigger background effects
    const handleClick = (e: MouseEvent<HTMLElement>) => {
      // Get element position for targeted effect
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Trigger the 3D Spline background effect via the bus
      backgroundEffectBus.triggerEffect({
        x: centerX / window.innerWidth,
        y: centerY / window.innerHeight,
        type: 'click'
      });
      
      // Also trigger the legacy background effect for compatibility
      triggerBackgroundEffect();
      
      // Call the original onClick if it exists
      if (props && 'onClick' in props && typeof props.onClick === 'function') {
        props.onClick(e);
      }
    };
    
    const handleMouseDown = (e: MouseEvent<HTMLElement>) => {
      // Call the original onMouseDown if it exists
      if (props && 'onMouseDown' in props && typeof props.onMouseDown === 'function') {
        props.onMouseDown(e);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
      // Trigger background effect on Enter or Space key
      if (e.key === 'Enter' || e.key === ' ') {
        // Get element position for targeted effect
        if (e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Trigger with position information
          backgroundEffectBus.triggerEffect({
            x: centerX / window.innerWidth,
            y: centerY / window.innerHeight,
            type: 'keypress'
          });
        }
        
        triggerBackgroundEffect();
      }
      
      // Call the original onKeyDown if it exists
      if (props && 'onKeyDown' in props && typeof props.onKeyDown === 'function') {
        props.onKeyDown(e);
      }
    };
    
    // Handle the ref logic separately to avoid TypeScript issues
    const handleRef = (node: HTMLElement | null) => {
      // Pass to the forwarded ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        // Use unsafe assignment for React's mutable ref object
        (ref as any).current = node;
      }
    };
    
    // Return the wrapped component with added event handlers
    // Spread the props first, then override with our handlers to avoid TypeScript issues
    const componentProps = {
      ...props,
      ref: handleRef,
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      onKeyDown: handleKeyDown
    };
    
    // Use createElement to avoid TypeScript issues with JSX
    return React.createElement(Component, componentProps as any);
  });
  
  // Set display name for better debugging
  WithBackgroundEffect.displayName = `withBackgroundEffect(${
    typeof Component === 'string' 
      ? Component 
      : Component.displayName || Component.name || 'Component'
  })`;
  
  return WithBackgroundEffect;
}