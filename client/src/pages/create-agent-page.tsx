import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AgentIcon from "@/components/agents/agent-icon";
import AgentCreationProgress, { CreationStage } from "@/components/agents/agent-creation-progress";

// Type for Agent Template
interface AgentTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  isActive: boolean;
  isTemplate: boolean;
  config: {
    provider: string;
    models: string[];
    capabilities: string[];
    instructions?: string;
  };
  tools: number[];
}

export default function CreateAgentPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStage, setCreationStage] = useState<CreationStage>("selecting");
  const [creationError, setCreationError] = useState<string | null>(null);

  // Fetch agent templates
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/agent-templates"],
    queryFn: async () => {
      const res = await fetch("/api/agent-templates");
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch agent templates: ${errorText}`);
      }
      return res.json() as Promise<AgentTemplate[]>;
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (template: AgentTemplate) => {
      // Create a copy of the template without the id and isTemplate fields
      const { id, isTemplate, ...templateData } = template;
      // Customize the name to avoid duplication
      const agentData = {
        ...templateData,
        name: `${templateData.name} (${new Date().toLocaleDateString()})`,
      };

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create agent");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent created successfully",
        description: "Your new agent has been created from the template.",
      });
      // Complete the flow and then navigate
      setTimeout(() => {
        navigate(`/agents/${data.id}`);
      }, 1000);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Failed to create agent",
        description: errorMessage,
        variant: "destructive",
      });
      setCreationError(errorMessage);
      setCreationStage("connecting"); // Keep stage at connecting to show where it failed
      setIsCreating(false);
    },
  });

  // Handle template selection
  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
  };

  // Effect to simulate the agent creation stages
  useEffect(() => {
    if (!isCreating) return;
    
    const simulateCreationProcess = async () => {
      try {
        // Simulate the configuring stage
        setCreationStage("configuring");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate the initializing stage
        setCreationStage("initializing");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate connecting to AI services
        setCreationStage("connecting");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Actual API call to create the agent
        if (selectedTemplate) {
          createAgentMutation.mutate(selectedTemplate);
        }
        
        // Final completion stage
        setCreationStage("completed");
      } catch (error) {
        // Handle any errors during the simulation
        setCreationError(error instanceof Error ? error.message : "An error occurred during agent creation");
        setIsCreating(false);
      }
    };
    
    simulateCreationProcess();
  }, [isCreating, selectedTemplate]);

  // Handle creating an agent from the selected template
  const handleCreateAgent = () => {
    if (!selectedTemplate) return;
    
    setCreationError(null);
    setIsCreating(true);
    // The staging process will now be handled by the effect
  };

  // Group templates by type
  const groupedTemplates = templates?.reduce((acc, template) => {
    const type = template.type || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, AgentTemplate[]>) || {};

  // Prepare tab keys (template types)
  const tabKeys = Object.keys(groupedTemplates);

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/agents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Create New Agent</h1>
          <p className="text-muted-foreground">
            Choose a template to quickly create an agent for your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/agents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load agent templates"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If no templates, show message
  if (!templates || templates.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/agents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Templates Available</AlertTitle>
          <AlertDescription>
            There are no agent templates available. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/agents")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-2">Create New Agent</h1>
        <p className="text-muted-foreground">
          Choose a template to quickly create an agent for your needs.
        </p>
      </div>

      {tabKeys.length > 0 ? (
        <Tabs defaultValue={tabKeys[0]} className="space-y-4">
          <TabsList>
            {tabKeys.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type.replace(/[-_]/g, " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabKeys.map((type) => (
            <TabsContent key={type} value={type} className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTemplates[type].map((template) => (
                  <Card
                    key={template.id}
                    className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <AgentIcon icon={template.icon} className="h-5 w-5" />
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.config?.capabilities?.slice(0, 3).map((capability, i) => (
                          <Badge key={i} variant="secondary" className="text-xs capitalize">
                            {capability}
                          </Badge>
                        ))}
                        {template.config?.capabilities?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.config.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Provider:</span>{" "}
                        {template.config?.provider || "Unknown"}
                        {template.config?.models && (
                          <>
                            <span className="font-medium ml-2">Model:</span>{" "}
                            {template.config.models[0] || "Default"}
                          </>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Templates Available</AlertTitle>
          <AlertDescription>
            There are no agent templates available. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}

      {isCreating ? (
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-medium">Creating Your Agent</h3>
          <AgentCreationProgress 
            currentStage={creationStage}
            isError={!!creationError}
            errorMessage={creationError || undefined}
          />
          
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              disabled={creationStage !== "completed" && !creationError}
              onClick={() => navigate("/agents")}
            >
              {creationStage === "completed" ? "View All Agents" : "Cancel"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleCreateAgent}
            disabled={!selectedTemplate || isCreating}
            className="w-full md:w-auto"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Create Agent from Template
          </Button>
        </div>
      )}
    </div>
  );
}