import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Bot,
  Key,
  FileText,
  Clock1,
  User,
  CreditCard,
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="w-5 h-5 mr-3" /> },
    { href: "/agents", label: "My Agents", icon: <Bot className="w-5 h-5 mr-3" /> },
    { href: "/credentials", label: "Credentials", icon: <Key className="w-5 h-5 mr-3" /> },
    { href: "/files", label: "Files & Templates", icon: <FileText className="w-5 h-5 mr-3" /> },
    { href: "/tasks", label: "Task History", icon: <Clock1 className="w-5 h-5 mr-3" /> }
  ];

  const settingsItems = [
    { href: "/account", label: "Account", icon: <User className="w-5 h-5 mr-3" /> },
    { href: "/billing", label: "Billing", icon: <CreditCard className="w-5 h-5 mr-3" /> },
    { href: "/preferences", label: "Preferences", icon: <Settings className="w-5 h-5 mr-3" /> }
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-heading font-semibold text-dark-900">Mirxa.io</h1>
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.username?.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-500">{user?.plan === 'free' ? 'Free Plan' : `${user?.plan} Plan`}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <div
              key={item.href}
              onClick={() => window.location.href = item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md group cursor-pointer",
                location === item.href
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Settings
          </h3>
          <div className="mt-2 space-y-1">
            {settingsItems.map((item) => (
              <div
                key={item.href}
                onClick={() => window.location.href = item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md group cursor-pointer",
                  location === item.href
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <LogOut className="w-5 h-5 mr-2" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
