import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, RefreshCw, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface WidgetProps {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export const Widget = ({
  id,
  title,
  description,
  icon,
  children,
  onRemove,
  onRefresh,
  className = "",
}: WidgetProps) => {
  return (
    <Card className={`border-none shadow-none overflow-hidden bg-transparent ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-shadow-sm">
            <div className="flex items-center">
              {icon && <span className="mr-2 text-primary text-shadow-sm">{icon}</span>}
              <span className="font-medium text-high-contrast">{title}</span>
            </div>
          </CardTitle>
          <div className="flex items-center">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="h-8 w-8 text-white/70 hover:text-primary hover:bg-white/10 hover:scale-110 transition-all duration-200"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-primary hover:bg-white/10 hover:scale-110 transition-all duration-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRefresh && (
                  <DropdownMenuItem onClick={onRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    {onRefresh && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Widget
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {description && <CardDescription className="text-white/80 text-shadow-sm font-medium">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};