import React, { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/hooks/use-auth";
import { BackgroundProvider } from "@/contexts/background-context";
import { GlobalEffectsProvider } from "@/components/providers/global-effects-provider";
import { AppRoutes } from "@/components/router/app-routes";

function App() {
  const { i18n } = useTranslation();

  // Create a language change handler that updates the HTML element's class
  const handleLanguageChange = (lng: string) => {
    document.documentElement.className = lng.startsWith("ar") ? "rtl" : "ltr";
  };

  // Set initial direction based on current language
  useEffect(() => {
    const currentLng = i18n.language;
    handleLanguageChange(currentLng);

    // Add language change listener
    i18n.on("languageChanged", handleLanguageChange);

    // Cleanup
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <BackgroundProvider>
            <GlobalEffectsProvider>
              <TooltipProvider>
                <Toaster />
                <AppRoutes />
              </TooltipProvider>
            </GlobalEffectsProvider>
          </BackgroundProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
