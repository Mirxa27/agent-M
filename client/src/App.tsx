import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import DashboardPage from "@/pages/dashboard-page";
import AgentsPage from "@/pages/agents-page";
import CredentialsPage from "@/pages/credentials-page";
import FilesPage from "@/pages/files-page";
import TaskHistoryPage from "@/pages/task-history-page";
import AdminDashboard from "@/pages/admin/dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Custom route component for admin routes
function AdminRoute({ path, component: Component }: { path: string, component: () => React.JSX.Element }) {
  return (
    <ProtectedRoute 
      path={path} 
      component={() => {
        // Additional admin role check could be added here in the component
        return <Component />;
      }} 
    />
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
      <ProtectedRoute path="/tasks" component={TaskHistoryPage} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Catch-all for 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
