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
    <Route path={path}>
      {() => {
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
