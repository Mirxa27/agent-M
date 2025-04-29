import { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { CircleDot } from "lucide-react";

export interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp: Date;
  icon?: ReactNode;
}

export const TimelineItem = ({
  title,
  description,
  timestamp,
  icon,
}: TimelineItemProps) => {
  return (
    <div className="flex mb-4 last:mb-0">
      <div className="mr-3 flex-shrink-0 text-muted-foreground">
        {icon || <CircleDot className="h-5 w-5" />}
      </div>
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

export interface TimelineListProps {
  children: ReactNode;
  className?: string;
}

export const TimelineList = ({ children, className = "" }: TimelineListProps) => {
  return <div className={`py-1 ${className}`}>{children}</div>;
};