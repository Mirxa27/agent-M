import React from "react";
import { Route, Switch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import DashboardPage from "@/pages/dashboard-page";
import AgentsPage from "@/pages/agents-page";
import CredentialsPage from "@/pages/credentials-page";
import FilesPage from "@/pages/files-page";
import TaskHistoryPage from "@/pages/task-history-page";
import SubscriptionPage from "@/pages/subscription-page";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentFailedPage from "@/pages/payment-failed";
import AdminDashboard from "@/pages/admin/dashboard";

// Demo pages - These can be removed in production
import LoadersDemoPage from "@/pages/loaders-demo-page";
import LanguageDemoPage from "@/pages/language-demo-page";

// Define route types
export type RouteConfig = {
  path: string;
  component: React.ComponentType;
  title: string;
  isPublic?: boolean;
  isAdmin?: boolean;
  layout?: "main" | "admin" | "auth" | "none";
  exact?: boolean;
};

// Public routes accessible by anyone
export const PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: "/",
    component: LandingPage,
    title: "Welcome",
    isPublic: true,
    layout: "main",
    exact: true,
  },
  {
    path: "/auth",
    component: AuthPage,
    title: "Login or Register",
    isPublic: true,
    layout: "auth",
    exact: true,
  },
  {
    path: "/language-demo",
    component: LanguageDemoPage,
    title: "Language Demo",
    isPublic: true,
    layout: "main",
    exact: true,
  },
];

// Private routes that require authentication
export const PRIVATE_ROUTES: RouteConfig[] = [
  {
    path: "/dashboard",
    component: DashboardPage,
    title: "Dashboard",
    layout: "main",
    exact: true,
  },
  {
    path: "/agents",
    component: AgentsPage,
    title: "My Agents",
    layout: "main",
    exact: true,
  },
  {
    path: "/credentials",
    component: CredentialsPage,
    title: "Credentials",
    layout: "main",
    exact: true,
  },
  {
    path: "/files",
    component: FilesPage,
    title: "Files & Templates",
    layout: "main",
    exact: true,
  },
  {
    path: "/task-history",
    component: TaskHistoryPage,
    title: "Task History",
    layout: "main",
    exact: true,
  },
  {
    path: "/subscription",
    component: SubscriptionPage,
    title: "Subscription",
    layout: "main",
    exact: true,
  },
  {
    path: "/loaders-demo",
    component: LoadersDemoPage,
    title: "Loaders Demo",
    layout: "main",
    exact: true,
  },
];

// Payment routes
export const PAYMENT_ROUTES: RouteConfig[] = [
  {
    path: "/payment-success",
    component: PaymentSuccessPage,
    title: "Payment Successful",
    layout: "main",
    exact: true,
  },
  {
    path: "/payment-failed",
    component: PaymentFailedPage,
    title: "Payment Failed",
    layout: "main",
    exact: true,
  },
];

// Admin routes
export const ADMIN_ROUTES: RouteConfig[] = [
  {
    path: "/admin",
    component: AdminDashboard,
    title: "Admin Dashboard",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/dashboard",
    component: AdminDashboard,
    title: "Admin Dashboard",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
];

// All routes combined
export const ALL_ROUTES = [
  ...PUBLIC_ROUTES,
  ...PRIVATE_ROUTES,
  ...PAYMENT_ROUTES,
  ...ADMIN_ROUTES,
];

// Route guards
export function ProtectedRoute({ route }: { route: RouteConfig }) {
  const { user, isLoading } = useAuth();
  const Component = route.component;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  // Admin route but user is not admin
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

  return <Component />;
}

// Router component with route definitions
export function AppRouter() {
  return (
    <Switch>
      {/* Public Routes */}
      {PUBLIC_ROUTES.map((route) => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}

      {/* Protected Routes */}
      {PRIVATE_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          <ProtectedRoute route={route} />
        </Route>
      ))}

      {/* Payment Routes */}
      {PAYMENT_ROUTES.map((route) => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}

      {/* Admin Routes */}
      {ADMIN_ROUTES.map((route) => (
        <Route key={route.path} path={route.path}>
          <ProtectedRoute route={route} />
        </Route>
      ))}

      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}