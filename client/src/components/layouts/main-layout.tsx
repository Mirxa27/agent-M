import { GamifiedChatbot } from "@/components/chatbot";
import { Header } from "@/components/navigation/header";
import { MobileFooterNav } from "@/components/navigation/mobile-footer-nav";
import { SplineBackground } from "@/components/ui/spline-background";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { useLocation } from "wouter";

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

  // Determine if the current page is the AI Agent Chat page
  const isAiAgentChatPage = location === "/ai-agent-chat";

  return (
    <div className="min-h-screen flex flex-col">
      {/* 3D Model Background */}
      <SplineBackground
        url="https://my.spline.design/nexbotrobotcharacterconcept-5f03ff963626fbbf4952a35a16e4a4f3/"
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

      {!hideNav && user && !isAiAgentChatPage && <MobileFooterNav />}

      {/* Gamified Chatbot - Available for both logged in and guest users */}
      <GamifiedChatbot />
    </div>
  );
}
