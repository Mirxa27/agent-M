import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AgentTool } from "@shared/schema";
import { AgentToolTemplate, TOOL_TEMPLATES, TOOL_CATEGORIES, getAllTemplates, getTemplatesByCategory } from "@shared/agent-tools-templates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Plus, Trash, Edit, Eye, Copy, Box, Search, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Schema for creating/editing agent tools
const agentToolSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  icon: z.string().min(1, "Icon is required"),
  isActive: z.boolean().default(true),
  config: z.string().refine(
    value => {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Config must be valid JSON" }
  ),
});

// Get icon component from string
const getIconByName = (name: string): LucideIcon => {
  const icon = (LucideIcons as Record<string, LucideIcon>)[name] || Box;
  return icon;
};

export default function AgentToolsPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSystemTools, setShowSystemTools] = useState<boolean>(true);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<AgentTool | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentToolTemplate | null>(null);

  // Create form setup
  const createForm = useForm<z.infer<typeof agentToolSchema>>({
    resolver: zodResolver(agentToolSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      type: "",
      icon: "box",
      isActive: true,
      config: "{}"
    }
  });

  // Edit form setup
  const editForm = useForm<z.infer<typeof agentToolSchema>>({
    resolver: zodResolver(agentToolSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      type: "",
      icon: "box",
      isActive: true,
      config: "{}"
    }
  });

  // Fetch agent tools
  const { 
    data: tools, 
    isLoading 
  } = useQuery({
    queryKey: ["/api/admin/agent-tools"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agent-tools");
      if (!res.ok) throw new Error("Failed to fetch agent tools");
      return res.json() as Promise<AgentTool[]>;
    },
    enabled: true, // This will ensure the query is executed immediately
  });

  // Create agent tool mutation
  const createToolMutation = useMutation({
    mutationFn: async (data: z.infer<typeof agentToolSchema>) => {
      const transformedData = {
        ...data,
        config: JSON.parse(data.config),
      };
      return apiRequest('POST', "/api/admin/agent-tools", transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-tools"] });
      createForm.reset();
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Agent tool created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update agent tool mutation
  const updateToolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof agentToolSchema> }) => {
      const transformedData = {
        ...data,
        config: JSON.parse(data.config),
      };
      return apiRequest('PATCH', `/api/admin/agent-tools/${id}`, transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-tools"] });
      editForm.reset();
      setEditDialogOpen(false);
      setSelectedTool(null);
      toast({
        title: "Success",
        description: "Agent tool updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete agent tool mutation
  const deleteToolMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/agent-tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-tools"] });
      setDeleteDialogOpen(false);
      setSelectedTool(null);
      toast({
        title: "Success",
        description: "Agent tool deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add template tool mutation
  const addTemplateMutation = useMutation({
    mutationFn: async (template: AgentToolTemplate) => {
      const data = {
        name: template.name,
        description: template.description,
        category: template.category,
        type: template.type,
        icon: template.icon,
        isActive: true,
        config: template.config,
        isSystem: template.isSystem,
      };
      return apiRequest('POST', "/api/admin/agent-tools", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent-tools"] });
      toast({
        title: "Success",
        description: "Template added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const handleCreateSubmit = (data: z.infer<typeof agentToolSchema>) => {
    createToolMutation.mutate(data);
  };

  const handleEditSubmit = (data: z.infer<typeof agentToolSchema>) => {
    if (selectedTool) {
      updateToolMutation.mutate({ id: selectedTool.id, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTool) {
      deleteToolMutation.mutate(selectedTool.id);
    }
  };

  const handleEditClick = (tool: AgentTool) => {
    setSelectedTool(tool);
    
    // Prepare config as string for the form
    const configStr = tool.config 
      ? JSON.stringify(tool.config, null, 2) 
      : "{}";
    
    editForm.reset({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      type: tool.type,
      icon: tool.icon,
      isActive: tool.isActive,
      config: configStr
    });
    
    setEditDialogOpen(true);
  };

  const handleViewClick = (tool: AgentTool) => {
    setSelectedTool(tool);
    setViewDialogOpen(true);
  };

  const handleTemplateClick = (template: AgentToolTemplate) => {
    setSelectedTemplate(template);
    
    createForm.reset({
      name: template.name,
      description: template.description,
      category: template.category,
      type: template.type,
      icon: template.icon,
      isActive: true,
      config: JSON.stringify(template.config, null, 2)
    });
    
    setCreateDialogOpen(true);
  };

  const handleAddTemplateClick = (template: AgentToolTemplate) => {
    addTemplateMutation.mutate(template);
  };

  // Filter and sort tools
  const filteredTools = tools?.filter(tool => {
    if (!showSystemTools && tool.isSystem) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query)
      );
    }
    
    if (activeTab !== "all") {
      return tool.category === activeTab;
    }
    
    return true;
  }) || [];

  // Get available templates based on tab and filters
  const getTemplates = () => {
    let templates = getAllTemplates();
    
    if (activeTab !== "all") {
      templates = getTemplatesByCategory(activeTab);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
      );
    }
    
    return templates;
  };

  const availableTemplates = getTemplates();

  // Check if template is already added
  const isTemplateAdded = (templateName: string) => {
    return tools?.some(tool => 
      tool.name === templateName || 
      (tool.config && typeof tool.config === 'object' && 'templateName' in tool.config && tool.config.templateName === templateName)
    ) || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Tools</h2>
          <p className="text-muted-foreground">
            Manage AI agent tools and templates for your platform
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tool
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools and templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-system-tools"
            checked={showSystemTools}
            onCheckedChange={setShowSystemTools}
          />
          <Label htmlFor="show-system-tools">Show system tools</Label>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.CONTENT_GENERATION}>Content Generation</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.DATA_PROCESSING}>Data Processing</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.COMMUNICATION}>Communication</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.KNOWLEDGE}>Knowledge</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.UTILITIES}>Utilities</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.INTEGRATIONS}>Integrations</TabsTrigger>
          <TabsTrigger value={TOOL_CATEGORIES.CUSTOM}>Custom</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : filteredTools.length === 0 && availableTemplates.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Box className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tools or templates found</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Try changing your search or create a new tool.
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create Tool
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {/* Available Templates Section */}
                {availableTemplates.length > 0 && (
                  <>
                    <div className="col-span-full mb-2">
                      <h3 className="text-lg font-medium mb-0">Available Templates</h3>
                    </div>
                    {availableTemplates.map(template => {
                      const IconComponent = getIconByName(template.icon);
                      const isAdded = isTemplateAdded(template.name);
                      
                      return (
                        <Card key={template.name} className="hover:shadow-md transition-shadow duration-200">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{template.name}</CardTitle>
                                  <CardDescription className="capitalize">
                                    {template.category.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge variant={isAdded ? "outline" : "secondary"}>
                                {isAdded ? "Added" : "Template"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTemplateClick(template)}
                            >
                              <Copy className="h-4 w-4 mr-1" /> Customize
                            </Button>
                            <Button
                              variant={isAdded ? "outline" : "default"}
                              size="sm"
                              disabled={isAdded}
                              onClick={() => handleAddTemplateClick(template)}
                            >
                              {isAdded ? "Already Added" : "Add Template"}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </>
                )}

                {/* Existing Tools Section */}
                {filteredTools.length > 0 && (
                  <>
                    <div className="col-span-full mt-6 mb-2">
                      <h3 className="text-lg font-medium mb-0">Your Tools</h3>
                    </div>
                    {filteredTools.map(tool => {
                      const IconComponent = getIconByName(tool.icon);
                      
                      return (
                        <Card key={tool.id} className={`${!tool.isActive ? 'opacity-70' : ''} hover:shadow-md transition-shadow duration-200`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {tool.name}
                                    {!tool.isActive && (
                                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                                    )}
                                    {tool.isSystem && (
                                      <Badge variant="secondary" className="text-xs">System</Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="capitalize">
                                    {tool.category.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Filter className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewClick(tool)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!tool.isSystem && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleEditClick(tool)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedTool(tool);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {tool.description}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Tool Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Tool</DialogTitle>
            <DialogDescription>
              Create a new tool for AI agents to use.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Text Generator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this tool does..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TOOL_CATEGORIES).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="custom_api">Custom API</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="file_system">File System</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="search">Search</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="file-text">File Text</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="globe">Globe</SelectItem>
                        <SelectItem value="mail">Mail</SelectItem>
                        <SelectItem value="search">Search</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="share">Share</SelectItem>
                        <SelectItem value="tag">Tag</SelectItem>
                        <SelectItem value="terminal">Terminal</SelectItem>
                        <SelectItem value="bar-chart">Bar Chart</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="bot">Bot</SelectItem>
                        <SelectItem value="brain">Brain</SelectItem>
                        <SelectItem value="cloud">Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this tool
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
                control={createForm.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{}'
                        className="font-mono"
                        rows={10}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Configuration depends on the tool type. For OpenAI tools, include model, temperature, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createToolMutation.isPending}
                >
                  {createToolMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Tool
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>
              Modify the existing tool settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              {/* Same form fields as create dialog */}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Text Generator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this tool does..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TOOL_CATEGORIES).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="custom_api">Custom API</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="file_system">File System</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="search">Search</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="file-text">File Text</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="globe">Globe</SelectItem>
                        <SelectItem value="mail">Mail</SelectItem>
                        <SelectItem value="search">Search</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="share">Share</SelectItem>
                        <SelectItem value="tag">Tag</SelectItem>
                        <SelectItem value="terminal">Terminal</SelectItem>
                        <SelectItem value="bar-chart">Bar Chart</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="bot">Bot</SelectItem>
                        <SelectItem value="brain">Brain</SelectItem>
                        <SelectItem value="cloud">Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this tool
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
                control={editForm.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{}'
                        className="font-mono"
                        rows={10}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Configuration depends on the tool type. For OpenAI tools, include model, temperature, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateToolMutation.isPending}
                >
                  {updateToolMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Tool
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Tool Dialog */}
      {selectedTool && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedTool.name}</DialogTitle>
              <DialogDescription>
                {selectedTool.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Category</h4>
                  <p className="text-sm capitalize">{selectedTool.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Type</h4>
                  <p className="text-sm">{selectedTool.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <p className="text-sm">{selectedTool.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">System Tool</h4>
                  <p className="text-sm">{selectedTool.isSystem ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Configuration</h4>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[400px]">
                  {JSON.stringify(selectedTool.config, null, 2)}
                </pre>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
              
              {!selectedTool.isSystem && (
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditClick(selectedTool);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Tool Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tool? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteToolMutation.isPending}
            >
              {deleteToolMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}