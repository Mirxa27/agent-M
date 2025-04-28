import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { AiModel, AiPrompt } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, StarIcon, CopyIcon } from "lucide-react";

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
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Define form schema for creating/updating prompts
const promptFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  modelId: z.coerce.number({ required_error: "Model is required" }),
  purpose: z.string().min(2, "Purpose must be at least 2 characters."),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters."),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  defaultUserPrompt: z.string().optional().nullable(),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  topP: z.coerce.number().min(0).max(1).default(1),
  frequencyPenalty: z.coerce.number().min(0).max(2).default(0),
  presencePenalty: z.coerce.number().min(0).max(2).default(0)
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

// Common purposes for AI prompts that we can suggest to users
const commonPurposes = [
  "general",
  "content-creation",
  "summarization",
  "translation",
  "code-generation",
  "customer-support",
  "data-analysis",
  "research-assistant",
  "task-automation",
  "sentiment-analysis"
];

export default function AiPromptsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<AiPrompt | null>(null);
  const [viewTab, setViewTab] = useState("system");
  
  const queryClient = useQueryClient();

  // Fetch all AI prompts
  const { 
    data: prompts = [], 
    isLoading: isLoadingPrompts,
    error: promptsError 
  } = useQuery({
    queryKey: ["/api/admin/ai-prompts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ai-prompts");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch AI prompts");
      }
      return res.json();
    }
  });

  // Fetch all AI models for the dropdown
  const { 
    data: models = [], 
    isLoading: isLoadingModels,
  } = useQuery({
    queryKey: ["/api/admin/ai-models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ai-models");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch AI models");
      }
      return res.json();
    }
  });

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (prompt: PromptFormValues) => {
      const res = await apiRequest("POST", "/api/admin/ai-prompts", prompt);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create AI prompt");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prompt created",
        description: "The AI prompt has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error creating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, prompt }: { id: number, prompt: Partial<PromptFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/admin/ai-prompts/${id}`, prompt);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update AI prompt");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prompt updated",
        description: "The AI prompt has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/ai-prompts/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete AI prompt");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Prompt deleted",
        description: "The AI prompt has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create form
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      modelId: undefined,
      purpose: "",
      systemPrompt: "",
      description: "",
      isActive: true,
      isDefault: false,
      defaultUserPrompt: "",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  });

  // Edit form
  const editForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      modelId: undefined,
      purpose: "",
      systemPrompt: "",
      description: "",
      isActive: true,
      isDefault: false,
      defaultUserPrompt: "",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  });

  // Reset form to default values
  const resetForm = () => {
    form.reset({
      name: "",
      modelId: undefined,
      purpose: "",
      systemPrompt: "",
      description: "",
      isActive: true,
      isDefault: false,
      defaultUserPrompt: "",
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    });
  };

  // Handle create submission
  const onCreateSubmit = (values: PromptFormValues) => {
    createPromptMutation.mutate(values);
  };

  // Handle edit submission
  const onEditSubmit = (values: PromptFormValues) => {
    if (selectedPrompt) {
      updatePromptMutation.mutate({ 
        id: selectedPrompt.id, 
        prompt: values
      });
    }
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedPrompt) {
      deletePromptMutation.mutate(selectedPrompt.id);
    }
  };

  // Handle opening view dialog
  const handleView = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    setViewTab("system");
    setIsViewDialogOpen(true);
  };

  // Handle opening edit dialog
  const handleEdit = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    editForm.reset({
      name: prompt.name,
      modelId: prompt.modelId,
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      description: prompt.description || "",
      isActive: prompt.isActive,
      isDefault: prompt.isDefault,
      defaultUserPrompt: prompt.defaultUserPrompt || "",
      temperature: Number(prompt.temperature) || 0.7,
      topP: Number(prompt.topP) || 1,
      frequencyPenalty: Number(prompt.frequencyPenalty) || 0,
      presencePenalty: Number(prompt.presencePenalty) || 0
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDelete = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    setIsDeleteDialogOpen(true);
  };

  // Handle duplicating prompt
  const handleDuplicate = (prompt: AiPrompt) => {
    form.reset({
      name: `Copy of ${prompt.name}`,
      modelId: prompt.modelId,
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      description: prompt.description || "",
      isActive: prompt.isActive,
      isDefault: false, // Never duplicate the "default" status
      defaultUserPrompt: prompt.defaultUserPrompt || "",
      temperature: Number(prompt.temperature) || 0.7,
      topP: Number(prompt.topP) || 1,
      frequencyPenalty: Number(prompt.frequencyPenalty) || 0,
      presencePenalty: Number(prompt.presencePenalty) || 0
    });
    setIsCreateDialogOpen(true);
  };

  // Filter prompts by search query
  const filteredPrompts = prompts.filter(prompt => 
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prompt.description && prompt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get model name by ID
  const getModelName = (modelId: number) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : "Unknown";
  };

  // Function to format the system prompt for display
  const formatPromptForDisplay = (text: string) => {
    // Add line numbers and wrapping
    return text.split('\n').map((line, i) => (
      <div key={i} className="flex">
        <span className="mr-2 text-gray-400 select-none w-8 text-right">{i + 1}</span>
        <span className="flex-1 break-words">{line || ' '}</span>
      </div>
    ));
  };

  if (promptsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">AI Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Error loading AI prompts: {promptsError instanceof Error ? promptsError.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">AI Prompts</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search prompts..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Prompt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPrompts ? (
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
                    <TableHead>Purpose</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrompts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        {searchQuery ? "No prompts match your search" : "No AI prompts found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell className="flex items-center space-x-2">
                          <span className="font-medium">{prompt.name}</span>
                          {prompt.isDefault && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <StarIcon className="h-4 w-4 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Default prompt for this purpose</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {prompt.purpose.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getModelName(prompt.modelId)}</TableCell>
                        <TableCell>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getTemperatureColor(prompt.temperature)}`} 
                              style={{ width: `${(Number(prompt.temperature) / 2) * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {Number(prompt.temperature).toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={prompt.isActive ? "success" : "outline"}>
                            {prompt.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(prompt)}
                          >
                            <SearchIcon className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(prompt)}
                          >
                            <EditIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(prompt)}
                          >
                            <CopyIcon className="h-4 w-4" />
                            <span className="sr-only">Duplicate</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(prompt)}
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

      {/* View Prompt Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>View AI Prompt</DialogTitle>
            <DialogDescription>
              {selectedPrompt?.description || `A prompt for ${selectedPrompt?.purpose} using ${getModelName(selectedPrompt?.modelId || 0)}`}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={viewTab} onValueChange={setViewTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">System Prompt</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system" className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4 text-sm font-mono overflow-auto max-h-[400px]">
                {selectedPrompt && formatPromptForDisplay(selectedPrompt.systemPrompt)}
              </div>
              
              {selectedPrompt?.defaultUserPrompt && (
                <>
                  <h4 className="text-sm font-medium mt-4">Default User Prompt</h4>
                  <div className="rounded-md border bg-muted/50 p-4 text-sm font-mono overflow-auto max-h-[200px]">
                    {formatPromptForDisplay(selectedPrompt.defaultUserPrompt)}
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="parameters" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Temperature</h4>
                  <div className="flex items-center space-x-2">
                    <span className="w-10 text-sm">0</span>
                    <div className="relative flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={getTemperatureColor(selectedPrompt?.temperature)} 
                        style={{ 
                          width: `${(Number(selectedPrompt?.temperature) / 2) * 100}%`,
                          height: '100%'
                        }}
                      ></div>
                    </div>
                    <span className="w-10 text-sm text-right">2.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Value: {Number(selectedPrompt?.temperature).toFixed(1)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top P</h4>
                  <div className="flex items-center space-x-2">
                    <span className="w-10 text-sm">0</span>
                    <div className="relative flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="bg-primary" 
                        style={{ 
                          width: `${Number(selectedPrompt?.topP) * 100}%`,
                          height: '100%'
                        }}
                      ></div>
                    </div>
                    <span className="w-10 text-sm text-right">1.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Value: {Number(selectedPrompt?.topP).toFixed(1)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Frequency Penalty</h4>
                  <div className="flex items-center space-x-2">
                    <span className="w-10 text-sm">0</span>
                    <div className="relative flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500" 
                        style={{ 
                          width: `${(Number(selectedPrompt?.frequencyPenalty) / 2) * 100}%`,
                          height: '100%'
                        }}
                      ></div>
                    </div>
                    <span className="w-10 text-sm text-right">2.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Value: {Number(selectedPrompt?.frequencyPenalty).toFixed(1)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Presence Penalty</h4>
                  <div className="flex items-center space-x-2">
                    <span className="w-10 text-sm">0</span>
                    <div className="relative flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500" 
                        style={{ 
                          width: `${(Number(selectedPrompt?.presencePenalty) / 2) * 100}%`,
                          height: '100%'
                        }}
                      ></div>
                    </div>
                    <span className="w-10 text-sm text-right">2.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Value: {Number(selectedPrompt?.presencePenalty).toFixed(1)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Additional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Is Default</p>
                    <p className="text-sm">
                      {selectedPrompt?.isDefault ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm">
                      {selectedPrompt?.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prompt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Add New AI Prompt</DialogTitle>
            <DialogDescription>
              Configure a new AI prompt template to use with your agents.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Content Writer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingModels ? (
                            <div className="flex items-center justify-center p-2">
                              <Skeleton className="h-5 w-full" />
                            </div>
                          ) : (
                            models
                              .filter(model => model.isChatModel && model.isActive)
                              .map((model) => (
                                <SelectItem 
                                  key={model.id} 
                                  value={model.id.toString()}
                                >
                                  {model.name}
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
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonPurposes.map((purpose) => (
                            <SelectItem 
                              key={purpose} 
                              value={purpose}
                              className="capitalize"
                            >
                              {purpose.replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The category this prompt is designed for
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of this prompt" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your system prompt here..." 
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The system instructions that define the assistant's behavior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="defaultUserPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default User Prompt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a default user prompt template..." 
                        className="font-mono h-20"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A template for the initial user message (can include placeholders like {'{input}'})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className={getTemperatureSliderClass(field.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher values increase creativity but may reduce accuracy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="topP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top P: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Controls diversity via nucleus sampling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="frequencyPenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency Penalty: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="frequency-slider"
                        />
                      </FormControl>
                      <FormDescription>
                        Reduces repetition of the same phrases
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="presencePenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presence Penalty: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="presence-slider"
                        />
                      </FormControl>
                      <FormDescription>
                        Encourages talking about new topics
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-row items-center justify-between space-x-4">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 flex-1">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make Default</FormLabel>
                        <FormDescription>
                          Set as default prompt for this purpose
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 flex-1">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Make available for use in agents
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPromptMutation.isPending}
                >
                  {createPromptMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Create Prompt
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Edit AI Prompt</DialogTitle>
            <DialogDescription>
              Update the configuration for this AI prompt.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Content Writer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingModels ? (
                            <div className="flex items-center justify-center p-2">
                              <Skeleton className="h-5 w-full" />
                            </div>
                          ) : (
                            models
                              .filter(model => model.isChatModel)
                              .map((model) => (
                                <SelectItem 
                                  key={model.id} 
                                  value={model.id.toString()}
                                >
                                  {model.name}
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
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonPurposes.map((purpose) => (
                            <SelectItem 
                              key={purpose} 
                              value={purpose}
                              className="capitalize"
                            >
                              {purpose.replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The category this prompt is designed for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of this prompt" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your system prompt here..." 
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The system instructions that define the assistant's behavior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="defaultUserPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default User Prompt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a default user prompt template..." 
                        className="font-mono h-20"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A template for the initial user message (can include placeholders like {'{input}'})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className={getTemperatureSliderClass(field.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher values increase creativity but may reduce accuracy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="topP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top P: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Controls diversity via nucleus sampling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="frequencyPenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency Penalty: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="frequency-slider"
                        />
                      </FormControl>
                      <FormDescription>
                        Reduces repetition of the same phrases
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="presencePenalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presence Penalty: {field.value.toFixed(1)}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="presence-slider"
                        />
                      </FormControl>
                      <FormDescription>
                        Encourages talking about new topics
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-row items-center justify-between space-x-4">
                <FormField
                  control={editForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 flex-1">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Make Default</FormLabel>
                        <FormDescription>
                          Set as default prompt for this purpose
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 flex-1">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Make available for use in agents
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePromptMutation.isPending}
                >
                  {updatePromptMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Update Prompt
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
              Are you sure you want to delete the prompt "{selectedPrompt?.name}"? 
              This action cannot be undone and will affect any agents using this prompt.
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
              disabled={deletePromptMutation.isPending}
            >
              {deletePromptMutation.isPending && (
                <span className="mr-2 h-4 w-4 animate-spin">◌</span>
              )}
              Delete Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to determine the color for the temperature indicator
function getTemperatureColor(temperature: string | number | null | undefined) {
  if (temperature === null || temperature === undefined) return "bg-gray-300";
  
  const temp = Number(temperature);
  if (temp < 0.3) return "bg-blue-500";
  if (temp < 0.7) return "bg-green-500";
  if (temp < 1.2) return "bg-yellow-500";
  if (temp < 1.7) return "bg-orange-500";
  return "bg-red-500";
}

// Helper function to generate temperature slider class
function getTemperatureSliderClass(temperature: number) {
  if (temperature < 0.3) return "temperature-cold";
  if (temperature < 0.7) return "temperature-cool";
  if (temperature < 1.2) return "temperature-medium";
  if (temperature < 1.7) return "temperature-warm";
  return "temperature-hot";
}