import { ReactNode } from "react";
import { Widget } from "./widget-base";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface LoadingWidgetProps {
  title: string;
  icon: ReactNode;
  lines?: number;
}

export const LoadingWidget = ({ title, icon, lines = 3 }: LoadingWidgetProps) => {
  return (
    <Widget id="loading" title={title} icon={icon} movable={false}>
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {Array(lines)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
      </div>
    </Widget>
  );
};