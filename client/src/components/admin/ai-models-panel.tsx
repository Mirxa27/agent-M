import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AiModel, AiProvider, InsertAiModel } from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  MoreHorizontal, 
  Check, 
  X, 
  Bot,
  Search,
  Sparkles,
  Zap,
  ImageIcon,
  Mic,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define model form schema based on InsertAiModel
const modelFormSchema = z.object({
  providerId: z.coerce.number().min(1, "Provider is required"),
  name: z.string().min(1, "Name is required"),
  modelId: z.string().min(1, "Model ID is required"),
  description: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  contextWindow: z.coerce.number().optional(),
  maxOutputTokens: z.coerce.number().optional(),
  costInputPerK: z.coerce.number().optional(),
  costOutputPerK: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type ModelFormData = z.infer<typeof modelFormSchema>;

export default function AiModelsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [selectedAccordion, setSelectedAccordion] = useState<string | null>(null);

  // Form setup for creating model
  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: "",
      modelId: "",
      description: "",
      capabilities: ["text"],
      contextWindow: 4096,
      maxOutputTokens: 1024,
      costInputPerK: 0.01,
      costOutputPerK: 0.03,
      isActive: true,
      isDefault: false,
    },
  });

  // Form setup for editing model
  const editForm = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: "",
      modelId: "",
      description: "",
      capabilities: ["text"],
      contextWindow: 4096,
      maxOutputTokens: 1024,
      costInputPerK: 0.01,
      costOutputPerK: 0.03,
      isActive: true,
      isDefault: false,
    },
  });

  // Get AI Models data
  const { 
    data: models = [], 
    isLoading: isLoadingModels 
  } = useQuery<AiModel[]>({
    queryKey: ["/api/admin/ai-models"],
  });

  // Get AI Providers data for dropdowns
  const { 
    data: providers = [], 
    isLoading: isLoadingProviders 
  } = useQuery<AiProvider[]>({
    queryKey: ["/api/admin/ai-providers"],
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: async (newModel: InsertAiModel) => {
      const res = await apiRequest("POST", "/api/admin/ai-models", newModel);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Model created",
        description: "The AI model has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<InsertAiModel> }) => {
      const res = await apiRequest("PATCH", `/api/admin/ai-models/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Model updated",
        description: "The AI model has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      await apiRequest("DELETE", `/api/admin/ai-models/${modelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-models"] });
      toast({
        title: "Model deleted",
        description: "The AI model has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete model",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle model active status
  const toggleModelStatus = (model: AiModel) => {
    updateModelMutation.mutate({
      id: model.id,
      updates: {
        isActive: !model.isActive,
      },
    });
  };

  // Toggle model default status
  const toggleModelDefault = (model: AiModel) => {
    updateModelMutation.mutate({
      id: model.id,
      updates: {
        isDefault: !model.isDefault,
      },
    });
  };

  // Handle creating a new model
  const onSubmit = (data: ModelFormData) => {
    createModelMutation.mutate(data as InsertAiModel);
  };

  // Handle editing a model
  const onEditSubmit = (data: ModelFormData) => {
    if (!selectedModel) return;
    
    updateModelMutation.mutate({
      id: selectedModel.id,
      updates: data as InsertAiModel,
    });
  };

  // Handle edit button click
  const handleEditModel = (model: AiModel) => {
    setSelectedModel(model);
    
    // Prefill the edit form
    editForm.reset({
      providerId: model.providerId,
      name: model.name,
      modelId: model.modelId,
      description: model.description || "",
      capabilities: model.capabilities || ["text"],
      contextWindow: model.contextWindow || undefined,
      maxOutputTokens: model.maxOutputTokens || undefined,
      costInputPerK: model.costInputPerK ? parseFloat(model.costInputPerK.toString()) : undefined,
      costOutputPerK: model.costOutputPerK ? parseFloat(model.costOutputPerK.toString()) : undefined,
      isActive: model.isActive,
      isDefault: model.isDefault,
    });
    
    setIsEditDialogOpen(true);
  };

  // Filter models based on search term
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.modelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group models by provider
  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.providerId]) {
      acc[model.providerId] = [];
    }
    acc[model.providerId].push(model);
    return acc;
  }, {} as Record<number, AiModel[]>);

  // Get provider name
  const getProviderName = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Unknown Provider';
  };

  // Get provider type
  const getProviderType = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.provider : 'unknown';
  };

  // Get capability icon
  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'vision':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  // Loading state
  if (isLoadingModels || isLoadingProviders) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search models..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Model</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add AI Model</DialogTitle>
              <DialogDescription>
                Configure a new AI model from an existing provider
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Provider</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an AI provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the provider that hosts this model
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="GPT-4o" {...field} />
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
                        <FormLabel>Model ID</FormLabel>
                        <FormControl>
                          <Input placeholder="gpt-4o" {...field} />
                        </FormControl>
                        <FormDescription>
                          ID used by the provider's API
                        </FormDescription>
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A brief description of this model's capabilities" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capabilities"
                  render={() => (
                    <FormItem>
                      <FormLabel>Capabilities</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="capabilities"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('text')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, 'text']);
                                    } else {
                                      field.onChange(current.filter(val => val !== 'text'));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Text Generation
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="capabilities"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('image')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, 'image']);
                                    } else {
                                      field.onChange(current.filter(val => val !== 'image'));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Image Generation
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="capabilities"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('vision')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, 'vision']);
                                    } else {
                                      field.onChange(current.filter(val => val !== 'vision'));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Vision (Image Input)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="capabilities"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('audio')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, 'audio']);
                                    } else {
                                      field.onChange(current.filter(val => val !== 'audio'));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Audio Processing
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contextWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Context Window</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="4096" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum tokens in context
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxOutputTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Output Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="costInputPerK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Cost per 1K Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                          In USD ($)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="costOutputPerK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Cost per 1K Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="0.03" {...field} />
                        </FormControl>
                        <FormDescription>
                          In USD ($)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Enable this model
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
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Default Model</FormLabel>
                          <FormDescription>
                            Use as default
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
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createModelMutation.isPending}
                  >
                    {createModelMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Model
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Model Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit AI Model</DialogTitle>
              <DialogDescription>
                Update the configuration for this AI model
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
                {/* Same form fields as the create form, but with edit values */}
                {/* ... (Include similar form fields as in the create form) */}
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Models List */}
      <div className="space-y-6">
        {Object.keys(modelsByProvider).length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={selectedAccordion || undefined}
            onValueChange={(value) => setSelectedAccordion(value)}
          >
            {Object.entries(modelsByProvider).map(([providerId, providerModels]) => (
              <AccordionItem 
                key={providerId} 
                value={providerId}
                className="border rounded-lg mb-4 overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{getProviderName(parseInt(providerId))}</h3>
                      <p className="text-sm text-gray-500">{providerModels.length} {providerModels.length === 1 ? 'model' : 'models'}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Capabilities</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerModels.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>
                            <div className="font-medium flex items-center">
                              {model.name}
                              {model.isDefault && (
                                <Badge variant="secondary" className="ml-2">Default</Badge>
                              )}
                            </div>
                            {model.description && (
                              <div className="text-sm text-gray-500">{model.description}</div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{model.modelId}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {model.capabilities && model.capabilities.map((capability, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="flex items-center gap-1"
                                >
                                  {getCapabilityIcon(capability)}
                                  <span>{capability}</span>
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {model.contextWindow ? `${model.contextWindow.toLocaleString()} tokens` : 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={`flex h-2 w-2 rounded-full mr-2 ${model.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span>{model.isActive ? 'Active' : 'Disabled'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditModel(model)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleModelStatus(model)}>
                                  {model.isActive ? (
                                    <>
                                      <X className="h-4 w-4 mr-2" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-2" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleModelDefault(model)}>
                                  {model.isDefault ? (
                                    <>
                                      <X className="h-4 w-4 mr-2" />
                                      Remove as Default
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-2" />
                                      Set as Default
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-500">Delete</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the model "{model.name}". This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteModelMutation.mutate(model.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteModelMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bot className="h-12 w-12 text-gray-300 mb-4" />
              {searchTerm ? (
                <>
                  <p className="font-medium text-gray-700">No models found matching "{searchTerm}"</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search or add a new model</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-700">No AI models configured</p>
                  <p className="text-gray-500 text-sm">Add your first AI model to get started</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}