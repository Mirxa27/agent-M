import { Task } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, RefreshCw } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  isLoading?: boolean;
  onViewTask?: (taskId: number) => void;
  onRerunTask?: (taskId: number) => void;
}

export default function TaskTable({ tasks, isLoading, onViewTask, onRerunTask }: TaskTableProps) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No tasks found.</p>
      </div>
    );
  }

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case "email":
        return "envelope";
      case "wordpress":
        return "wordpress-simple";
      case "google":
        return "google";
      default:
        return "robot";
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case "email":
        return "bg-primary-500";
      case "wordpress":
        return "bg-secondary";
      case "google":
        return "bg-blue-500";
      default:
        return "bg-purple-500";
    }
  };

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Recent Tasks</h3>
          <a href="/tasks" className="text-primary text-sm font-medium hover:text-primary-600">View All</a>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[400px]">Task</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-xs text-gray-500">{task.description}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-6 w-6 bg-blue-500 rounded-md flex items-center justify-center text-white">
                      <i className={`fa-${task.agentId === 2 ? 'brands' : 'solid'} fa-${getAgentIcon(task.agentId === 1 ? 'email' : task.agentId === 2 ? 'wordpress' : 'google')} text-xs`}></i>
                    </div>
                    <div className="ml-2 text-sm text-gray-900">
                      {task.agentId === 1 ? 'Email Assistant' : task.agentId === 2 ? 'WordPress Manager' : 'Google Workspace'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {task.completedAt
                    ? format(new Date(task.completedAt), "MMM d, h:mm a")
                    : format(new Date(task.createdAt), "MMM d, h:mm a")}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onViewTask && onViewTask(task.id)}
                            className="text-primary hover:text-primary-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Task</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onRerunTask && onRerunTask(task.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rerun Task</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
