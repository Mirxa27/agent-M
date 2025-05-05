import React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

// List of available icons from Lucide
const iconNames = Object.keys(Icons).filter(
  (key) => key !== "default" && key !== "createReactComponent"
);

interface AgentIconProps {
  icon?: string;
  className?: string;
  size?: number;
}

const AgentIcon: React.FC<AgentIconProps> = ({ 
  icon = "bot", 
  className = "",
  size = 24
}) => {
  // Ensure icon name is PascalCase for Lucide compatibility
  const formattedIconName = icon
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  // Default to Bot icon
  let IconComponent = Bot;

  // Try to find matching icon from Lucide
  if (iconNames.includes(formattedIconName)) {
    IconComponent = (Icons as any)[formattedIconName];
  }

  return <IconComponent className={cn("", className)} size={size} />;
};

export default AgentIcon;