import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Task, Message, Agent } from "@shared/schema";
import { format } from "date-fns";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  Eye, 
  X, 
  Clock, 
  Filter, 
  ArrowUpDown, 
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock8
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function TaskHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskMessages, setTaskMessages] = useState<Message[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Get tasks data
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks 
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Get agents data
  const { 
    data: agents = [], 
    isLoading: isLoadingAgents 
  } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  // Get task messages
  const fetchTaskMessages = async (taskId: number) => {
    try {
      const res = await apiRequest("GET", `/api/tasks/${taskId}/messages`);
      const data = await res.json();
      setTaskMessages(data);
      return data;
    } catch (error) {
      toast({
        title: "Failed to load messages",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  // Rerun task mutation
  const rerunTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // In a real implementation, we'd make an API call to rerun the task
      // For now, we'll simulate it by cloning the task
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const res = await apiRequest("POST", "/api/tasks", {
        userId: user!.id,
        agentId: task.agentId,
        title: `Rerun: ${task.title}`,
        description: task.description,
      });
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task rerun initiated",
        description: "The task has been queued to run again",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to rerun task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle viewing task details
  const handleViewTask = async (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
    await fetchTaskMessages(task.id);
  };

  // Handle rerunning a task
  const handleRerunTask = (taskId: number) => {
    rerunTaskMutation.mutate(taskId);
  };

  // Filter tasks based on search term, status, and agent
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    const matchesAgent = agentFilter === 'all' || task.agentId.toString() === agentFilter;
    
    return matchesSearch && matchesStatus && matchesAgent;
  });

  // Get agent name by ID
  const getAgentName = (agentId: number): string => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  // Get agent icon by agent ID
  const getAgentIcon = (agentId: number): string => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return 'robot';
    
    switch (agent.type) {
      case 'email':
        return 'envelope';
      case 'wordpress':
        return 'wordpress-simple';
      case 'google':
        return 'google';
      default:
        return 'robot';
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "running":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "pending":
      case "running":
        return <Clock8 className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Loading state
  if (isLoadingTasks || isLoadingAgents) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Task History"
      subtitle="View and manage your AI agent tasks"
    >
      {/* Filters & search bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-auto flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>{statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>{agentFilter === 'all' ? 'All Agents' : getAgentName(parseInt(agentFilter))}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle>Task History</CardTitle>
          <CardDescription>
            View and manage all tasks executed by your AI agents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <div className="flex items-center gap-1">
                    Task
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>Sort A-Z</DropdownMenuItem>
                        <DropdownMenuItem>Sort Z-A</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Date
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>Newest First</DropdownMenuItem>
                        <DropdownMenuItem>Oldest First</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500">{task.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-500 rounded-md flex items-center justify-center text-white">
                          <i className={`fa-${getAgentIcon(task.agentId) === 'wordpress-simple' ? 'brands' : 'solid'} fa-${getAgentIcon(task.agentId)} text-xs`}></i>
                        </div>
                        <span>{getAgentName(task.agentId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(task.status)}
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.completedAt 
                        ? format(new Date(task.completedAt), "MMM d, yyyy h:mm a")
                        : format(new Date(task.createdAt), "MMM d, yyyy h:mm a")
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewTask(task)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Task Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRerunTask(task.id)}
                                disabled={rerunTaskMutation.isPending}
                              >
                                {rerunTaskMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rerun Task</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {task.result && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download Results</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <Clock className="h-10 w-10 text-gray-300 mb-2" />
                      {searchTerm || statusFilter !== 'all' || agentFilter !== 'all' ? (
                        <>
                          <p className="font-medium text-gray-700">No tasks found with the current filters</p>
                          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                              setAgentFilter('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700">No tasks found</p>
                          <p className="text-gray-500 text-sm">Your agent tasks will appear here</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-4"
                            onClick={() => window.location.href = '/'}
                          >
                            Create a Task
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
        <CardFooter className="border-t p-4 flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </CardFooter>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Task Details</span>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            {selectedTask && (
              <DialogDescription>
                {selectedTask.title}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedTask.status)}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedTask.status)}`}>
                      {selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Agent</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-500 rounded-md flex items-center justify-center text-white">
                      <i className={`fa-${getAgentIcon(selectedTask.agentId) === 'wordpress-simple' ? 'brands' : 'solid'} fa-${getAgentIcon(selectedTask.agentId)} text-xs`}></i>
                    </div>
                    <span>{getAgentName(selectedTask.agentId)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{format(new Date(selectedTask.createdAt), "MMMM d, yyyy h:mm a")}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p>
                    {selectedTask.completedAt 
                      ? format(new Date(selectedTask.completedAt), "MMMM d, yyyy h:mm a")
                      : 'Not completed yet'}
                  </p>
                </div>
              </div>
              
              {selectedTask.description && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">Conversation</p>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export Chat
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto bg-gray-50">
                  {taskMessages.length > 0 ? (
                    <div className="space-y-4">
                      {taskMessages.map((message, index) => (
                        <div 
                          key={message.id || index} 
                          className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2 flex-shrink-0">
                              <i className="fa-solid fa-robot text-xs"></i>
                            </div>
                          )}
                          
                          <div className={`${
                            message.role === 'user' 
                              ? 'bg-primary-50 text-primary-800 rounded-lg rounded-tr-none'
                              : 'bg-white border rounded-lg rounded-tl-none'
                          } p-3 max-w-[70%] shadow-sm`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs text-gray-400 mt-1 text-right">
                              {format(new Date(message.createdAt), "h:mm a")}
                            </p>
                          </div>
                          
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                              <span className="text-xs font-medium text-gray-600">
                                {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.username?.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No messages found for this task</p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedTask.result && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Results</p>
                  <div className="border rounded-lg p-4 bg-white">
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleRerunTask(selectedTask!.id)}
              disabled={rerunTaskMutation.isPending}
            >
              {rerunTaskMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Rerun Task
            </Button>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
