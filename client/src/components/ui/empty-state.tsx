import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass-effect-lighter rounded-lg border border-white/20 shadow-xl card-hover relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg pointer-events-none"></div>
      {icon && <div className="text-white/90 mb-4 text-shadow-sm">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2 text-high-contrast text-shadow-md">{title}</h3>
      {description && (
        <p className="text-sm text-white/80 mb-4 max-w-md text-shadow-sm">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button onClick={onAction} className="shadow-glow hover:scale-105 transition-transform duration-300">{actionText}</Button>
      )}
    </div>
  );
}