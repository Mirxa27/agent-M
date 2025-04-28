import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './lib/i18n';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import DashboardPage from "@/pages/dashboard-page";
import AgentsPage from "@/pages/agents-page";
import CredentialsPage from "@/pages/credentials-page";
import FilesPage from "@/pages/files-page";
import TaskHistoryPage from "@/pages/task-history-page";
import LoadersDemoPage from "@/pages/loaders-demo-page";
import LanguageDemoPage from "@/pages/language-demo-page";
import SubscriptionPage from "@/pages/subscription-page";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentFailedPage from "@/pages/payment-failed";
import AdminDashboard from "@/pages/admin/dashboard";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { LanguageNav } from "@/components/navigation/language-nav";

// Custom route component for admin routes
function AdminRoute({ path, component: Component }: { path: string, component: () => React.JSX.Element }) {
  return (
    <Route path={path}>
      {() => {
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <AnimatedLoader variant="bot" size="lg" text="Loading..." />
            </div>
          );
        }
        
        if (!user) {
          return <Route path={path}><AuthPage /></Route>;
        }
        
        if (user.role !== 'admin') {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
              <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
              <a href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                Return to Dashboard
              </a>
            </div>
          );
        }
        
        return <Component />;
      }}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected User Routes */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/agents" component={AgentsPage} />
      <ProtectedRoute path="/credentials" component={CredentialsPage} />
      <ProtectedRoute path="/files" component={FilesPage} />
      <ProtectedRoute path="/task-history" component={TaskHistoryPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      
      {/* Payment Routes */}
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailedPage} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Demo Routes */}
      <ProtectedRoute path="/loaders-demo" component={LoadersDemoPage} />
      <Route path="/language-demo" component={LanguageDemoPage} />
      
      {/* Catch-all for 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

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
              <LanguageNav />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
