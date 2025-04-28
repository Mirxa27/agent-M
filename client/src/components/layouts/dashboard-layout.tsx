import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-10 bg-light pt-0 md:pt-0 w-full">
        <MobileNav />
        
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-20 md:pt-6 w-full">
          <div className="mb-4 sm:mb-6 md:mb-8 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full min-w-0">
              <div className="min-w-0"> {/* Prevents text overflow */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-dark-900 truncate">{title}</h1>
                {subtitle && <p className="text-gray-500 mt-1 text-sm sm:text-base truncate">{subtitle}</p>}
              </div>
            </div>
          </div>
          
          <div className="w-full min-w-0 space-y-4 sm:space-y-5 md:space-y-6"> {/* Container to prevent overflow with adaptive spacing */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
