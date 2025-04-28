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
import { 
  Loader2, Plus, Trash, Edit, Eye, Copy, Box, Search, Filter, X,
  Text, FileText, Code, Database, Globe, Mail, Server, Share, 
  Tag, Terminal, BarChart, Activity, Bot, Brain, Cloud 
} from "lucide-react";
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Agent Tools</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage AI agent tools and templates for your platform
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="h-9 text-xs sm:text-sm py-1 px-3"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Create Tool
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-5 md:mb-6">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools and templates..."
            className="pl-8 h-9 sm:h-10 text-xs sm:text-sm rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md border">
          <Switch
            id="show-system-tools"
            checked={showSystemTools}
            onCheckedChange={setShowSystemTools}
            className="scale-90 sm:scale-100 data-[state=checked]:bg-primary"
          />
          <Label htmlFor="show-system-tools" className="text-xs sm:text-sm font-medium cursor-pointer select-none">
            Show system tools
          </Label>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-4 sm:mb-5 md:mb-6 flex flex-wrap h-auto gap-1.5 p-1 bg-muted/50 rounded-lg overflow-x-auto">
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value="all">All Tools</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.CONTENT_GENERATION}>Content Generation</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.DATA_PROCESSING}>Data Processing</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.COMMUNICATION}>Communication</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.KNOWLEDGE}>Knowledge</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.UTILITIES}>Utilities</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.INTEGRATIONS}>Integrations</TabsTrigger>
          <TabsTrigger className="text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9" value={TOOL_CATEGORIES.CUSTOM}>Custom</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 px-0.5">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-8 sm:py-10 md:py-12">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
              </div>
            ) : filteredTools.length === 0 && availableTemplates.length === 0 ? (
              <div className="col-span-full">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 text-center">
                    <Box className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4 opacity-70" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">No tools or templates found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 max-w-md mx-auto">
                      Try changing your search or create a new tool.
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)} className="h-9 px-4">
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
                    <div className="col-span-full mb-2 sm:mb-3 md:mb-4">
                      <h3 className="text-base sm:text-lg font-medium mb-0">Available Templates</h3>
                    </div>
                    {availableTemplates.map(template => {
                      const IconComponent = getIconByName(template.icon);
                      const isAdded = isTemplateAdded(template.name);
                      
                      return (
                        <Card key={template.name} className="hover:shadow-md transition-shadow duration-200">
                          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm sm:text-base line-clamp-1">{template.name}</CardTitle>
                                  <CardDescription className="capitalize text-[10px] sm:text-xs">
                                    {template.category.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge variant={isAdded ? "outline" : "secondary"} className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2.5">
                                {isAdded ? "Added" : "Template"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2 px-3 sm:px-6">
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                              {template.description}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-between px-3 sm:px-6 pb-3 sm:pb-6">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTemplateClick(template)}
                              className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                            >
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Customize
                            </Button>
                            <Button
                              variant={isAdded ? "outline" : "default"}
                              size="sm"
                              disabled={isAdded}
                              onClick={() => handleAddTemplateClick(template)}
                              className="text-xs sm:text-sm h-8 px-2 sm:px-3"
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
                    <div className="col-span-full mt-4 sm:mt-5 md:mt-6 mb-2 sm:mb-3 md:mb-4">
                      <h3 className="text-base sm:text-lg font-medium mb-0">Your Tools</h3>
                    </div>
                    {filteredTools.map(tool => {
                      const IconComponent = getIconByName(tool.icon);
                      
                      return (
                        <Card key={tool.id} className={`${!tool.isActive ? 'opacity-70' : ''} hover:shadow-md transition-shadow duration-200`}>
                          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm sm:text-base flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="line-clamp-1">{tool.name}</span>
                                    {!tool.isActive && (
                                      <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2.5 whitespace-nowrap">Inactive</Badge>
                                    )}
                                    {tool.isSystem && (
                                      <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2.5 whitespace-nowrap">System</Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="capitalize text-[10px] sm:text-xs">
                                    {tool.category.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[8rem]">
                                  <DropdownMenuItem onClick={() => handleViewClick(tool)} className="text-xs sm:text-sm py-1.5 h-8">
                                    <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!tool.isSystem && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleEditClick(tool)} className="text-xs sm:text-sm py-1.5 h-8">
                                        <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedTool(tool);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="text-destructive text-xs sm:text-sm py-1.5 h-8"
                                      >
                                        <Trash className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2 px-3 sm:px-6">
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                              {tool.description}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                            <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2.5">{tool.type}</Badge>
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
        <DialogContent className="max-w-lg p-3 sm:p-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
          <DialogHeader className="mb-1 sm:mb-2">
            <DialogTitle className="text-lg sm:text-xl">Create Tool</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create a new tool for AI agents to use.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Text Generator" 
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this tool does..."
                        className="text-xs sm:text-sm min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="text-xs sm:text-sm">
                          {Object.entries(TOOL_CATEGORIES).map(([key, value]) => (
                            <SelectItem key={key} value={value} className="text-xs sm:text-sm">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="text-xs sm:text-sm">
                          <SelectItem value="openai" className="text-xs sm:text-sm">OpenAI</SelectItem>
                          <SelectItem value="custom_api" className="text-xs sm:text-sm">Custom API</SelectItem>
                          <SelectItem value="webhook" className="text-xs sm:text-sm">Webhook</SelectItem>
                          <SelectItem value="database" className="text-xs sm:text-sm">Database</SelectItem>
                          <SelectItem value="file_system" className="text-xs sm:text-sm">File System</SelectItem>
                          <SelectItem value="email" className="text-xs sm:text-sm">Email</SelectItem>
                          <SelectItem value="sms" className="text-xs sm:text-sm">SMS</SelectItem>
                          <SelectItem value="search" className="text-xs sm:text-sm">Search</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Icon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[50vh] text-xs sm:text-sm">
                        <SelectItem value="box" className="text-xs sm:text-sm flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Box
                        </SelectItem>
                        <SelectItem value="text" className="text-xs sm:text-sm flex items-center gap-2">
                          <Text className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Text
                        </SelectItem>
                        <SelectItem value="file-text" className="text-xs sm:text-sm flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> File Text
                        </SelectItem>
                        <SelectItem value="code" className="text-xs sm:text-sm flex items-center gap-2">
                          <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Code
                        </SelectItem>
                        <SelectItem value="database" className="text-xs sm:text-sm flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Database
                        </SelectItem>
                        <SelectItem value="globe" className="text-xs sm:text-sm flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Globe
                        </SelectItem>
                        <SelectItem value="mail" className="text-xs sm:text-sm flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mail
                        </SelectItem>
                        <SelectItem value="search" className="text-xs sm:text-sm flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Search
                        </SelectItem>
                        <SelectItem value="server" className="text-xs sm:text-sm flex items-center gap-2">
                          <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Server
                        </SelectItem>
                        <SelectItem value="share" className="text-xs sm:text-sm flex items-center gap-2">
                          <Share className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Share
                        </SelectItem>
                        <SelectItem value="tag" className="text-xs sm:text-sm flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Tag
                        </SelectItem>
                        <SelectItem value="terminal" className="text-xs sm:text-sm flex items-center gap-2">
                          <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Terminal
                        </SelectItem>
                        <SelectItem value="bar-chart" className="text-xs sm:text-sm flex items-center gap-2">
                          <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bar Chart
                        </SelectItem>
                        <SelectItem value="activity" className="text-xs sm:text-sm flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Activity
                        </SelectItem>
                        <SelectItem value="bot" className="text-xs sm:text-sm flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bot
                        </SelectItem>
                        <SelectItem value="brain" className="text-xs sm:text-sm flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Brain
                        </SelectItem>
                        <SelectItem value="cloud" className="text-xs sm:text-sm flex items-center gap-2">
                          <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cloud
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2.5 sm:p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs sm:text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">
                        Enable or disable this tool
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="scale-90 sm:scale-100"
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
                    <FormLabel className="text-xs sm:text-sm">Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{}'
                        className="font-mono text-xs sm:text-sm"
                        rows={8}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Configuration depends on the tool type. For OpenAI tools, include model, temperature, etc.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createToolMutation.isPending}
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm"
                >
                  {createToolMutation.isPending && <Loader2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                  Create Tool
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg p-3 sm:p-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
          <DialogHeader className="mb-1 sm:mb-2">
            <DialogTitle className="text-lg sm:text-xl">Edit Tool</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Modify the existing tool settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-3 sm:space-y-4">
              {/* Same form fields as create dialog */}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Text Generator" 
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this tool does..."
                        className="text-xs sm:text-sm min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="text-xs sm:text-sm">
                          {Object.entries(TOOL_CATEGORIES).map(([key, value]) => (
                            <SelectItem key={key} value={value} className="text-xs sm:text-sm">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="text-xs sm:text-sm">
                          <SelectItem value="openai" className="text-xs sm:text-sm">OpenAI</SelectItem>
                          <SelectItem value="custom_api" className="text-xs sm:text-sm">Custom API</SelectItem>
                          <SelectItem value="webhook" className="text-xs sm:text-sm">Webhook</SelectItem>
                          <SelectItem value="database" className="text-xs sm:text-sm">Database</SelectItem>
                          <SelectItem value="file_system" className="text-xs sm:text-sm">File System</SelectItem>
                          <SelectItem value="email" className="text-xs sm:text-sm">Email</SelectItem>
                          <SelectItem value="sms" className="text-xs sm:text-sm">SMS</SelectItem>
                          <SelectItem value="search" className="text-xs sm:text-sm">Search</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Icon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[50vh] text-xs sm:text-sm">
                        <SelectItem value="box" className="text-xs sm:text-sm flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Box
                        </SelectItem>
                        <SelectItem value="text" className="text-xs sm:text-sm flex items-center gap-2">
                          <Text className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Text
                        </SelectItem>
                        <SelectItem value="file-text" className="text-xs sm:text-sm flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> File Text
                        </SelectItem>
                        <SelectItem value="code" className="text-xs sm:text-sm flex items-center gap-2">
                          <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Code
                        </SelectItem>
                        <SelectItem value="database" className="text-xs sm:text-sm flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Database
                        </SelectItem>
                        <SelectItem value="globe" className="text-xs sm:text-sm flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Globe
                        </SelectItem>
                        <SelectItem value="mail" className="text-xs sm:text-sm flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Mail
                        </SelectItem>
                        <SelectItem value="search" className="text-xs sm:text-sm flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Search
                        </SelectItem>
                        <SelectItem value="server" className="text-xs sm:text-sm flex items-center gap-2">
                          <Server className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Server
                        </SelectItem>
                        <SelectItem value="share" className="text-xs sm:text-sm flex items-center gap-2">
                          <Share className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Share
                        </SelectItem>
                        <SelectItem value="tag" className="text-xs sm:text-sm flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Tag
                        </SelectItem>
                        <SelectItem value="terminal" className="text-xs sm:text-sm flex items-center gap-2">
                          <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Terminal
                        </SelectItem>
                        <SelectItem value="bar-chart" className="text-xs sm:text-sm flex items-center gap-2">
                          <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bar Chart
                        </SelectItem>
                        <SelectItem value="activity" className="text-xs sm:text-sm flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Activity
                        </SelectItem>
                        <SelectItem value="bot" className="text-xs sm:text-sm flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bot
                        </SelectItem>
                        <SelectItem value="brain" className="text-xs sm:text-sm flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Brain
                        </SelectItem>
                        <SelectItem value="cloud" className="text-xs sm:text-sm flex items-center gap-2">
                          <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cloud
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2.5 sm:p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs sm:text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">
                        Enable or disable this tool
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="scale-90 sm:scale-100"
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
                    <FormLabel className="text-xs sm:text-sm">Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{}'
                        className="font-mono text-xs sm:text-sm"
                        rows={8}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Configuration depends on the tool type. For OpenAI tools, include model, temperature, etc.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateToolMutation.isPending}
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm"
                >
                  {updateToolMutation.isPending && <Loader2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
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
          <DialogContent className="max-w-lg p-3 sm:p-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
            <DialogHeader className="mb-1 sm:mb-2">
              <DialogTitle className="text-lg sm:text-xl">{selectedTool.name}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {selectedTool.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1">Category</h4>
                  <p className="text-xs sm:text-sm capitalize">{selectedTool.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1">Type</h4>
                  <p className="text-xs sm:text-sm">{selectedTool.type}</p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1">Status</h4>
                  <p className="text-xs sm:text-sm">{selectedTool.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-1">System Tool</h4>
                  <p className="text-xs sm:text-sm">{selectedTool.isSystem ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Configuration</h4>
                <pre className="bg-muted p-3 sm:p-4 rounded-md text-xs overflow-auto max-h-[200px] sm:max-h-[400px]">
                  {JSON.stringify(selectedTool.config, null, 2)}
                </pre>
              </div>
            </div>
            
            <DialogFooter className="mt-3 sm:mt-4 flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-9 text-xs sm:text-sm py-1 px-3"
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
              
              {!selectedTool.isSystem && (
                <Button
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm py-1 px-3"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditClick(selectedTool);
                  }}
                >
                  <Edit className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Edit
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Tool Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="p-3 sm:p-6 max-w-sm sm:max-w-md overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
          <DialogHeader className="mb-1 sm:mb-2">
            <DialogTitle className="text-lg sm:text-xl">Delete Tool</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this tool? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-9 text-xs sm:text-sm py-1 px-3 sm:order-1"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto h-9 text-xs sm:text-sm py-1 px-3 sm:order-2"
              onClick={handleDeleteConfirm}
              disabled={deleteToolMutation.isPending}
            >
              {deleteToolMutation.isPending && <Loader2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}