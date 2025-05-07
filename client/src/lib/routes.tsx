import React from "react";

// Pages
import AdminLoginPage from "@/pages/admin/admin-login-page"; // Import the new admin login page
import AdminDashboard from "@/pages/admin/dashboard";
import UploadTestPage from "@/pages/admin/upload-test-page";
import AgentsPage from "@/pages/agents-page";
import AiAgentChatPage from "@/pages/ai-agent-chat-page"; // Changed from AiBrowserPage
import AuthPage from "@/pages/auth-page";
import CreateAgentPage from "@/pages/create-agent-page";
import CredentialsPage from "@/pages/credentials-page";
import DashboardPage from "@/pages/dashboard-page";
import FilesPage from "@/pages/files-page";
import LandingPage from "@/pages/landing-page";
import PaymentFailedPage from "@/pages/payment-failed";
import PaymentSuccessPage from "@/pages/payment-success";
import SubscriptionPage from "@/pages/subscription-page";
import TaskHistoryPage from "@/pages/task-history-page";

// Admin Components
import AiModelsPanel from "@/components/admin/ai-models-panel";
import AiPromptsPanel from "@/components/admin/ai-prompts-panel";
import AiProvidersPanel from "@/components/admin/ai-providers-panel";
import ContentBuilder from "@/components/admin/content-builder";
import FineTuningPanel from "@/components/admin/fine-tuning-panel"; // Import the new panel
import { AgentToolsPanel } from "@/components/admin/fixed-agent-tools-panel";
import PlansPanel from "@/components/admin/plans-panel";
import SiteEditorPanel from "@/components/admin/site-editor-panel";
import TranslationsPanel from "@/components/admin/translations-panel";
import UsersPanel from "@/components/admin/users-panel";

// Demo pages - These can be removed in production
import LanguageDemoPage from "@/pages/language-demo-page";
import LoadersDemoPage from "@/pages/loaders-demo-page";

// Define route types
export type RouteConfig = {
  path: string;
  component: React.ComponentType<any>;
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
  {
    path: "/admin/login",
    component: AdminLoginPage,
    title: "Admin Login",
    isPublic: true,
    layout: "auth", // Or "none" if you want a completely custom layout
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
    path: "/agents/create",
    component: CreateAgentPage,
    title: "Create New Agent",
    layout: "main",
    exact: true,
  },
  {
    path: "/ai-agent-chat", // Changed from /ai-browser
    component: AiAgentChatPage, // Changed from AiBrowserPage
    title: "AI Agent Chat", // Changed from AI Browser
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
  {
    path: "/admin/content-builder",
    component: ContentBuilder,
    title: "AI Content Builder",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/users",
    component: UsersPanel,
    title: "Users Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/providers",
    component: AiProvidersPanel,
    title: "AI Providers Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/models",
    component: AiModelsPanel,
    title: "AI Models Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/prompts",
    component: AiPromptsPanel,
    title: "AI Prompts Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/plans",
    component: PlansPanel,
    title: "Subscription Plans Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/translations",
    component: TranslationsPanel,
    title: "Translations Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/site-editor",
    component: SiteEditorPanel,
    title: "Site Editor",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/upload-test",
    component: UploadTestPage,
    title: "File Upload Test",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/agent-tools",
    component: AgentToolsPanel,
    title: "Agent Tools Management",
    isAdmin: true,
    layout: "admin",
    exact: true,
  },
  {
    path: "/admin/fine-tuning",
    component: FineTuningPanel,
    title: "Fine-Tuning Settings",
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
