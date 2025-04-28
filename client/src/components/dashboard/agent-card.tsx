import { Agent } from "@shared/schema";
import { Link } from "wouter";
import { 
  MoreVertical,
  Settings,
  MessageSquare,
  Zap,
  Key
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface AgentCardProps {
  agent: Agent;
  onNewTask?: (agentId: number) => void;
}

export default function AgentCard({ agent, onNewTask }: AgentCardProps) {
  const getIconByType = (type: string) => {
    switch (type) {
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

  const getColorByType = (type: string) => {
    switch (type) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <span className={`w-10 h-10 rounded-lg ${getColorByType(agent.type)} flex items-center justify-center text-white mr-3`}>
              <i className={`fa-${agent.type === "wordpress" ? "brands" : "solid"} fa-${getIconByType(agent.type)}`}></i>
            </span>
            <div>
              <h3 className="font-medium text-dark-900">{agent.name}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                {agent.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-400 hover:text-gray-500">
              <MoreVertical className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit Agent</DropdownMenuItem>
              <DropdownMenuItem>View Tasks</DropdownMenuItem>
              <DropdownMenuItem>
                {agent.isActive ? "Deactivate Agent" : "Activate Agent"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete Agent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          {agent.description}
        </p>
        
        <div className="flex items-center text-xs text-gray-500">
          <span className="flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            {agent.taskCount} tasks
          </span>
          <span className="mx-2">•</span>
          <span className="flex items-center">
            <Key className="h-3 w-3 mr-1" />
            {agent.config?.credentialCount || 0} credentials
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 flex justify-between">
        <Link 
          to={`/agents/${agent.id}/configure`}
          className="text-sm text-gray-700 font-medium hover:text-primary-600 flex items-center"
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Configure
        </Link>
        <button 
          onClick={() => onNewTask && onNewTask(agent.id)}
          className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center"
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          New Task
        </button>
      </div>
    </div>
  );
}
