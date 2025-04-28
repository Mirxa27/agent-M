import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Agent } from "@shared/schema";
import {
  Bot,
  Sparkles,
  FileText,
  BrainCircuit,
  Settings,
  PlusCircle,
  Search,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AgentList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [, navigate] = useLocation();

  // Fetch agents
  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/agents");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch agents");
      }
      return res.json();
    },
  });

  // Fetch the last task for each agent
  const {
    data: lastTasks = {},
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ["/api/agents/last-tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/agents/last-tasks");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch last tasks");
      }
      return res.json();
    },
  });

  // Filter agents based on search query and type
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || agent.type === filterType;

    return matchesSearch && matchesType;
  });

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "name":
        return a.name.localeCompare(b.name);
      case "active":
        return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      default:
        return 0;
    }
  });

  // Get icon component based on agent type
  const getAgentIcon = (type: string) => {
    switch (type) {
      case "assistant":
        return <Bot className="h-5 w-5" />;
      case "researcher":
        return <Sparkles className="h-5 w-5" />;
      case "writer":
        return <FileText className="h-5 w-5" />;
      case "analyzer":
        return <BrainCircuit className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Handle creating a new agent
  const handleCreateAgent = () => {
    navigate("/agents/create");
  };

  // Handle clicking an agent card
  const handleAgentClick = (agentId: number) => {
    navigate(`/agents/${agentId}`);
  };

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load agents:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Your intelligent AI assistants that can automate tasks
          </p>
        </div>
        <Button onClick={handleCreateAgent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="researcher">Researcher</SelectItem>
              <SelectItem value="writer">Writer</SelectItem>
              <SelectItem value="analyzer">Analyzer</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="active">Active First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-1" />
                <Skeleton className="h-4 w-5/6 mt-1" />
              </CardContent>
              <CardFooter className="border-t pt-3 flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAgents.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">No agents found</h3>
              {searchQuery || filterType !== "all" ? (
                <p className="text-muted-foreground text-center max-w-md">
                  No agents match your search criteria. Try adjusting your
                  filters or create a new agent.
                </p>
              ) : (
                <p className="text-muted-foreground text-center max-w-md">
                  You haven't created any agents yet. Get started by creating
                  your first AI agent.
                </p>
              )}
              <Button onClick={handleCreateAgent} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </div>
          ) : (
            sortedAgents.map((agent) => {
              const lastTask = lastTasks[agent.id];
              return (
                <Card
                  key={agent.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${!agent.isActive ? "opacity-70" : ""}`}
                  onClick={() => handleAgentClick(agent.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-full ${agent.isActive ? "bg-primary/10" : "bg-muted"}`}
                        >
                          {getAgentIcon(agent.type)}
                        </div>
                        <div>
                          <h3 className="font-medium line-clamp-1">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {agent.type}
                          </p>
                        </div>
                      </div>
                      {!agent.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {agent.description}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex items-center justify-between">
                    {lastTask ? (
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">
                          Last task:
                        </span>
                        <div className="flex items-center gap-1">
                          {getTaskStatusIcon(lastTask.status)}
                          <span className="line-clamp-1 max-w-[100px]">
                            {lastTask.title}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No tasks yet
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
