import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AiProvider, InsertAiProvider } from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Key, 
  MoreHorizontal, 
  Check, 
  X, 
  Server,
  Search
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

// Define provider form schema based on InsertAiProvider
const providerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider type is required"),
  description: z.string().optional(),
  baseUrl: z.string().optional(),
  authType: z.string().default("api_key"),
  apiKey: z.string().min(1, "API key is required"),
  isActive: z.boolean().default(true),
});

type ProviderFormData = z.infer<typeof providerFormSchema>;

export default function AiProvidersPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);

  // Form setup for creating provider
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: "",
      provider: "openai",
      description: "",
      baseUrl: "",
      authType: "api_key",
      apiKey: "",
      isActive: true,
    },
  });

  // Form setup for editing provider
  const editForm = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: "",
      provider: "openai",
      description: "",
      baseUrl: "",
      authType: "api_key",
      apiKey: "",
      isActive: true,
    },
  });

  // Get AI Providers data
  const { 
    data: providers = [], 
    isLoading: isLoadingProviders 
  } = useQuery<AiProvider[]>({
    queryKey: ["/api/admin/ai-providers"],
  });

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: async (newProvider: InsertAiProvider) => {
      const res = await apiRequest("POST", "/api/admin/ai-providers", newProvider);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-providers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Provider created",
        description: "The AI provider has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<InsertAiProvider> }) => {
      const res = await apiRequest("PATCH", `/api/admin/ai-providers/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-providers"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Provider updated",
        description: "The AI provider has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: number) => {
      await apiRequest("DELETE", `/api/admin/ai-providers/${providerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-providers"] });
      toast({
        title: "Provider deleted",
        description: "The AI provider has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle provider active status
  const toggleProviderStatus = (provider: AiProvider) => {
    updateProviderMutation.mutate({
      id: provider.id,
      updates: {
        isActive: !provider.isActive,
      },
    });
  };

  // Handle creating a new provider
  const onSubmit = (data: ProviderFormData) => {
    createProviderMutation.mutate(data as InsertAiProvider);
  };

  // Handle editing a provider
  const onEditSubmit = (data: ProviderFormData) => {
    if (!selectedProvider) return;
    
    updateProviderMutation.mutate({
      id: selectedProvider.id,
      updates: data as InsertAiProvider,
    });
  };

  // Handle edit button click
  const handleEditProvider = (provider: AiProvider) => {
    setSelectedProvider(provider);
    
    // Prefill the edit form
    editForm.reset({
      name: provider.name,
      provider: provider.provider,
      description: provider.description || "",
      baseUrl: provider.baseUrl || "",
      authType: provider.authType,
      apiKey: "••••••••••••••••", // Don't show actual API key for security
      isActive: provider.isActive,
    });
    
    setIsEditDialogOpen(true);
  };

  // Filter providers based on search term
  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (provider.description && provider.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get icon and color for provider
  const getProviderInfo = (providerType: string) => {
    switch (providerType.toLowerCase()) {
      case 'openai':
        return { color: 'bg-green-100 text-green-700', icon: 'fa-bolt' };
      case 'anthropic':
        return { color: 'bg-purple-100 text-purple-700', icon: 'fa-robot' };
      case 'xai':
        return { color: 'bg-blue-100 text-blue-700', icon: 'fa-x' };
      case 'perplexity':
        return { color: 'bg-red-100 text-red-700', icon: 'fa-brain' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: 'fa-code' };
    }
  };

  // Loading state
  if (isLoadingProviders) {
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
            placeholder="Search providers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Provider</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add AI Provider</DialogTitle>
              <DialogDescription>
                Add a new AI provider to connect with your platform
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My OpenAI Account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="xai">xAI</SelectItem>
                          <SelectItem value="perplexity">Perplexity</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea 
                          placeholder="A brief description of this provider connection" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auth type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="oauth">OAuth</SelectItem>
                            <SelectItem value="basic_auth">Basic Auth</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty for default API endpoint
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this provider for use in the platform
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
                    type="submit" 
                    disabled={createProviderMutation.isPending}
                  >
                    {createProviderMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Provider
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Provider Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit AI Provider</DialogTitle>
              <DialogDescription>
                Update the AI provider connection details
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My OpenAI Account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="xai">xAI</SelectItem>
                          <SelectItem value="perplexity">Perplexity</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea 
                          placeholder="A brief description of this provider connection" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={editForm.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auth type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="oauth">OAuth</SelectItem>
                            <SelectItem value="basic_auth">Basic Auth</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty for default API endpoint
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new API key to update" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave unchanged to keep the current API key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this provider for use in the platform
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
                    type="submit" 
                    disabled={updateProviderMutation.isPending}
                  >
                    {updateProviderMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Providers</CardTitle>
          <CardDescription>
            Manage your connections to AI service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => {
                  const providerInfo = getProviderInfo(provider.provider);
                  
                  return (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="font-medium">{provider.name}</div>
                        {provider.description && (
                          <div className="text-sm text-gray-500">{provider.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${providerInfo.color}`}>
                          <i className={`fa-solid ${providerInfo.icon} mr-1`}></i>
                          {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.baseUrl ? (
                          <span className="text-sm">{provider.baseUrl}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Default</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`flex h-2 w-2 rounded-full mr-2 ${provider.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span>{provider.isActive ? 'Active' : 'Disabled'}</span>
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
                            <DropdownMenuItem onClick={() => handleEditProvider(provider)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleProviderStatus(provider)}>
                              {provider.isActive ? (
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
                                    This will permanently delete the provider "{provider.name}" and all associated models. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteProviderMutation.mutate(provider.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleteProviderMutation.isPending ? (
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Server className="h-10 w-10 text-gray-300 mb-2" />
                      {searchTerm ? (
                        <>
                          <p className="font-medium text-gray-700">No providers found matching "{searchTerm}"</p>
                          <p className="text-gray-500 text-sm">Try adjusting your search or add a new provider</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700">No AI providers configured</p>
                          <p className="text-gray-500 text-sm">Add your first AI provider to get started</p>
                          <Button 
                            onClick={() => setIsCreateDialogOpen(true)} 
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Provider
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