import React, { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/navigation/header";
import { MobileFooterNav } from "@/components/navigation/mobile-footer-nav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function MainLayout({ children, className, hideNav }: MainLayoutProps) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Header />}
      
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      
      {!hideNav && user && <MobileFooterNav />}
    </div>
  );
}