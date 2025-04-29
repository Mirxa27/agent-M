import React, { ReactNode } from "react";
import { useGlobalEffects } from "@/hooks/use-global-effects";

/**
 * Provider component that applies global effects to the entire application
 */
interface GlobalEffectsProviderProps {
  children: ReactNode;
}

export function GlobalEffectsProvider({ children }: GlobalEffectsProviderProps) {
  // Apply global effects 
  useGlobalEffects();
  
  // Simply render children - the hook handles the effects
  return <>{children}</>;
}