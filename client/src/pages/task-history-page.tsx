import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Activity, 
  Bot, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Task status colors
const statusConfig = {
  completed: {
    color: "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400",
    icon: CheckCircle,
  },
  failed: {
    color: "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400",
    icon: XCircle,
  },
  in_progress: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400",
    icon: Loader2,
  },
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400",
    icon: Clock,
  },
};

export default function TaskHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timeRange, setTimeRange] = useState("all");

  // Fetch tasks
  const { 
    data: tasks,
    isLoading 
  } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json() as Promise<Task[]>;
    }
  });

  // Get agent details for a task
  const { 
    data: agentDetails, 
    isLoading: isLoadingAgentDetails 
  } = useQuery({
    queryKey: ["/api/agents", selectedTask?.agentId],
    queryFn: async () => {
      if (!selectedTask?.agentId) return null;
      const res = await fetch(`/api/agents/${selectedTask.agentId}`);
      if (!res.ok) throw new Error("Failed to fetch agent details");
      return res.json();
    },
    enabled: !!selectedTask?.agentId,
  });

  // Get task messages
  const { 
    data: taskMessages, 
    isLoading: isLoadingMessages 
  } = useQuery({
    queryKey: ["/api/tasks", selectedTask?.id, "messages"],
    queryFn: async () => {
      if (!selectedTask?.id) return [];
      const res = await fetch(`/api/tasks/${selectedTask.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch task messages");
      return res.json();
    },
    enabled: !!selectedTask?.id,
  });

  // Filter tasks based on active tab, search query, and time range
  const filteredTasks = tasks?.filter(task => {
    // Filter by status
    if (activeTab !== "all" && task.status !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by time range
    if (timeRange !== "all") {
      const taskDate = new Date(task.createdAt);
      const now = new Date();
      
      if (timeRange === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return taskDate >= today;
      } else if (timeRange === "week") {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        return taskDate >= lastWeek;
      } else if (timeRange === "month") {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        return taskDate >= lastMonth;
      }
    }
    
    return true;
  });
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const formatTaskContent = (content: any) => {
    if (!content) return "No result data available";
    
    if (typeof content === "string") {
      return content;
    }
    
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return "Unable to display result data";
    }
  };

  const renderTaskStatus = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = config.icon;
    
    return (
      <div className="flex items-center gap-1.5">
        <StatusIcon className={`h-4 w-4 ${status === "in_progress" ? "animate-spin" : ""}`} />
        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
      </div>
    );
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task History</h1>
            <p className="text-muted-foreground">
              View and manage your AI agent task history
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>

              <Card>
                <CardHeader className="px-4 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Tasks</CardTitle>
                    {!isLoading && (
                      <Badge variant="outline">
                        {filteredTasks?.length || 0} tasks
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <div className="pt-2"><Skeleton className="h-3 w-1/4" /></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTasks?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Activity className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No tasks found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchQuery 
                          ? "Try adjusting your search query"
                          : activeTab !== "all" 
                            ? `No ${activeTab.replace('_', ' ')} tasks found`
                            : "No task history available"}
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y">
                        {filteredTasks?.map((task) => {
                          const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || statusConfig.pending.icon;
                          const statusColor = statusConfig[task.status as keyof typeof statusConfig]?.color || statusConfig.pending.color;
                          
                          return (
                            <button
                              key={task.id}
                              className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                                selectedTask?.id === task.id ? "bg-muted" : ""
                              }`}
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{task.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {task.description || "No description"}
                                  </p>
                                  <div className="flex items-center mt-2 gap-2">
                                    <Badge variant="outline" className={statusColor}>
                                      <StatusIcon className={`h-3 w-3 mr-1 ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                                      <span className="capitalize">{task.status.replace(/_/g, ' ')}</span>
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </div>

          <div className="md:col-span-2">
            {!selectedTask ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a task to view details</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Click on any task from the list to view its details, including status, 
                    timestamps, and results.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{selectedTask.title}</CardTitle>
                      <CardDescription>
                        {selectedTask.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={statusConfig[selectedTask.status as keyof typeof statusConfig]?.color || statusConfig.pending.color}>
                      {renderTaskStatus(selectedTask.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <Bot className="h-4 w-4" /> Agent
                      </h4>
                      {isLoadingAgentDetails ? (
                        <Skeleton className="h-5 w-28" />
                      ) : (
                        <p className="text-sm">{agentDetails?.name || "Unknown agent"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> Created
                      </h4>
                      <p className="text-sm">
                        {format(new Date(selectedTask.createdAt), "PPp")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> Completed
                      </h4>
                      <p className="text-sm">
                        {selectedTask.completedAt 
                          ? format(new Date(selectedTask.completedAt), "PPp")
                          : "Not completed"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-md font-medium">Result</h4>
                    {selectedTask.status === "in_progress" ? (
                      <div className="p-4 rounded-md bg-muted flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Task in progress</span>
                        </div>
                      </div>
                    ) : selectedTask.status === "pending" ? (
                      <div className="p-4 rounded-md bg-muted flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Task pending</span>
                        </div>
                      </div>
                    ) : selectedTask.status === "failed" ? (
                      <div className="p-4 rounded-md bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Task failed</p>
                            <p className="text-sm mt-1">{formatTaskContent(selectedTask.result)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-md bg-muted font-mono text-sm overflow-auto max-h-[300px]">
                        <pre className="whitespace-pre-wrap">{formatTaskContent(selectedTask.result)}</pre>
                      </div>
                    )}
                  </div>
                  
                  {/* Task Messages Section */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium">Messages</h4>
                    {isLoadingMessages ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : !taskMessages || taskMessages.length === 0 ? (
                      <div className="p-4 rounded-md bg-muted text-center">
                        <p className="text-muted-foreground">No messages for this task</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {taskMessages.map((message, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-md ${
                              message.role === "system" 
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400" 
                                : message.role === "assistant" 
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400" 
                                  : "bg-muted"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-medium uppercase">
                                {message.role}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), "p")}
                              </span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}