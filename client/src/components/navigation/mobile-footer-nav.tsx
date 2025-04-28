import React from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Home, Bot, Key, FileText, Clock1 } from "lucide-react";

export function MobileFooterNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    {
      href: "/dashboard",
      label: t("nav.dashboard"),
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/agents",
      label: t("nav.agents"),
      icon: <Bot className="h-5 w-5" />,
    },
    {
      href: "/credentials",
      label: t("nav.credentials"),
      icon: <Key className="h-5 w-5" />,
    },
    {
      href: "/files",
      label: t("nav.files"),
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/task-history",
      label: t("nav.tasks"),
      icon: <Clock1 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 h-16">
      <nav className="grid h-full grid-cols-5">
        {navItems.map((item) => (
          <div
            key={item.href}
            onClick={() => (window.location.href = item.href)}
            className={cn(
              "flex flex-col items-center justify-center h-full cursor-pointer",
              location === item.href
                ? "text-primary"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300",
            )}
          >
            <div className="flex items-center justify-center">{item.icon}</div>
            <span className="text-xs mt-1">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
