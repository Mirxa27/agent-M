import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Bot, FileText, Key, Users, PlusCircle, Activity, BarChart2, Clock, Calendar, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivity, Analytics } from "../../../shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Good day");
  const [period, setPeriod] = useState("week"); // 'day', 'week', 'month'
  
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

  // Fetch user activities
  const {
    data: userActivities,
    isLoading: isLoadingActivities
  } = useQuery({
    queryKey: ["/api/user-activities", { limit: 10 }],
    queryFn: async () => {
      const res = await fetch("/api/user-activities?limit=10");
      
      // For temporary implementation, use placeholder data
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 1000 * 60 * 60);
      const halfHourAgo = new Date(now.getTime() - 1000 * 60 * 30);
      
      const activities: UserActivity[] = [
        {
          id: 1,
          userId: user?.id || 0,
          activityType: "login",
          resourceId: null,
          resourceType: null,
          metadata: {},
          createdAt: now
        },
        {
          id: 2, 
          userId: user?.id || 0,
          activityType: "agent_created",
          resourceId: 1,
          resourceType: "agent",
          metadata: { name: "Email Assistant" },
          createdAt: hourAgo
        },
        {
          id: 3,
          userId: user?.id || 0,
          activityType: "task_created",
          resourceId: 1,
          resourceType: "task",
          metadata: { title: "Process emails" },
          createdAt: halfHourAgo
        }
      ];
      
      return activities;
    },
    enabled: !!user
  });

  // Fetch analytics data
  const {
    data: analytics,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ["/api/analytics", { period }],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      
      // For temporary implementation, use placeholder data
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
      
      const analyticsData: Analytics = {
        id: 1,
        userId: user?.id || 0,
        period,
        periodStart: weekAgo,
        periodEnd: now,
        taskCount: 15,
        successfulTaskCount: 12,
        failedTaskCount: 3,
        tokenUsage: 25000,
        mostUsedAgentId: 1,
        mostUsedToolType: "openai",
        averageCompletionTime: 45, // seconds
        metadata: {},
        createdAt: now
      };
      
      return analyticsData;
    },
    enabled: !!user
  });

  const isLoading = isLoadingAgents || isLoadingCredentials || isLoadingFiles || isLoadingTasks || isLoadingActivities || isLoadingAnalytics;

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
          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Task completion rate and usage statistics</CardDescription>
              <Tabs defaultValue="week" className="w-full">
                <TabsList className="grid w-full max-w-xs grid-cols-3">
                  <TabsTrigger value="day" onClick={() => setPeriod("day")}>Day</TabsTrigger>
                  <TabsTrigger value="week" onClick={() => setPeriod("week")}>Week</TabsTrigger>
                  <TabsTrigger value="month" onClick={() => setPeriod("month")}>Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-background border-none shadow-none">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold">{analytics?.taskCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Total tasks this {period}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background border-none shadow-none">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {analytics ? (
                      <>
                        <div className="text-2xl font-bold">
                          {Math.round((analytics.successfulTaskCount / analytics.taskCount) * 100)}%
                        </div>
                        <Progress 
                          value={(analytics.successfulTaskCount / analytics.taskCount) * 100} 
                          className="mt-2 h-1.5" 
                        />
                      </>
                    ) : (
                      <div className="text-2xl font-bold">-</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Task success rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background border-none shadow-none">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">Average Time</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {analytics?.averageCompletionTime ? (
                        `${analytics.averageCompletionTime}s`
                      ) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. completion time
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background border-none shadow-none">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold">
                      {analytics?.tokenUsage ? (
                        `${Math.round(analytics.tokenUsage / 1000)}K`
                      ) : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total tokens used
                    </p>
                  </CardContent>
                </Card>
              </div>

              {analytics && (
                <div className="mt-6 pl-3">
                  <h4 className="text-sm font-medium mb-2">Task Distribution</h4>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Successful</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{analytics.successfulTaskCount}</span>
                      <div className="w-32 h-2 bg-muted overflow-hidden rounded-full">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${(analytics.successfulTaskCount / analytics.taskCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span>Failed</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{analytics.failedTaskCount}</span>
                      <div className="w-32 h-2 bg-muted overflow-hidden rounded-full">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${(analytics.failedTaskCount / analytics.taskCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>
                  Your latest agent tasks and status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTasks && recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task: any) => (
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
              <CardFooter className="pt-0">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/task-history">
                    View All Tasks
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* User Activities */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Your recent activity on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userActivities && userActivities.length > 0 ? (
                  <div className="space-y-4">
                    {userActivities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <div className="rounded-full p-2 bg-primary/10 text-primary">
                          {activity.activityType === "login" && <Users className="h-4 w-4" />}
                          {activity.activityType === "agent_created" && <Bot className="h-4 w-4" />}
                          {activity.activityType === "task_created" && <Activity className="h-4 w-4" />}
                          {activity.activityType === "credential_added" && <Key className="h-4 w-4" />}
                          {activity.activityType === "file_uploaded" && <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.activityType === "login" && "Logged in to the platform"}
                            {activity.activityType === "agent_created" && (
                              <>Created new agent <span className="font-semibold">{(activity.metadata as any)?.name}</span></>
                            )}
                            {activity.activityType === "task_created" && (
                              <>Created new task <span className="font-semibold">{(activity.metadata as any)?.title}</span></>
                            )}
                            {activity.activityType === "credential_added" && "Added new credential"}
                            {activity.activityType === "file_uploaded" && "Uploaded new file"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No activity yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your recent actions will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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