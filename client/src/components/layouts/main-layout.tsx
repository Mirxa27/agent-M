import React, { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/navigation/header";
import { MobileFooterNav } from "@/components/navigation/mobile-footer-nav";
import { GamifiedChatbot } from "@/components/chatbot";
import { SimpleBackground } from "@/components/ui/simple-background";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useBackground } from "@/contexts/background-context";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
  noPadding?: boolean;
  customLayout?: boolean;
}

export function MainLayout({
  children,
  className,
  hideNav,
  noPadding = false,
  customLayout = false,
}: MainLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { triggerBackgroundEffect } = useBackground();
  
  // Detect if we're on the AI Browser page
  const isAiBrowserPage = location === "/ai-browser";

  // Set up event listeners for user interactions
  useEffect(() => {
    // Initial effect for page load animation
    const timeoutId = setTimeout(() => {
      triggerBackgroundEffect();
    }, 300);
    
    // Clean up timeout
    return () => {
      clearTimeout(timeoutId);
    };
  }, [triggerBackgroundEffect]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient Background with interactive hover effect */}
      <SimpleBackground 
        gradientColors={["#4f46e5", "#3b82f6", "#0ea5e9"]}
        opacity={0.6}
        gradientOverlay={true}
      />
      
      {!hideNav && <Header customLayout={customLayout} />}

      <main
        className={cn("flex-1 w-full max-w-full overflow-x-hidden", className)}
      >
        <div
          className={cn(
            "min-w-0 w-full",
            !noPadding && !customLayout &&
              "p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-5 md:space-y-6",
          )}
        >
          {/* Ensures content won't overflow horizontally and adds adaptive padding */}
          {children}
        </div>
      </main>

      {!hideNav && user && !isAiBrowserPage && <MobileFooterNav />}
      
      {/* Gamified Chatbot - Available for both logged in and guest users */}
      <GamifiedChatbot />
    </div>
  );
}
