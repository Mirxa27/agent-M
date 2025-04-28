import React, { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Header } from "@/components/navigation/header";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2,
  Users,
  Bot,
  Settings,
  Database,
  PanelLeft,
  Tag,
  Languages,
  Palette,
  Menu,
  X,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access this area.
        </p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const adminNavItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <PanelLeft className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: <Users className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/providers",
      label: "AI Providers",
      icon: <Database className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/models",
      label: "AI Models",
      icon: <Bot className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/prompts",
      label: "AI Prompts",
      icon: <Tag className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/agent-tools",
      label: "Agent Tools",
      icon: <Wrench className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/content-builder",
      label: "Content Builder",
      icon: <Sparkles className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/plans",
      label: "Plans",
      icon: <Settings className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/translations",
      label: "Translations",
      icon: <Languages className="w-5 h-5 mr-3" />,
    },
    {
      href: "/admin/site-editor",
      label: "Site Editor",
      icon: <Palette className="w-5 h-5 mr-3" />,
    },
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
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md group transition-colors cursor-pointer",
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            asChild
            className="md:hidden absolute top-5 left-6 z-10"
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Admin Panel</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="py-4">
              <nav className="grid gap-1 px-2">
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md group transition-colors cursor-pointer",
                        location === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-5 md:mb-6 lg:mb-8">
              <div className="min-w-0">
                {" "}
                {/* Prevent text overflow */}
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Show this button only on mobile */}
              <div className="mt-3 md:mt-0 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </div>
            </div>

            <div className="w-full min-w-0 space-y-4 sm:space-y-5 md:space-y-6">
              {" "}
              {/* Container to prevent overflow with adaptive spacing */}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
