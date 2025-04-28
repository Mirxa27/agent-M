import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Agent, InsertAgent } from "@shared/schema";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import AgentCard from "@/components/dashboard/agent-card";

// Define the form validation schema based on InsertAgent
const agentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Type is required"),
  icon: z.string().min(1, "Icon is required"),
  isActive: z.boolean().default(true),
  config: z.any().default({}),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

export default function AgentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form setup
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "email",
      icon: "envelope",
      isActive: true,
      config: {},
    },
  });

  // Get agents data
  const { 
    data: agents = [], 
    isLoading: isLoadingAgents 
  } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (newAgent: InsertAgent) => {
      const res = await apiRequest("POST", "/api/agents", newAgent);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Agent created",
        description: "Your new agent has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle creating a new agent
  const onSubmit = (data: AgentFormData) => {
    if (!user) return;
    
    const newAgent: InsertAgent = {
      ...data,
      userId: user.id,
    };
    
    createAgentMutation.mutate(newAgent);
  };

  // Function to handle "New Task" from agent card
  const handleNewAgentTask = (agentId: number) => {
    // Redirect to dashboard with this agent selected
    window.location.href = `/?agent=${agentId}&action=newTask`;
  };

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (isLoadingAgents) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="My Agents"
      subtitle="Create and manage your AI agents"
    >
      {/* Actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search agents..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>New Agent</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent to help automate your tasks.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Email Assistant" {...field} />
                      </FormControl>
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
                        <Textarea placeholder="This agent helps with email tasks..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="wordpress">WordPress</SelectItem>
                            <SelectItem value="google">Google Workspace</SelectItem>
                            <SelectItem value="file">File Management</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Icon</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="envelope">
                              <div className="flex items-center">
                                <i className="fa-solid fa-envelope mr-2"></i>
                                <span>Envelope</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="wordpress-simple">
                              <div className="flex items-center">
                                <i className="fa-brands fa-wordpress-simple mr-2"></i>
                                <span>WordPress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="google">
                              <div className="flex items-center">
                                <i className="fa-brands fa-google mr-2"></i>
                                <span>Google</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="file">
                              <div className="flex items-center">
                                <i className="fa-solid fa-file mr-2"></i>
                                <span>File</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="robot">
                              <div className="flex items-center">
                                <i className="fa-solid fa-robot mr-2"></i>
                                <span>Robot</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createAgentMutation.isPending}
                  >
                    {createAgentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Agent
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onNewTask={() => handleNewAgentTask(agent.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          {searchTerm ? (
            <>
              <p className="text-lg font-medium text-gray-700">No agents found matching "{searchTerm}"</p>
              <p className="text-gray-500 mt-1">Try adjusting your search or create a new agent</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">No agents created yet</p>
              <p className="text-gray-500 mt-1">Create your first AI agent to start automating tasks</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span>Create Agent</span>
              </Button>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
