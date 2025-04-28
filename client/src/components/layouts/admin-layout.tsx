import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Header } from "@/components/navigation/header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, Bot, Settings, Database, PanelLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
        <Button asChild>
          <Link href="/dashboard">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <PanelLeft className="w-5 h-5 mr-3" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="w-5 h-5 mr-3" /> },
    { href: "/admin/providers", label: "AI Providers", icon: <Database className="w-5 h-5 mr-3" /> },
    { href: "/admin/models", label: "AI Models", icon: <Bot className="w-5 h-5 mr-3" /> },
    { href: "/admin/prompts", label: "AI Prompts", icon: <Tag className="w-5 h-5 mr-3" /> },
    { href: "/admin/plans", label: "Plans", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-1">
            <div className="py-2 px-3 text-sm font-semibold text-gray-500 uppercase">
              Admin Panel
            </div>
            {adminNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md group transition-colors",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}