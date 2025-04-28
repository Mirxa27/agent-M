import React, { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { 
  ALL_ROUTES, 
  PUBLIC_ROUTES, 
  PRIVATE_ROUTES, 
  ADMIN_ROUTES,
  PAYMENT_ROUTES,
  RouteConfig
} from "@/lib/routes";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// SEO-friendly page title setting
function usePageTitle() {
  const [location] = useLocation();
  
  useEffect(() => {
    const currentRoute = ALL_ROUTES.find(route => route.path === location);
    document.title = currentRoute 
      ? `${currentRoute.title} | Mirxa.io` 
      : "Mirxa.io - AI Agent Platform";
  }, [location]);
  
  return null;
}

// Protected route with authentication
function ProtectedRoute({ route }: { route: RouteConfig }) {
  const { user, isLoading } = useAuth();
  const Component = route.component;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    window.location.href = "/auth";
    return null;
  }
  
  if (route.isAdmin && user.role !== "admin") {
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
  
  // Wrap component with the appropriate layout
  if (route.layout === "admin") {
    return (
      <AdminLayout title={route.title} subtitle="">
        <Component />
      </AdminLayout>
    );
  }
  
  if (route.layout === "main" || !route.layout) {
    return (
      <MainLayout>
        <Component />
      </MainLayout>
    );
  }
  
  return <Component />;
}

// Public route (accessible to all)
function PublicRouteWithLayout({ route }: { route: RouteConfig }) {
  const Component = route.component;
  
  if (route.layout === "auth") {
    return (
      <AuthLayout title={route.title}>
        <Component />
      </AuthLayout>
    );
  }
  
  if (route.layout === "main") {
    return (
      <MainLayout>
        <Component />
      </MainLayout>
    );
  }
  
  return <Component />;
}

export function AppRoutes() {
  // Update page title based on current route
  usePageTitle();
  
  return (
    <Switch>
      {/* Public Routes */}
      {PUBLIC_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          {() => <PublicRouteWithLayout route={route} />}
        </Route>
      ))}
      
      {/* Protected Routes */}
      {PRIVATE_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          {() => <ProtectedRoute route={route} />}
        </Route>
      ))}
      
      {/* Payment Routes */}
      {PAYMENT_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          {() => <PublicRouteWithLayout route={route} />}
        </Route>
      ))}
      
      {/* Admin Routes */}
      {ADMIN_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          {() => <ProtectedRoute route={route} />}
        </Route>
      ))}
      
      {/* 404 Route */}
      <Route>
        {() => (
          <MainLayout>
            <NotFound />
          </MainLayout>
        )}
      </Route>
    </Switch>
  );
}