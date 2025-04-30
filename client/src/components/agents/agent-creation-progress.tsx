import React from "react";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Sparkles, 
  Brain, 
  Zap, 
  Settings, 
  Rocket 
} from "lucide-react";

// UI Components
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type CreationStage = 
  | "selecting" 
  | "configuring" 
  | "initializing" 
  | "connecting" 
  | "completed";

interface AgentCreationStage {
  id: CreationStage;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface AgentCreationProgressProps {
  currentStage: CreationStage;
  className?: string;
  isError?: boolean;
  errorMessage?: string;
}

const CREATION_STAGES: AgentCreationStage[] = [
  {
    id: "selecting",
    label: "Select Template",
    description: "Choose a specialized agent template",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "configuring",
    label: "Configure",
    description: "Customize agent settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "initializing",
    label: "Initialize",
    description: "Setting up agent resources",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    id: "connecting",
    label: "Connect Services",
    description: "Connecting to AI services",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "completed",
    label: "Ready",
    description: "Agent is ready to use",
    icon: <Rocket className="h-5 w-5" />,
  },
];

export const AgentCreationProgress: React.FC<AgentCreationProgressProps> = ({
  currentStage,
  className,
  isError = false,
  errorMessage,
}) => {
  // Calculate the current stage index and progress percentage
  const currentStageIndex = CREATION_STAGES.findIndex(
    (stage) => stage.id === currentStage
  );
  
  const progressPercentage = 
    currentStage === "completed" 
      ? 100 
      : Math.max(0, Math.min(100, ((currentStageIndex + 0.5) / CREATION_STAGES.length) * 100));

  return (
    <div className={cn("space-y-6", className)}>
      <Progress 
        value={progressPercentage} 
        className={cn(
          "h-2 w-full", 
          isError ? "bg-destructive/20" : "bg-secondary"
        )} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {CREATION_STAGES.map((stage, index) => {
          // Determine stage status
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex || currentStage === "completed";
          const isPending = index > currentStageIndex && currentStage !== "completed";
          
          return (
            <div 
              key={stage.id}
              className={cn(
                "flex flex-col items-center text-center p-3 rounded-lg transition-all",
                isActive && !isError && "bg-primary/10 text-primary",
                isCompleted && "text-primary",
                isPending && "text-muted-foreground",
                isError && isActive && "bg-destructive/10 text-destructive"
              )}
            >
              <div 
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full mb-2",
                  isActive && !isError && "bg-primary/20 text-primary",
                  isCompleted && "bg-primary/20 text-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isError && isActive && "bg-destructive/20 text-destructive"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isActive ? (
                  isError ? (
                    <Circle className="h-5 w-5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )
                ) : (
                  stage.icon
                )}
              </div>
              <h4 className="text-sm font-medium mb-1">{stage.label}</h4>
              <p className="text-xs opacity-70">{stage.description}</p>
            </div>
          );
        })}
      </div>
      
      {isError && errorMessage && (
        <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <p className="font-medium">Error during {CREATION_STAGES[currentStageIndex]?.label || "creation"}</p>
          <p className="text-xs mt-1 opacity-80">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default AgentCreationProgress;