import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bot, FileText, Key, Users, PlusCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good day");
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Fetch agents
  const { 
    data: agents,
    isLoading: isLoadingAgents
  } = useQuery({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    }
  });

  // Fetch credentials
  const { 
    data: credentials,
    isLoading: isLoadingCredentials
  } = useQuery({
    queryKey: ["/api/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/credentials");
      if (!res.ok) throw new Error("Failed to fetch credentials");
      return res.json();
    }
  });

  // Fetch files
  const { 
    data: files,
    isLoading: isLoadingFiles
  } = useQuery({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    }
  });

  // Fetch recent tasks
  const { 
    data: recentTasks,
    isLoading: isLoadingTasks
  } = useQuery({
    queryKey: ["/api/tasks", { limit: 5 }],
    queryFn: async () => {
      const res = await fetch("/api/tasks?limit=5");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    }
  });

  const isLoading = isLoadingAgents || isLoadingCredentials || isLoadingFiles || isLoadingTasks;

  return (
    <div className="container py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}, {user?.fullName.split(' ')[0]}</h1>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Here's what's happening with your agents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/agents">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Agents
                </CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Your personal AI assistants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Credentials
                </CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credentials?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Securely stored API keys and tokens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Files & Templates
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{files?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Documents and reusable templates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest agent tasks and status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTasks && recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-center gap-2">
                          <Activity className={`h-5 w-5 ${
                            task.status === "completed" ? "text-green-500" :
                            task.status === "failed" ? "text-red-500" :
                            task.status === "in_progress" ? "text-blue-500" :
                            "text-yellow-500"
                          }`} />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(task.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="capitalize">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            task.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" :
                            task.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400" :
                            task.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                          }`}>
                            {task.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Activity className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No recent tasks</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first agent task to get started
                    </p>
                    <Button asChild size="sm">
                      <Link href="/agents">
                        View Your Agents
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/agents">
                      <Bot className="mr-2 h-4 w-4" />
                      Manage Agents
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/credentials">
                      <Key className="mr-2 h-4 w-4" />
                      Add Credentials
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/files">
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Files
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/task-history">
                      <Activity className="mr-2 h-4 w-4" />
                      View History
                    </Link>
                  </Button>
                  
                  {user?.role === "admin" && (
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/admin">
                        <Users className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}