import React, { 
  forwardRef, 
  useRef, 
  MouseEvent, 
  KeyboardEvent, 
  PropsWithoutRef, 
  ForwardRefExoticComponent, 
  RefAttributes 
} from "react";
import { useBackground } from "@/contexts/background-context";

/**
 * Higher-order component that adds background effect trigger to any component
 * 
 * This wraps the component and adds event handlers for mouse clicks, key presses,
 * and other interactions that will trigger the background animation effect.
 */
export function withBackgroundEffect<
  P extends object,
  T extends React.ElementType = React.ElementType
>(
  Component: T
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<unknown>> {
  // Create a new forwarded ref component
  const WithBackgroundEffect = forwardRef<unknown, P>((props, ref) => {
    const { triggerBackgroundEffect } = useBackground();
    const internalRef = useRef<HTMLElement>(null);
    
    // Event handlers to trigger background effects
    const handleClick = (e: MouseEvent<HTMLElement>) => {
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
        triggerBackgroundEffect();
      }
      
      // Call the original onKeyDown if it exists
      if (props && 'onKeyDown' in props && typeof props.onKeyDown === 'function') {
        props.onKeyDown(e);
      }
    };
    
    // Combine the forwarded ref with our internal ref
    const combinedRef = (node: any) => {
      internalRef.current = node;
      
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<unknown>).current = node;
      }
    };
    
    // Return the wrapped component with added event handlers
    return (
      <Component
        {...props}
        ref={combinedRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
      />
    );
  });
  
  // Set display name for better debugging
  WithBackgroundEffect.displayName = `withBackgroundEffect(${
    typeof Component === 'string' 
      ? Component 
      : Component.displayName || Component.name || 'Component'
  })`;
  
  return WithBackgroundEffect;
}