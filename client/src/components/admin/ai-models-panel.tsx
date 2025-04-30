import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { AiModel, AiProvider } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  TagIcon,
  CloudIcon,
  ServerIcon,
  CheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define form schema for creating/updating models
const modelFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  providerId: z.coerce.number({ required_error: "Provider is required" }),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional().nullable(),
  contextLength: z.coerce.number().min(1, "Context length must be at least 1"),
  maxOutputTokens: z.coerce
    .number()
    .min(1, "Max output tokens must be at least 1"),
  isActive: z.boolean().default(true),
  capabilities: z.array(z.string()).optional(),
  pricePer1000Tokens: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().default("SAR"),
  isChatModel: z.boolean().default(true),
  isVisionModel: z.boolean().default(false),
  isEmbeddingModel: z.boolean().default(false),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

const defaultCapabilities = [
  "text-generation",
  "chat",
  "vision",
  "embeddings",
  "function-calling",
  "image-generation",
  "audio-transcription",
  "text-to-speech",
  "fine-tuning",
];

export default function AiModelsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(
    new Set(),
  );
  
  // OpenRouter support
  const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
  const [openRouterGroupedModels, setOpenRouterGroupedModels] = useState<Record<string, string[]>>({});
  const [openRouterModelCapabilities, setOpenRouterModelCapabilities] = useState<any[]>([]);
  const [isOpenRouterProvider, setIsOpenRouterProvider] = useState(false);
  const [selectedOpenRouterProvider, setSelectedOpenRouterProvider] = useState<string>("");
  
  const queryClient = useQueryClient();

  // Fetch all AI models
  const {
    data: models = [],
    isLoading: isLoadingModels,
    error: modelsError,
  } = useQuery({
    queryKey: ["/api/admin/ai-models"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/admin/ai-models");
    },
  });

  // Fetch all AI providers for the dropdown
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ["/api/admin/ai-providers"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/admin/ai-providers");
    },
  });
  
  // Fetch OpenRouter models (only if needed)
  const { data: openRouterData, isLoading: isLoadingOpenRouter, error: openRouterError } = useQuery({
    queryKey: ["/api/admin/openrouter/models"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/admin/openrouter/models");
    },
    enabled: isOpenRouterProvider, // Only fetch when OpenRouter provider is selected
    retry: 1, // Limit retries as this could fail if API key is not configured
  });
  
  // Update OpenRouter state when data is fetched
  useEffect(() => {
    if (openRouterData) {
      setOpenRouterModels(openRouterData.models || []);
      setOpenRouterGroupedModels(openRouterData.groupedModels || {});
      setOpenRouterModelCapabilities(openRouterData.modelCapabilities || []);
    }
  }, [openRouterData]);
  
  // Check if a provider is OpenRouter when provider changes
  const handleProviderChange = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    const isOpenRouter = provider?.name.toLowerCase().includes('openrouter');
    setIsOpenRouterProvider(!!isOpenRouter);
    
    // Reset OpenRouter state
    setSelectedOpenRouterProvider("");
    
    // Set form providerId
    form.setValue('providerId', providerId);
  };

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: async (model: ModelFormValues) => {
      return await apiRequest("POST", "/api/admin/ai-models", model);
    },
    onSuccess: () => {
      toast({
        title: "Model created",
        description: "The AI model has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error creating model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: async ({
      id,
      model,
    }: {
      id: number;
      model: ModelFormValues;
    }) => {
      return await apiRequest("PATCH", `/api/admin/ai-models/${id}`, model);
    },
    onSuccess: () => {
      toast({
        title: "Model updated",
        description: "The AI model has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/ai-models/${id}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Model deleted",
        description: "The AI model has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create form
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: "",
      providerId: undefined,
      modelId: "",
      description: "",
      contextLength: 4096,
      maxOutputTokens: 1024,
      isActive: true,
      capabilities: [],
      pricePer1000Tokens: 0,
      currency: "SAR",
      isChatModel: true,
      isVisionModel: false,
      isEmbeddingModel: false,
    },
  });

  // Edit form
  const editForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: "",
      providerId: undefined,
      modelId: "",
      description: "",
      contextLength: 4096,
      maxOutputTokens: 1024,
      isActive: true,
      capabilities: [],
      pricePer1000Tokens: 0,
      currency: "SAR",
      isChatModel: true,
      isVisionModel: false,
      isEmbeddingModel: false,
    },
  });

  // Reset form to default values
  const resetForm = () => {
    form.reset({
      name: "",
      providerId: undefined,
      modelId: "",
      description: "",
      contextLength: 4096,
      maxOutputTokens: 1024,
      isActive: true,
      capabilities: [],
      pricePer1000Tokens: 0,
      currency: "SAR",
      isChatModel: true,
      isVisionModel: false,
      isEmbeddingModel: false,
    });
    setSelectedCapabilities(new Set());
  };

  // Handle create submission
  const onCreateSubmit = (values: ModelFormValues) => {
    const modelData = {
      ...values,
      contextWindow: values.contextLength || null,
      costInputPerK: values.pricePer1000Tokens?.toString() || null,
      costOutputPerK: values.pricePer1000Tokens?.toString() || null,
      capabilities: Array.from(selectedCapabilities),
    };
    createModelMutation.mutate(modelData);
  };

  // Handle edit submission
  const onEditSubmit = (values: ModelFormValues) => {
    if (selectedModel) {
      const modelData = {
        ...values,
        contextWindow: values.contextLength || null,
        costInputPerK: values.pricePer1000Tokens?.toString() || null,
        costOutputPerK: values.pricePer1000Tokens?.toString() || null,
        capabilities: Array.from(selectedCapabilities),
      };
      updateModelMutation.mutate({
        id: selectedModel.id,
        model: modelData,
      });
    }
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedModel) {
      deleteModelMutation.mutate(selectedModel.id);
    }
  };

  // Handle opening edit dialog
  const handleEdit = (model: AiModel) => {
    setSelectedModel(model);
    setSelectedCapabilities(new Set(model.capabilities as string[]));

    // Map DB fields to form fields
    const costInput = model.costInputPerK ? parseFloat(model.costInputPerK) : 0;

    editForm.reset({
      name: model.name,
      providerId: model.providerId,
      modelId: model.modelId,
      description: model.description || "",
      contextLength: model.contextWindow || undefined,
      maxOutputTokens: model.maxOutputTokens,
      isActive: model.isActive,
      capabilities: model.capabilities as string[],
      pricePer1000Tokens: costInput,
      currency: "SAR", // Default to SAR if not provided
      // These are stored in capabilities but we expose them as separate fields for UX
      isChatModel: ((model.capabilities as string[]) || []).includes("chat"),
      isVisionModel: ((model.capabilities as string[]) || []).includes(
        "vision",
      ),
      isEmbeddingModel: ((model.capabilities as string[]) || []).includes(
        "embeddings",
      ),
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDelete = (model: AiModel) => {
    setSelectedModel(model);
    setIsDeleteDialogOpen(true);
  };

  // Handle capability toggle
  const toggleCapability = (capability: string) => {
    const newSelectedCapabilities = new Set(selectedCapabilities);
    if (newSelectedCapabilities.has(capability)) {
      newSelectedCapabilities.delete(capability);
    } else {
      newSelectedCapabilities.add(capability);
    }
    setSelectedCapabilities(newSelectedCapabilities);
  };

  // Filter models by search query
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description &&
        model.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Get provider name by ID
  const getProviderName = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider ? provider.name : "Unknown";
  };

  if (modelsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">AI Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Error loading AI models:{" "}
            {modelsError instanceof Error
              ? modelsError.message
              : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">AI Models</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search models..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Model
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingModels ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model ID</TableHead>
                    <TableHead>Context Length</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-6 text-muted-foreground"
                      >
                        {searchQuery
                          ? "No models match your search"
                          : "No AI models found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">
                          {model.name}
                        </TableCell>
                        <TableCell>
                          {getProviderName(model.providerId)}
                        </TableCell>
                        <TableCell>
                          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                            {model.modelId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {model.contextWindow
                            ? model.contextWindow.toLocaleString()
                            : "N/A"}{" "}
                          tokens
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {model.capabilities &&
                              (model.capabilities as string[])
                                .slice(0, 3)
                                .map((capability, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {capability.replace("-", " ")}
                                  </Badge>
                                ))}
                            {model.capabilities &&
                              (model.capabilities as string[]).length > 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline">
                                        +
                                        {(model.capabilities as string[])
                                          .length - 3}{" "}
                                        more
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {(model.capabilities as string[])
                                          .slice(3)
                                          .map((capability, index) => (
                                            <div
                                              key={index}
                                              className="capitalize"
                                            >
                                              {capability.replace("-", " ")}
                                            </div>
                                          ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {model.costInputPerK || "N/A"}{" "}
                          {model.currency || "SAR"}/1K tokens
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={model.isActive ? "success" : "outline"}
                          >
                            {model.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(model)}
                          >
                            <EditIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(model)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Model Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Add New AI Model</DialogTitle>
            <DialogDescription>
              Configure a new AI model to use with your agents.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GPT-4" {...field} />
                      </FormControl>
                      <FormDescription>
                        The human-readable name shown in the UI
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Provider</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const providerId = parseInt(value);
                          field.onChange(providerId);
                          handleProviderChange(providerId);
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProviders ? (
                            <div className="flex items-center justify-center p-2">
                              <Skeleton className="h-5 w-full" />
                            </div>
                          ) : (
                            providers.map((provider) => (
                              <SelectItem
                                key={provider.id}
                                value={provider.id.toString()}
                                disabled={!provider.isActive}
                              >
                                {provider.name}
                                {provider.name.toLowerCase().includes('openrouter') && (
                                  <CloudIcon className="inline-block ml-2 h-4 w-4 text-blue-400" />
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {isOpenRouterProvider && (
                          <span className="text-blue-500 flex items-center mt-1">
                            <CloudIcon className="mr-1 h-4 w-4" /> OpenRouter gives access to multiple AI models
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model ID</FormLabel>
                      {isOpenRouterProvider ? (
                        <div>
                          {isLoadingOpenRouter ? (
                            <Skeleton className="h-10 w-full" />
                          ) : openRouterError ? (
                            <div className="text-destructive text-sm mb-2">
                              Error loading OpenRouter models. Please check your API key.
                            </div>
                          ) : (
                            <>
                              {/* OpenRouter Provider Selection for grouped models */}
                              {Object.keys(openRouterGroupedModels || {}).length > 0 && (
                                <div className="mb-2">
                                  <Select
                                    onValueChange={(value) => {
                                      setSelectedOpenRouterProvider(value);
                                    }}
                                    value={selectedOpenRouterProvider}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-muted/20">
                                        <SelectValue placeholder="Select a provider" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.keys(openRouterGroupedModels).map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                          <div className="flex items-center">
                                            <ServerIcon className="mr-2 h-4 w-4 text-blue-500" />
                                            {provider}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              {/* OpenRouter Model Selection */}
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  
                                  // Automatically update capabilities based on model
                                  const modelCaps = openRouterModelCapabilities.find(m => m.id === value)?.capabilities || [];
                                  
                                  if (modelCaps.length > 0) {
                                    const newCaps = new Set(selectedCapabilities);
                                    // Add vision capability if it has it
                                    if (modelCaps.includes('vision')) {
                                      newCaps.add('vision');
                                      form.setValue('isVisionModel', true);
                                    } else {
                                      newCaps.delete('vision');
                                      form.setValue('isVisionModel', false);
                                    }
                                    
                                    // Always add chat for OpenRouter models
                                    newCaps.add('chat');
                                    form.setValue('isChatModel', true);
                                    
                                    setSelectedCapabilities(newCaps);
                                  }
                                  
                                  // Set model name from OpenRouter if not set
                                  const modelInfo = openRouterModels.find(m => m.id === value);
                                  if (modelInfo && !form.getValues('name')) {
                                    const displayName = modelInfo.name || modelInfo.id.split('/').pop();
                                    form.setValue('name', displayName);
                                  }
                                  
                                  // Set context length if available
                                  const contextInfo = openRouterModels.find(m => m.id === value)?.context_length;
                                  if (contextInfo) {
                                    form.setValue('contextLength', contextInfo);
                                  }
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedOpenRouterProvider ? (
                                    // Grouped models by selected provider
                                    (openRouterGroupedModels[selectedOpenRouterProvider] || []).map((modelId) => {
                                      const model = openRouterModels.find(m => m.id === modelId);
                                      return (
                                        <SelectItem key={modelId} value={modelId}>
                                          <div className="flex items-center">
                                            {model?.name || modelId.split('/').pop()}
                                            {model?.capabilities?.includes('vision') && (
                                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Vision</span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      );
                                    })
                                  ) : (
                                    // All models
                                    openRouterModels.map((model) => (
                                      <SelectItem key={model.id} value={model.id}>
                                        <div className="flex items-center">
                                          {model.name || model.id.split('/').pop()}
                                          {model.capabilities?.includes('vision') && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Vision</span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </>
                          )}
                        </div>
                      ) : (
                        <FormControl>
                          <Input placeholder="e.g., gpt-4o" {...field} />
                        </FormControl>
                      )}
                      <FormDescription>
                        {isOpenRouterProvider 
                          ? "Select a model from OpenRouter's collection of AI models" 
                          : "The internal identifier used by the provider"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contextLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context Length (tokens)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4096"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of the AI model"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxOutputTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Output Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1024"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <FormField
                    control={form.control}
                    name="pricePer1000Tokens"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Price per 1K Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            step="0.001"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="SAR" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAR">SAR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capabilities selection */}
              <div>
                <FormLabel>Capabilities</FormLabel>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {defaultCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className={`flex items-center p-2 rounded border cursor-pointer ${
                        selectedCapabilities.has(capability)
                          ? "border-primary bg-primary/10"
                          : "border-input"
                      }`}
                      onClick={() => toggleCapability(capability)}
                    >
                      <TagIcon
                        className={`h-4 w-4 mr-2 ${
                          selectedCapabilities.has(capability)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="capitalize">
                        {capability.replace("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
                <FormDescription className="mt-2">
                  Select all capabilities applicable to this model
                </FormDescription>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isChatModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Chat Model</FormLabel>
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
                  name="isVisionModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Vision Model
                        </FormLabel>
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
                  name="isEmbeddingModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Embedding Model
                        </FormLabel>
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this AI model
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createModelMutation.isPending}>
                  {createModelMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Create Model
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Model Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Edit AI Model</DialogTitle>
            <DialogDescription>
              Update the configuration for this AI model.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GPT-4" {...field} />
                      </FormControl>
                      <FormDescription>
                        The human-readable name shown in the UI
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Provider</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProviders ? (
                            <div className="flex items-center justify-center p-2">
                              <Skeleton className="h-5 w-full" />
                            </div>
                          ) : (
                            providers.map((provider) => (
                              <SelectItem
                                key={provider.id}
                                value={provider.id.toString()}
                                disabled={!provider.isActive}
                              >
                                {provider.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gpt-4o" {...field} />
                      </FormControl>
                      <FormDescription>
                        The internal identifier used by the provider
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="contextLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context Length (tokens)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4096"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of the AI model"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="maxOutputTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Output Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1024"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <FormField
                    control={editForm.control}
                    name="pricePer1000Tokens"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Price per 1K Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            step="0.001"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="SAR" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAR">SAR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capabilities selection */}
              <div>
                <FormLabel>Capabilities</FormLabel>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {defaultCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className={`flex items-center p-2 rounded border cursor-pointer ${
                        selectedCapabilities.has(capability)
                          ? "border-primary bg-primary/10"
                          : "border-input"
                      }`}
                      onClick={() => toggleCapability(capability)}
                    >
                      <TagIcon
                        className={`h-4 w-4 mr-2 ${
                          selectedCapabilities.has(capability)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="capitalize">
                        {capability.replace("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
                <FormDescription className="mt-2">
                  Select all capabilities applicable to this model
                </FormDescription>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="isChatModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Chat Model</FormLabel>
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
                  control={editForm.control}
                  name="isVisionModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Vision Model
                        </FormLabel>
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
                  control={editForm.control}
                  name="isEmbeddingModel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Embedding Model
                        </FormLabel>
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

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this AI model
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateModelMutation.isPending}>
                  {updateModelMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Update Model
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the model "{selectedModel?.name}"?
              This action cannot be undone and will affect any agents using this
              model.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={deleteModelMutation.isPending}
            >
              {deleteModelMutation.isPending && (
                <span className="mr-2 h-4 w-4 animate-spin">◌</span>
              )}
              Delete Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
