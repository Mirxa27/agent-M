import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
  Move,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WidgetProps {
  id: string;
  title: string;
  description?: string;
  icon: ReactNode;
  onRemove?: () => void;
  onRefresh?: () => void;
  movable?: boolean;
  children: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export const Widget = ({
  id,
  title,
  description,
  icon,
  onRemove,
  onRefresh,
  movable = true,
  children,
  className = "",
  defaultExpanded = true,
}: WidgetProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card id={`widget-${id}`} className={`${className} shadow-sm`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {movable && (
            <Button variant="ghost" size="icon" className="cursor-move handle">
              <Move className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Widget menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExpanded(!expanded)}>
                {expanded ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Expand
                  </>
                )}
              </DropdownMenuItem>
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              )}
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-red-500">
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
};