import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Agent, Task, File, InsertTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Key, HardDrive, Crown, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import StatCard from "@/components/dashboard/stat-card";
import AgentCard from "@/components/dashboard/agent-card";
import TaskTable from "@/components/dashboard/task-table";
import TaskChat from "@/components/dashboard/task-chat";
import RobotVisualization from "@/components/dashboard/robot-visualization";
import TemplateList from "@/components/dashboard/template-list";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<number | undefined>(undefined);

  // Get agents data
  const { 
    data: agents = [], 
    isLoading: isLoadingAgents 
  } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  // Get recent tasks
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks 
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks?limit=5"],
  });

  // Get templates
  const { 
    data: templates = [], 
    isLoading: isLoadingTemplates 
  } = useQuery<File[]>({
    queryKey: ["/api/templates"],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", newTask);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your new task has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle "New Task" from agent card
  const handleNewAgentTask = (agentId: number) => {
    // Set the selected agent in the task chat
    setActiveTaskId(undefined);
    // You could also scroll to the task chat section
    document.getElementById('task-chat-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to handle viewing a task
  const handleViewTask = (taskId: number) => {
    setActiveTaskId(taskId);
    document.getElementById('task-chat-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to handle rerunning a task
  const handleRerunTask = (taskId: number) => {
    toast({
      title: "Task rerun",
      description: "The task has been queued to rerun",
    });
  };

  // Function to create a new task
  const handleCreateTask = async (title: string, agentId: number): Promise<number> => {
    if (!title || !agentId) {
      throw new Error("Missing required fields");
    }

    const newTask: InsertTask = {
      userId: user!.id,
      agentId,
      title,
      description: "Created from dashboard",
    };

    const task = await createTaskMutation.mutateAsync(newTask);
    return task.id;
  };

  // Function to handle using a template
  const handleUseTemplate = (templateId: number) => {
    toast({
      title: "Template selected",
      description: "The template has been selected for use",
    });
  };

  // Loading state
  if (isLoadingAgents || isLoadingTasks || isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  // Filter recent templates
  const recentTemplates = templates.slice(0, 3);

  return (
    <DashboardLayout 
      title={`Welcome back, ${user?.fullName?.split(' ')[0] || user?.username}`}
      subtitle="Here's what's happening with your AI agents today."
    >
      {/* Action Buttons */}
      <div className="mb-8 flex justify-end space-x-3">
        <Button variant="outline" className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          <span>New Agent</span>
        </Button>
        
        <Button className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Agents"
          value={agents.filter(a => a.isActive).length.toString()}
          icon={<Bot className="h-5 w-5 text-primary-500" />}
          iconBgColor="bg-primary-50"
          change={{ value: "2 new", isPositive: true }}
          changeText="this week"
        />
        
        <StatCard
          title="Tasks Completed"
          value={tasks.filter(t => t.status === "completed").length.toString()}
          icon={<i className="fa-solid fa-check-double text-secondary text-xl"></i>}
          iconBgColor="bg-secondary-50"
          change={{ value: "32 more", isPositive: true }}
          changeText="than last week"
        />
        
        <StatCard
          title="Storage Used"
          value={`1.4/5 GB`}
          icon={<HardDrive className="h-5 w-5 text-blue-500" />}
          iconBgColor="bg-blue-50"
          progressBar={{
            value: 1.4,
            max: 5,
            color: "bg-blue-500"
          }}
        />
        
        <StatCard
          title="Subscription"
          value={user?.plan === 'free' ? 'Free' : (user?.plan || 'Free')}
          icon={<Crown className="h-5 w-5 text-purple-500" />}
          iconBgColor="bg-purple-50"
          changeText={`Renews in 18 days`}
        />
      </div>

      {/* My Agents Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold">My Agents</h2>
          <a href="/agents" className="text-primary text-sm font-medium hover:text-primary-600">View All</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.slice(0, 3).map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onNewTask={() => handleNewAgentTask(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat Interface and Templates Section */}
      <div id="task-chat-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Task Interface */}
        <div className="lg:col-span-2">
          <TaskChat 
            activeTaskId={activeTaskId}
            onNewTask={handleCreateTask}
            agents={agents} 
          />
        </div>
        
        {/* Bot Visualization & Recent Templates */}
        <div className="space-y-6">
          <RobotVisualization 
            onCustomize={() => toast({ title: "Customize Assistant", description: "This feature is coming soon!" })}
          />
          
          <TemplateList 
            templates={recentTemplates}
            onUseTemplate={handleUseTemplate}
          />
        </div>
      </div>

      {/* Recent Task History */}
      <TaskTable 
        tasks={tasks}
        onViewTask={handleViewTask}
        onRerunTask={handleRerunTask}
      />
    </DashboardLayout>
  );
}
