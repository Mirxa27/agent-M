import React, { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { AuthProvider } from "@/hooks/use-auth";
import { AppRoutes } from "@/components/router/app-routes";

function App() {
  // Create a language change handler that updates the HTML element's class
  const handleLanguageChange = (lng: string) => {
    document.documentElement.className = lng.startsWith('ar') ? 'rtl' : 'ltr';
  };

  // Set initial direction based on current language
  useEffect(() => {
    const currentLng = i18n.language;
    handleLanguageChange(currentLng);
    
    // Add language change listener
    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AppRoutes />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
