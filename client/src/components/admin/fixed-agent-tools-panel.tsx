import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
// Import the tool categories and templates
const TOOL_CATEGORIES = {
  DATA_PROCESSING: "data_processing",
  CONTENT_GENERATION: "content_generation",
  COMMUNICATION: "communication",
  KNOWLEDGE: "knowledge",
  UTILITIES: "utilities",
  INTEGRATIONS: "integrations",
  CUSTOM: "custom"
};

// Mock templates for demonstration purposes
const AGENT_TOOL_TEMPLATES = [
  {
    id: "search_tool",
    name: "Search Knowledge Base",
    description: "Search through internal knowledge base using natural language queries",
    category: "knowledge",
    implementation_type: "openai",
    input_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"query\": {\n      \"type\": \"string\",\n      \"description\": \"The search query\"\n    }\n  },\n  \"required\": [\"query\"]\n}",
    output_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"results\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}"
  },
  {
    id: "content_generator",
    name: "Content Generator",
    description: "Generate various types of content based on prompts and guidelines",
    category: "content_generation",
    implementation_type: "openai",
    input_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"content_type\": {\n      \"type\": \"string\",\n      \"enum\": [\"blog\", \"email\", \"social_post\", \"product_description\"]\n    },\n    \"topic\": {\n      \"type\": \"string\"\n    },\n    \"tone\": {\n      \"type\": \"string\",\n      \"enum\": [\"professional\", \"casual\", \"humorous\", \"formal\"]\n    },\n    \"length\": {\n      \"type\": \"string\",\n      \"enum\": [\"short\", \"medium\", \"long\"]\n    }\n  },\n  \"required\": [\"content_type\", \"topic\"]\n}",
    output_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"content\": {\n      \"type\": \"string\"\n    },\n    \"suggestions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}"
  }
];

export function AgentToolsPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("tools-list");

  const toolFormSchema = z.object({
    name: z.string().min(3, {
      message: "Tool name must be at least 3 characters.",
    }),
    description: z.string().min(10, {
      message: "Description must be at least 10 characters.",
    }),
    category: z.string().min(1, {
      message: "Please select a category.",
    }),
    implementation_type: z.string().min(1, {
      message: "Please select an implementation type.",
    }),
    input_schema: z.string().optional(),
    output_schema: z.string().optional(),
    endpoint: z.string().optional(),
    api_key_name: z.string().optional(),
    code: z.string().optional(),
  });

  type ToolFormValues = z.infer<typeof toolFormSchema>;

  const defaultValues: Partial<ToolFormValues> = {
    name: "",
    description: "",
    category: "",
    implementation_type: "",
    input_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"query\": {\n      \"type\": \"string\",\n      \"description\": \"The search query\"\n    }\n  },\n  \"required\": [\"query\"]\n}",
    output_schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"results\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
    endpoint: "",
    api_key_name: "",
    code: "",
  };

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ToolFormValues) {
    toast({
      title: "Tool Created",
      description: `Successfully created the "${data.name}" tool.`,
    });
    console.log(data);
    form.reset();
    setActiveTab("tools-list");
  }

  function fillTemplateData(templateId: string) {
    const template = AGENT_TOOL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      form.reset({
        name: template.name,
        description: template.description,
        category: template.category,
        implementation_type: template.implementation_type,
        input_schema: template.input_schema,
        output_schema: template.output_schema,
        endpoint: template.endpoint || "",
        api_key_name: template.api_key_name || "",
        code: template.code || "",
      });
    }
  }

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="tools-list" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools-list">Agent Tools</TabsTrigger>
          <TabsTrigger value="add-tool">Add New Tool</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tools-list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Tools</h3>
            <Button size="sm" onClick={() => setActiveTab("add-tool")}>Add New</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_TOOL_TEMPLATES.map((tool) => (
              <Card key={tool.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {Object.entries(TOOL_CATEGORIES).find(([_, value]) => value === tool.category)?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Custom"}
                    </span>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 text-xs">
                  <div className="text-muted-foreground">
                    Type: {tool.implementation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      fillTemplateData(tool.id);
                      setActiveTab("add-tool");
                    }}
                  >
                    Edit Clone
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="add-tool">
          <Card>
            <CardHeader>
              <CardTitle>Add New Agent Tool</CardTitle>
              <CardDescription>
                Create a new tool that can be used by agents to perform tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Tool Name</FormLabel>
                          <FormControl>
                            <Input className="h-9 sm:h-10 text-xs sm:text-sm" placeholder="Search Knowledge Base" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
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
                                <SelectItem 
                                  key={key} 
                                  value={value || `category_${key.toLowerCase()}`}
                                  className="text-xs sm:text-sm"
                                >
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Search through internal knowledge base using natural language queries"
                            className="min-h-20 text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Clearly describe what this tool does and when it should be used.
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="implementation_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Implementation Type</FormLabel>
                        <Select
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                              <SelectValue placeholder="Select implementation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="text-xs sm:text-sm">
                            <SelectItem value="openai" className="text-xs sm:text-sm">OpenAI</SelectItem>
                            <SelectItem value="custom_api" className="text-xs sm:text-sm">Custom API</SelectItem>
                            <SelectItem value="webhook" className="text-xs sm:text-sm">Webhook</SelectItem>
                            <SelectItem value="database" className="text-xs sm:text-sm">Database</SelectItem>
                            <SelectItem value="file_system" className="text-xs sm:text-sm">File System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Tool Schema</h4>
                    </div>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="input_schema"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Input Schema (JSON Schema)</FormLabel>
                            <FormControl>
                              <Textarea
                                className="font-mono text-xs h-48"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Define the parameters this tool accepts
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="output_schema"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Output Schema (JSON Schema)</FormLabel>
                            <FormControl>
                              <Textarea
                                className="font-mono text-xs h-48"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Define the structure of the tool's response
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {form.watch("implementation_type") === "custom_api" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">API Configuration</h4>
                      </div>
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="endpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">API Endpoint</FormLabel>
                              <FormControl>
                                <Input className="h-9 sm:h-10 text-xs sm:text-sm" placeholder="https://api.example.com/search" {...field} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="api_key_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">API Key Environment Variable</FormLabel>
                              <FormControl>
                                <Input className="h-9 sm:h-10 text-xs sm:text-sm" placeholder="SEARCH_API_KEY" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Name of the environment variable that stores the API key
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {(form.watch("implementation_type") === "database" || form.watch("implementation_type") === "file_system") && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Implementation Code</h4>
                      </div>
                      <Separator />
                      
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Function Implementation</FormLabel>
                            <FormControl>
                              <Textarea
                                className="font-mono text-xs h-64"
                                placeholder="// Write your implementation here"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              JavaScript code that implements this tool's functionality
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("tools-list")}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Tool
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}