import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AiPrompt, AiModel, InsertAiPrompt } from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  MoreHorizontal, 
  Check, 
  X, 
  MessageSquare,
  Search,
  Copy,
  ListFilter
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
import {
  Badge,
} from "@/components/ui/badge";
import {
  Slider
} from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Define prompt form schema based on InsertAiPrompt
const promptFormSchema = z.object({
  modelId: z.coerce.number().min(1, "Model is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  defaultUserPrompt: z.string().optional(),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  topP: z.coerce.number().min(0).max(1).default(1.0),
  frequencyPenalty: z.coerce.number().min(-2).max(2).default(0.0),
  presencePenalty: z.coerce.number().min(-2).max(2).default(0.0),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type PromptFormData = z.infer<typeof promptFormSchema>;

export default function AiPromptsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<AiPrompt | null>(null);
  const [promptViewTab, setPromptViewTab] = useState<string>("overview");

  // Form setup for creating prompt
  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      description: "",
      purpose: "general",
      systemPrompt: "You are a helpful AI assistant.",
      defaultUserPrompt: "",
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      isActive: true,
      isDefault: false,
    },
  });

  // Form setup for editing prompt
  const editForm = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      description: "",
      purpose: "general",
      systemPrompt: "",
      defaultUserPrompt: "",
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      isActive: true,
      isDefault: false,
    },
  });

  // Get AI Prompts data
  const { 
    data: prompts = [], 
    isLoading: isLoadingPrompts 
  } = useQuery<AiPrompt[]>({
    queryKey: ["/api/admin/ai-prompts"],
  });

  // Get AI Models data for dropdowns
  const { 
    data: models = [], 
    isLoading: isLoadingModels 
  } = useQuery<AiModel[]>({
    queryKey: ["/api/admin/ai-models"],
  });

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (newPrompt: InsertAiPrompt) => {
      const res = await apiRequest("POST", "/api/admin/ai-prompts", newPrompt);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Prompt created",
        description: "The AI prompt has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<InsertAiPrompt> }) => {
      const res = await apiRequest("PATCH", `/api/admin/ai-prompts/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Prompt updated",
        description: "The AI prompt has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      await apiRequest("DELETE", `/api/admin/ai-prompts/${promptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-prompts"] });
      toast({
        title: "Prompt deleted",
        description: "The AI prompt has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle prompt active status
  const togglePromptStatus = (prompt: AiPrompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      updates: {
        isActive: !prompt.isActive,
      },
    });
  };

  // Toggle prompt default status
  const togglePromptDefault = (prompt: AiPrompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      updates: {
        isDefault: !prompt.isDefault,
      },
    });
  };

  // Clone a prompt
  const clonePrompt = (prompt: AiPrompt) => {
    form.reset({
      modelId: prompt.modelId,
      name: `${prompt.name} (Copy)`,
      description: prompt.description,
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      defaultUserPrompt: prompt.defaultUserPrompt,
      temperature: prompt.temperature ? parseFloat(prompt.temperature.toString()) : 0.7,
      topP: prompt.topP ? parseFloat(prompt.topP.toString()) : 1.0,
      frequencyPenalty: prompt.frequencyPenalty ? parseFloat(prompt.frequencyPenalty.toString()) : 0.0,
      presencePenalty: prompt.presencePenalty ? parseFloat(prompt.presencePenalty.toString()) : 0.0,
      isActive: true,
      isDefault: false,
    });
    
    setIsCreateDialogOpen(true);
  };

  // Handle creating a new prompt
  const onSubmit = (data: PromptFormData) => {
    createPromptMutation.mutate(data as InsertAiPrompt);
  };

  // Handle editing a prompt
  const onEditSubmit = (data: PromptFormData) => {
    if (!selectedPrompt) return;
    
    updatePromptMutation.mutate({
      id: selectedPrompt.id,
      updates: data as InsertAiPrompt,
    });
  };

  // Handle edit button click
  const handleEditPrompt = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    
    // Prefill the edit form
    editForm.reset({
      modelId: prompt.modelId,
      name: prompt.name,
      description: prompt.description || "",
      purpose: prompt.purpose,
      systemPrompt: prompt.systemPrompt,
      defaultUserPrompt: prompt.defaultUserPrompt || "",
      temperature: prompt.temperature ? parseFloat(prompt.temperature.toString()) : 0.7,
      topP: prompt.topP ? parseFloat(prompt.topP.toString()) : 1.0,
      frequencyPenalty: prompt.frequencyPenalty ? parseFloat(prompt.frequencyPenalty.toString()) : 0.0,
      presencePenalty: prompt.presencePenalty ? parseFloat(prompt.presencePenalty.toString()) : 0.0,
      isActive: prompt.isActive,
      isDefault: prompt.isDefault,
    });
    
    setIsEditDialogOpen(true);
  };

  // Handle view prompt details
  const handleViewPrompt = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    setPromptViewTab("overview");
    // Open a dialog or redirect to a detail page
  };

  // Get model name by ID
  const getModelName = (modelId: number) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  };

  // Get purpose badge color
  const getPurposeBadgeColor = (purpose: string) => {
    switch (purpose) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'email_writing':
        return 'bg-green-100 text-green-800';
      case 'code_generation':
        return 'bg-purple-100 text-purple-800';
      case 'creative_writing':
        return 'bg-pink-100 text-pink-800';
      case 'data_analysis':
        return 'bg-yellow-100 text-yellow-800';
      case 'summarization':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get purpose display name
  const getPurposeDisplayName = (purpose: string) => {
    switch (purpose) {
      case 'general':
        return 'General Purpose';
      case 'email_writing':
        return 'Email Writing';
      case 'code_generation':
        return 'Code Generation';
      case 'creative_writing':
        return 'Creative Writing';
      case 'data_analysis':
        return 'Data Analysis';
      case 'summarization':
        return 'Summarization';
      default:
        return purpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get all unique purposes
  const allPurposes = [...new Set(prompts.map(prompt => prompt.purpose))];

  // Filter prompts based on search term and purpose filter
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPurpose = purposeFilter === 'all' || prompt.purpose === purposeFilter;
    
    return matchesSearch && matchesPurpose;
  });

  // Loading state
  if (isLoadingPrompts || isLoadingModels) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search prompts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-full md:w-56">
              <div className="flex items-center">
                <ListFilter className="mr-2 h-4 w-4" />
                <span>
                  {purposeFilter === 'all' 
                    ? 'All Purposes' 
                    : getPurposeDisplayName(purposeFilter)
                  }
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {allPurposes.map(purpose => (
                <SelectItem key={purpose} value={purpose}>
                  {getPurposeDisplayName(purpose)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Prompt</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add AI Prompt</DialogTitle>
              <DialogDescription>
                Create a new prompt template for AI generation
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an AI model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the model this prompt is designed for
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
                        <FormLabel>Prompt Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Email Assistant" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Purpose</SelectItem>
                            <SelectItem value="email_writing">Email Writing</SelectItem>
                            <SelectItem value="code_generation">Code Generation</SelectItem>
                            <SelectItem value="creative_writing">Creative Writing</SelectItem>
                            <SelectItem value="data_analysis">Data Analysis</SelectItem>
                            <SelectItem value="summarization">Summarization</SelectItem>
                            <SelectItem value="customer_support">Customer Support</SelectItem>
                            <SelectItem value="content_moderation">Content Moderation</SelectItem>
                          </SelectContent>
                        </Select>
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
                          placeholder="A brief description of this prompt's purpose and capabilities" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="You are a helpful AI assistant..." 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Instructions that define the AI's behavior
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
                          placeholder="Write an email about..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Starting prompt to help users (can be left blank)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-medium text-sm">Generation Parameters</h3>
                  
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Temperature</FormLabel>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={0}
                            max={2}
                            step={0.05}
                            defaultValue={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Lower values are more deterministic, higher values more creative (0-2)
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
                        <div className="flex justify-between items-center">
                          <FormLabel>Top P</FormLabel>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            defaultValue={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Controls diversity via nucleus sampling (0-1)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="frequencyPenalty"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Frequency Penalty</FormLabel>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={-2}
                              max={2}
                              step={0.1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Penalizes frequent tokens (-2 to 2)
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
                          <div className="flex justify-between items-center">
                            <FormLabel>Presence Penalty</FormLabel>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={-2}
                              max={2}
                              step={0.1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Penalizes repeated tokens (-2 to 2)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                            Enable this prompt
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
                          <FormLabel className="text-base">Default Prompt</FormLabel>
                          <FormDescription>
                            Use as default for this purpose
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
                    disabled={createPromptMutation.isPending}
                  >
                    {createPromptMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Prompt
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Prompt Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit AI Prompt</DialogTitle>
              <DialogDescription>
                Update the configuration for this AI prompt
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
        
        {/* Prompt Details Dialog */}
        {selectedPrompt && (
          <Dialog open={!!selectedPrompt} onOpenChange={(open) => !open && setSelectedPrompt(null)}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedPrompt.name}</span>
                  {selectedPrompt.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedPrompt.description || `A prompt for ${getModelName(selectedPrompt.modelId)}`}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="system">System Prompt</TabsTrigger>
                  <TabsTrigger value="params">Parameters</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Model</h4>
                      <p>{getModelName(selectedPrompt.modelId)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeBadgeColor(selectedPrompt.purpose)}`}>
                          {getPurposeDisplayName(selectedPrompt.purpose)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <p>{selectedPrompt.isActive ? 'Active' : 'Disabled'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Created</h4>
                      <p>{new Date(selectedPrompt.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedPrompt.defaultUserPrompt && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Default User Prompt</h4>
                      <div className="bg-gray-50 p-3 rounded border text-sm">
                        {selectedPrompt.defaultUserPrompt}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="system" className="py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-500">System Prompt</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPrompt.systemPrompt);
                          toast({
                            title: "Copied to clipboard",
                            description: "System prompt copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        <span>Copy</span>
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded border whitespace-pre-wrap text-sm font-mono">
                      {selectedPrompt.systemPrompt}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="params" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">Temperature</h4>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedPrompt.temperature}</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${(parseFloat(selectedPrompt.temperature?.toString() || '0.7') / 2) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Lower values are more deterministic, higher values more creative</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">Top P</h4>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedPrompt.topP}</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${parseFloat(selectedPrompt.topP?.toString() || '1.0') * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Controls diversity via nucleus sampling</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Frequency Penalty</h4>
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedPrompt.frequencyPenalty}</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ 
                              width: `${((parseFloat(selectedPrompt.frequencyPenalty?.toString() || '0.0') + 2) / 4) * 100}%`,
                              marginLeft: selectedPrompt.frequencyPenalty < 0 ? '50%' : '0' 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Penalizes frequent tokens</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">Presence Penalty</h4>
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedPrompt.presencePenalty}</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ 
                              width: `${((parseFloat(selectedPrompt.presencePenalty?.toString() || '0.0') + 2) / 4) * 100}%`,
                              marginLeft: selectedPrompt.presencePenalty < 0 ? '50%' : '0'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Penalizes repeated tokens</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => clonePrompt(selectedPrompt)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  <span>Clone</span>
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEditPrompt(selectedPrompt)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Edit</span>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the prompt "{selectedPrompt.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            deletePromptMutation.mutate(selectedPrompt.id);
                            setSelectedPrompt(null);
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deletePromptMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Prompts List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Prompts</CardTitle>
          <CardDescription>
            Manage system prompts and generation parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.length > 0 ? (
                filteredPrompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell>
                      <div className="font-medium flex items-center">
                        {prompt.name}
                        {prompt.isDefault && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>
                      {prompt.description && (
                        <div className="text-sm text-gray-500">{prompt.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{getModelName(prompt.modelId)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPurposeBadgeColor(prompt.purpose)}`}>
                        {getPurposeDisplayName(prompt.purpose)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {prompt.temperature || '0.7'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`flex h-2 w-2 rounded-full mr-2 ${prompt.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span>{prompt.isActive ? 'Active' : 'Disabled'}</span>
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
                          <DropdownMenuItem onClick={() => handleViewPrompt(prompt)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPrompt(prompt)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => clonePrompt(prompt)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePromptStatus(prompt)}>
                            {prompt.isActive ? (
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
                          <DropdownMenuItem onClick={() => togglePromptDefault(prompt)}>
                            {prompt.isDefault ? (
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
                                  This will permanently delete the prompt "{prompt.name}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deletePromptMutation.mutate(prompt.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletePromptMutation.isPending ? (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                      {searchTerm || purposeFilter !== 'all' ? (
                        <>
                          <p className="font-medium text-gray-700">No prompts found with the current filters</p>
                          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700">No AI prompts configured</p>
                          <p className="text-gray-500 text-sm">Add your first AI prompt to get started</p>
                          <Button 
                            onClick={() => setIsCreateDialogOpen(true)} 
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Prompt
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}