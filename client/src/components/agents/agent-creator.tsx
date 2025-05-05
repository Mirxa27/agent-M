import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Agent, AiModel } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  BrainCircuit,
  FileText,
  Settings,
  Sparkles,
  Timer
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth"; // Assuming an auth hook exists

// Define form schema for agent
const agentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["assistant", "researcher", "writer", "analyzer", "custom"]),
  icon: z.string().default("bot"),
  isActive: z.boolean().default(true),
  modelId: z.coerce.number(),
  promptId: z.coerce.number().optional(),
  config: z
    .object({
      maxTokens: z.coerce.number().default(1000),
      temperature: z.coerce.number().min(0).max(2).default(0.7),
      topP: z.coerce.number().min(0).max(1).default(1.0),
      frequencyPenalty: z.coerce.number().min(0).max(2).default(0),
      presencePenalty: z.coerce.number().min(0).max(2).default(0),
      autoRetry: z.boolean().default(true),
      maxRetries: z.coerce.number().default(3),
      useFiles: z.boolean().default(false),
      useCredentials: z.boolean().default(false),
      advancedMode: z.boolean().default(false),
      customSystemPrompt: z.string().optional(),
    })
    .optional(),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

export default function AgentCreator() {
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedType, setSelectedType] = useState<string>("assistant");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth(); // Get user info, including role
  const isAdmin = user?.role === 'admin'; // Check if user is admin

  const queryClient = useQueryClient();

  // Fetch AI models
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/models");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch AI models");
      }
      const fetchedModels = await res.json();
      // Filter only active models
      return fetchedModels.filter((model: AiModel) => model.isActive);
    },
  });

  // Find a default model ID for non-admin users
  const defaultModelIdForUser = models.length > 0 ? models[0].id : undefined;

  // Fetch AI prompts
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["/api/prompts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prompts");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch AI prompts");
      }
      return res.json();
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agent: AgentFormValues) => {
      const res = await apiRequest("POST", "/api/agents", agent);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create agent");
      }
      return res.json();
    },
    onSuccess: (data: Agent) => {
      toast({
        title: "Agent created",
        description: "Your agent has been successfully created!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      navigate(`/agents/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup form
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "assistant",
      icon: "bot",
      isActive: true,
      modelId: isAdmin ? undefined : defaultModelIdForUser, // Set default for non-admin
      config: {
        maxTokens: 1000,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        autoRetry: true,
        maxRetries: 3,
        useFiles: false,
        useCredentials: false,
        advancedMode: false,
        customSystemPrompt: "",
      },
    },
  });

  // Get filtered prompts that match the selected model and agent type
  const filteredPrompts = prompts.filter((prompt) => {
    const modelId = form.watch("modelId");
    const type = form.watch("type");

    if (!modelId) return false;

    return prompt.modelId === modelId && prompt.purpose === type;
  });

  // Get default prompt for selected type and model
  const defaultPrompt = filteredPrompts.find((prompt) => prompt.isDefault);

  // Reset prompt when model or type changes
  const resetPromptOnChange = (modelId: number, type: string) => {
    // Find default prompt for this model and type
    const matchingPrompts = prompts.filter(
      (p) => p.modelId === modelId && p.purpose === type,
    );
    const defaultPrompt = matchingPrompts.find((p) => p.isDefault);

    if (defaultPrompt) {
      form.setValue("promptId", defaultPrompt.id);
    } else if (matchingPrompts.length > 0) {
      form.setValue("promptId", matchingPrompts[0].id);
    } else {
      form.setValue("promptId", undefined);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle agent type selection
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("type", value as any);

    // Reset prompt based on new type
    resetPromptOnChange(form.getValues("modelId"), value);
  };

  // Handle advanced mode toggle
  const handleAdvancedModeToggle = (value: boolean) => {
    setAdvancedMode(value);
    form.setValue("config.advancedMode", value);
  };

  // Handle form submission
  const onSubmit = (values: AgentFormValues) => {
    // Ensure modelId is set correctly for non-admins selecting "Mirxa AI"
    if (!isAdmin && !values.modelId && defaultModelIdForUser) {
      values.modelId = defaultModelIdForUser;
    }
    createAgentMutation.mutate(values);
  };

  // Get agent icon component
  const getAgentIcon = (type: string) => {
    switch (type) {
      case "assistant":
        return <Bot className="h-5 w-5" />;
      case "researcher":
        return <Sparkles className="h-5 w-5" />;
      case "writer":
        return <FileText className="h-5 w-5" />;
      case "analyzer":
        return <BrainCircuit className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // Get temperature color
  const getTemperatureColor = (temp: number) => {
    if (temp < 0.3) return "bg-blue-500";
    if (temp < 0.7) return "bg-green-500";
    if (temp < 1.2) return "bg-yellow-500";
    if (temp < 1.7) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center">
          <div className="mr-2 p-2 rounded-full bg-primary/10">
            {getAgentIcon(selectedType)}
          </div>
          <div>
            <CardTitle>Create New Agent</CardTitle>
            <CardDescription>
              Configure your AI agent with the right capabilities for your needs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  <span>AI Configuration</span>
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Advanced Options</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My AI Assistant" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your agent a descriptive name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What will this agent help you with?"
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what tasks this agent will perform.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleTypeChange(value);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="assistant" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                <span>Assistant</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="researcher" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <span>Researcher</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="writer" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Writer</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="analyzer" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                <BrainCircuit className="h-4 w-4" />
                                <span>Analyzer</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="custom" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Custom</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Select a predefined type or create a custom agent.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="modelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const selectedModelId = value === 'mirxa-ai' ? defaultModelIdForUser : parseInt(value);
                            field.onChange(selectedModelId);
                            resetPromptOnChange(
                              selectedModelId,
                              form.getValues("type")
                            );
                          }}
                          // Use defaultModelIdForUser if non-admin and field value is undefined initially
                          value={isAdmin ? field.value?.toString() : (field.value ? 'mirxa-ai' : undefined)}
                          disabled={!isAdmin && !defaultModelIdForUser} // Disable if non-admin and no default model found
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isAdmin ? "Select an AI model" : "Mirxa AI"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingModels ? (
                              <div className="p-2 text-center">
                                Loading models...
                              </div>
                            ) : isAdmin ? (
                              models.map((model) => (
                                <SelectItem
                                  key={model.id}
                                  value={model.id.toString()}
                                >
                                  {model.name}
                                </SelectItem>
                              ))
                            ) : defaultModelIdForUser ? (
                              <SelectItem key="mirxa-ai" value="mirxa-ai">
                                Mirxa AI
                              </SelectItem>
                            ) : (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No AI model available.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isAdmin ? "Choose the AI model that powers this agent." : "Using the default configured AI model."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Prompt</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                          disabled={
                            (!isAdmin && !defaultModelIdForUser) || // Disable if non-admin and no model
                            !form.watch("modelId") ||
                            filteredPrompts.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  defaultPrompt
                                    ? `Default ${selectedType} prompt`
                                    : "Select a prompt"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPrompts ? (
                              <div className="p-2 text-center">
                                Loading prompts...
                              </div>
                            ) : (
                              filteredPrompts.map((prompt) => (
                                <SelectItem
                                  key={prompt.id}
                                  value={prompt.id.toString()}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{prompt.name}</span>
                                    {prompt.isDefault && (
                                      <Badge variant="secondary">Default</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                            {form.watch("modelId") &&
                              filteredPrompts.length === 0 && (
                                <div className="p-2 text-center text-sm text-muted-foreground">
                                  No prompts available for this model and agent
                                  type.
                                  <br />
                                  Use advanced mode to customize.
                                </div>
                              )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a predefined prompt or create a custom one in advanced mode.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label>Advanced Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable custom prompt and fine-tuned parameters
                      </p>
                    </div>
                    <Switch
                      checked={advancedMode}
                      onCheckedChange={handleAdvancedModeToggle}
                    />
                  </div>

                  {advancedMode && (
                    <>
                      <FormField
                        control={form.control}
                        name="config.customSystemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom System Prompt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="You are a helpful assistant that..."
                                className="font-mono text-sm resize-none min-h-[150px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Write a custom system prompt that defines your
                              agent's behavior.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="config.temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Temperature: {field.value.toFixed(1)}
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  className={`${getTemperatureColor(field.value)}`}
                                  value={[field.value]}
                                  onValueChange={(vals) =>
                                    field.onChange(vals[0])
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Higher values increase creativity (but may
                                reduce accuracy)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="config.topP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Top P: {field.value.toFixed(1)}
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  min={0.1}
                                  max={1}
                                  step={0.1}
                                  value={[field.value]}
                                  onValueChange={(vals) =>
                                    field.onChange(vals[0])
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Controls diversity via nucleus sampling
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="config.maxTokens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Tokens: {field.value}</FormLabel>
                              <FormControl>
                                <Slider
                                  min={100}
                                  max={4000}
                                  step={100}
                                  value={[field.value]}
                                  onValueChange={(vals) =>
                                    field.onChange(vals[0])
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum generated output length
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="config.frequencyPenalty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Frequency Penalty: {field.value.toFixed(1)}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={[field.value]}
                                    onValueChange={(vals) =>
                                      field.onChange(vals[0])
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="config.presencePenalty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Presence Penalty: {field.value.toFixed(1)}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    value={[field.value]}
                                    onValueChange={(vals) =>
                                      field.onChange(vals[0])
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="config.useFiles"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              File Access
                            </FormLabel>
                            <FormDescription>
                              Allow agent to read and use uploaded files
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="config.useCredentials"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Credential Access
                            </FormLabel>
                            <FormDescription>
                              Allow agent to use stored credentials
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="config.autoRetry"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Auto Retry
                            </FormLabel>
                            <FormDescription>
                              Automatically retry failed agent tasks
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="config.maxRetries"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-between rounded-lg border p-4 h-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Max Retries
                            </FormLabel>
                            <FormDescription>
                              Maximum number of automatic retry attempts
                            </FormDescription>
                          </div>
                          <div className="flex items-center mt-2">
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                disabled={!form.watch("config.autoRetry")}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Enable or disable this agent
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (activeTab === "basic") {
                    navigate("/agents");
                  } else if (activeTab === "ai") {
                    setActiveTab("basic");
                  } else {
                    setActiveTab("ai");
                  }
                }}
              >
                {activeTab === "basic" ? "Cancel" : "Back"}
              </Button>

              {activeTab !== "advanced" ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (activeTab === "basic") {
                      setActiveTab("ai");
                    } else {
                      setActiveTab("advanced");
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending && (
                    <Timer className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Agent
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
