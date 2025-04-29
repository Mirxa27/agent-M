import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingWidgetProps {
  title: string;
  icon?: ReactNode;
}

export const LoadingWidget = ({ title, icon }: LoadingWidgetProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>
            <div className="flex items-center">
              {icon && <span className="mr-2">{icon}</span>}
              <span>{title}</span>
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center items-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </CardContent>
    </Card>
  );
};