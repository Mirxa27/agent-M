import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  ArrowLeft,
  Home,
  Bot,
  Key,
  FileText,
  Clock1,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  customLayout?: boolean;
}

export function Header({ customLayout = false }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect scroll to change header styling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="w-4 h-4 mr-2" />,
    },
    {
      href: "/agents",
      label: "Agents",
      icon: <Bot className="w-4 h-4 mr-2" />,
    },
    {
      href: "/ai-browser",
      label: "AI Browser",
      icon: <Globe className="w-4 h-4 mr-2" />,
    },
    {
      href: "/credentials",
      label: "Credentials",
      icon: <Key className="w-4 h-4 mr-2" />,
    },
    {
      href: "/files",
      label: "Files",
      icon: <FileText className="w-4 h-4 mr-2" />,
    },
    {
      href: "/task-history",
      label: "Tasks",
      icon: <Clock1 className="w-4 h-4 mr-2" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "";
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || "";
  };

  // Check if current page is the AI Browser page
  const isAiBrowserPage = location === "/ai-browser";
  
  // Determine if we should show a simplified header for custom layouts
  const showSimplifiedHeader = customLayout && isAiBrowserPage;
  
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 w-full transition-all duration-200 glass-container bg-opacity-60 backdrop-blur-md",
          scrolled
            ? "shadow-glow"
            : "border-b border-white/10",
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo or Back Button */}
          {isAiBrowserPage ? (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/dashboard")}
                className="flex items-center space-x-2 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <div
                onClick={() => (window.location.href = user ? "/dashboard" : "/")}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <AnimatedLogo size="sm" />
                <span className="font-heading text-lg font-bold hidden md:block text-primary">
                  {t("app.name")}
                </span>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {user && !isAiBrowserPage && (
            <div className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <div
                        onClick={() => (window.location.href = item.href)}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "cursor-pointer",
                          location === item.href
                            ? "bg-primary/10 text-primary"
                            : "",
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </div>
                    </NavigationMenuItem>
                  ))}

                  {user && user.role === "admin" && (
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] p-2 gap-2">
                          <li>
                            <div
                              onClick={() =>
                                (window.location.href = "/admin/dashboard")
                              }
                              className={cn(
                                "flex items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
                                location === "/admin/dashboard"
                                  ? "bg-primary/10 text-primary"
                                  : "",
                              )}
                            >
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                <span>Dashboard</span>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* Right Section (User Actions, Language) */}
          {!isAiBrowserPage && (
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />

              {!user ? (
                <Button
                  size="sm"
                  className="hidden md:flex btn-glass btn-glass-primary shadow-glow bg-opacity-50 text-white/90 text-shadow-sm"
                  onClick={() => (window.location.href = "/auth")}
                >
                  {t("auth.login")}
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user ? getUserInitials() : ""}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user?.fullName || user?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/dashboard")}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Home className="mr-2 h-4 w-4" />
                        <span>{t("nav.dashboard")}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/agents")}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Bot className="mr-2 h-4 w-4" />
                        <span>{t("nav.agents")}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/ai-browser")}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Globe className="mr-2 h-4 w-4" />
                        <span>AI Browser</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/subscription")}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t("nav.subscription")}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Button */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-64 h-full bg-white dark:bg-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Nav Items */}
            <div className="p-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <div
                    key={item.href}
                    onClick={() => {
                      window.location.href = item.href;
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    {React.cloneElement(item.icon, {
                      className: "h-5 w-5 mr-3",
                    })}
                    {item.label}
                  </div>
                ))}

                {user && user.role === "admin" && (
                  <>
                    <div className="pt-4 pb-2">
                      <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        window.location.href = "/admin/dashboard";
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                        location === "/admin/dashboard"
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      )}
                    >
                      <User className="h-5 w-5 mr-3" />
                      Dashboard
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
