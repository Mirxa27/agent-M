import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DashboardWidgets as EnhancedDashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MainLayout } from "@/components/layouts/main-layout";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ActivityIcon,
  AlertCircleIcon,
  BarChart2Icon,
  CheckCircleIcon,
  ClockIcon,
  FilesIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  PackageIcon,
  SettingsIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";

// Component to display activity feed item
const ActivityItem = ({ activity }: { activity: any }) => {
  // Helper to get appropriate icon
  const getIcon = () => {
    switch (activity.activityType) {
      case "login":
        return <UserIcon className="w-4 h-4 text-blue-500" />;
      case "agent_created":
        return <PackageIcon className="w-4 h-4 text-green-500" />;
      case "task_created":
        return <FilesIcon className="w-4 h-4 text-orange-500" />;
      case "task_completed":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "credential_created":
        return <ActivityIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper to get formatted message
  const getMessage = () => {
    switch (activity.activityType) {
      case "login":
        return "Logged in to the platform";
      case "agent_created":
        return `Created a new agent${activity.metadata?.name ? `: ${activity.metadata.name}` : ""}`;
      case "task_created":
        return `Created a new task${activity.metadata?.title ? `: ${activity.metadata.title}` : ""}`;
      case "task_completed":
        return `Completed a task${activity.metadata?.title ? `: ${activity.metadata.title}` : ""}`;
      case "credential_created":
        return `Created a new credential${activity.metadata?.name ? ` for ${activity.metadata.name}` : ""}`;
      default:
        return activity.activityType.replace(/_/g, " ");
    }
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className="p-1.5 bg-gray-50 rounded-full">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{getMessage()}</div>
        <div className="text-xs text-gray-500">
          {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </div>
      </div>
    </div>
  );
};

// Component to display user activity feed
const ActivityFeed = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/user/activity"],
    retry: 1,
    enabled: !!user, // Only run query if user is logged in
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-gray-500">Failed to load activity data.</p>
      </div>
    );
  }

  // Ensure we have a valid array, even if the API returns an empty object
  const activities = Array.isArray(data) ? data : [];

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <ActivityIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-500">No activities yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-1">
        {activities.map((activity: any) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  );
};

// Component to display user statistics
const UserStats = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/user/analytics"],
    retry: 1,
    enabled: !!user, // Only run query if user is logged in
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  // Default analytics data
  const defaultAnalytics = {
    taskCount: 0,
    successfulTaskCount: 0,
    failedTaskCount: 0,
    tokenUsage: 0,
    mostUsedAgent: null,
    averageCompletionTime: null,
  };

  // Safely extract analytics data with fallbacks
  const analytics =
    data && typeof data === "object" && data.thisMonth
      ? { ...defaultAnalytics, ...data.thisMonth }
      : defaultAnalytics;

  const previousMonth =
    data && typeof data === "object" && data.previousMonth
      ? data.previousMonth
      : null;

  // Helper function to get trend indicator
  const getTrendIndicator = (current: number, previous: number | undefined) => {
    if (!previous) return null;

    const diff = current - previous;
    const percentage =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Math.round((diff / previous) * 100);

    if (percentage === 0) return null;

    return (
      <Badge
        variant={percentage > 0 ? "success" : "destructive"}
        className="ml-2"
      >
        {percentage > 0 ? "+" : ""}
        {percentage}%
      </Badge>
    );
  };

  // Chart data for tasks
  const taskData = [
    {
      name: "Successful",
      value: analytics.successfulTaskCount || 0,
      color: "#10b981",
    },
    { name: "Failed", value: analytics.failedTaskCount || 0, color: "#ef4444" },
    {
      name: "Pending",
      value:
        (analytics.taskCount || 0) -
        ((analytics.successfulTaskCount || 0) +
          (analytics.failedTaskCount || 0)),
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">
                {analytics.taskCount || 0}
              </span>
              {getTrendIndicator(
                analytics.taskCount || 0,
                previousMonth?.taskCount,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">
                {analytics.successfulTaskCount || 0}
              </span>
              {getTrendIndicator(
                analytics.successfulTaskCount || 0,
                previousMonth?.successfulTaskCount,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">
                {analytics.tokenUsage || 0}
              </span>
              {getTrendIndicator(
                analytics.tokenUsage || 0,
                previousMonth?.tokenUsage,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {analytics.mostUsedAgent ? "Most Used Agent" : "Agent Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.mostUsedAgent ? (
              <span className="text-lg font-medium">
                {analytics.mostUsedAgent}
              </span>
            ) : (
              <span className="text-lg font-medium text-gray-500">
                No agents used yet
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {taskData.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={taskData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {taskData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [value, "Tasks"]}
              labelFormatter={() => ""}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </>
  );
};

// Component to display dashboard widgets
const DashboardWidgets = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch dashboard preferences
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/user/dashboard/preferences"],
    retry: 1,
    enabled: !!user, // Only run query if user is logged in
  });

  // Update dashboard preferences
  const { mutate: updatePreferences } = useMutation({
    mutationFn: (updates: any) =>
      apiRequest("PATCH", "/api/user/dashboard/preferences", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/user/dashboard/preferences"],
      });
      toast({
        title: "Dashboard Updated",
        description: "Your dashboard preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update dashboard preferences.",
      });
    },
  });

  // Handle widget toggle
  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    if (!data) return;

    const updatedWidgets = data.widgets.map((widget: any) =>
      widget.id === widgetId ? { ...widget, enabled } : widget,
    );

    updatePreferences({ widgets: updatedWidgets });
  };

  // Handle layout change
  const handleLayoutChange = (columns: number) => {
    if (!data) return;

    updatePreferences({
      layout: {
        ...data.layout,
        columns,
      },
    });
  };

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    if (!data) return;

    updatePreferences({ theme });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircleIcon className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-gray-500">Failed to load dashboard preferences.</p>
      </div>
    );
  }

  // Ensure we have valid data structure if API returns unexpected format
  const defaultPreferences = {
    layout: { columns: 2, showWelcome: true },
    widgets: [
      { id: "activity", position: 0, enabled: true },
      { id: "stats", position: 1, enabled: true },
      { id: "quickActions", position: 2, enabled: true },
      { id: "agentStatus", position: 3, enabled: true },
    ],
    theme: "system",
  };

  // Data validation and fallback
  const preferences =
    data && typeof data === "object"
      ? {
          ...defaultPreferences,
          ...data,
          // Ensure layout structure
          layout: {
            ...defaultPreferences.layout,
            ...(data.layout || {}),
          },
          // Ensure widgets array
          widgets: Array.isArray(data.widgets)
            ? data.widgets
            : defaultPreferences.widgets,
        }
      : defaultPreferences;

  return (
    <>
      {preferences.layout.showWelcome && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.fullName || "User"}!
                </h2>
                <p className="text-gray-600 max-w-md">
                  Here's an overview of your activity and platform usage.
                  Customize your dashboard with the options below.
                </p>
              </div>
              <LayoutDashboardIcon className="h-12 w-12 text-blue-400 opacity-75" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Dashboard Settings</h2>
          <p className="text-sm text-gray-500">
            Customize how your dashboard looks and feels
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="welcome-toggle">Show Welcome</Label>
            <Switch
              id="welcome-toggle"
              checked={preferences.layout.showWelcome}
              onCheckedChange={(checked) => {
                updatePreferences({
                  layout: {
                    ...preferences.layout,
                    showWelcome: checked,
                  },
                });
              }}
            />
          </div>

          <div>
            <Label htmlFor="layout-select" className="mr-2">
              Layout
            </Label>
            <Select
              value={preferences.layout.columns.toString()}
              onValueChange={(value) => handleLayoutChange(parseInt(value))}
            >
              <SelectTrigger id="layout-select" className="w-[120px]">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Single column</SelectItem>
                <SelectItem value="2">Two columns</SelectItem>
                <SelectItem value="3">Three columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme-select" className="mr-2">
              Theme
            </Label>
            <Select value={preferences.theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme-select" className="w-[120px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Widgets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {preferences.widgets.map((widget: any) => (
            <div key={widget.id} className="flex items-center space-x-2">
              <Switch
                id={`widget-${widget.id}`}
                checked={widget.enabled}
                onCheckedChange={(checked) =>
                  handleWidgetToggle(widget.id, checked)
                }
              />
              <Label htmlFor={`widget-${widget.id}`} className="capitalize">
                {widget.id.replace(/([A-Z])/g, " $1")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          preferences.layout.columns === 1
            ? "grid-cols-1"
            : preferences.layout.columns === 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {preferences.widgets.find(
          (w: any) => w.id === "activity" && w.enabled,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        )}

        {preferences.widgets.find(
          (w: any) => w.id === "stats" && w.enabled,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2Icon className="h-5 w-5" />
                <span>Analytics</span>
              </CardTitle>
              <CardDescription>Your platform usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <UserStats />
            </CardContent>
          </Card>
        )}

        {preferences.widgets.find(
          (w: any) => w.id === "quickActions" && w.enabled,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <PackageIcon className="h-5 w-5" />
                  <span>New Agent</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <FilesIcon className="h-5 w-5" />
                  <span>Create Task</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <ActivityIcon className="h-5 w-5" />
                  <span>Add Credential</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {preferences.widgets.find(
          (w: any) => w.id === "agentStatus" && w.enabled,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon className="h-5 w-5" />
                <span>Agent Status</span>
              </CardTitle>
              <CardDescription>Current state of your agents</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                This feature will be available soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

// Main dashboard page
const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto relative z-10 glass-effect-container rounded-xl backdrop-blur-sm border border-white/10 shadow-xl">
      <Tabs defaultValue="dashboard">
        <div className="glass-card-header relative overflow-hidden rounded-lg px-6 py-4 backdrop-blur-sm border border-white/10 group hover:shadow-lg transition-shadow duration-300 mb-6 flex items-center justify-between flex-col sm:flex-row gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md"></div>
          <h1 className="text-3xl font-bold text-high-contrast text-shadow-md relative z-10">Your Dashboard</h1>
          <TabsList className="glass-effect-lighter backdrop-blur-sm border border-white/20 relative z-10">
            <TabsTrigger value="dashboard" className="text-shadow-sm data-[state=active]:bg-primary/30 data-[state=active]:text-white">
              <LayoutDashboardIcon className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-shadow-sm data-[state=active]:bg-primary/30 data-[state=active]:text-white">
              <ActivityIcon className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-shadow-sm data-[state=active]:bg-primary/30 data-[state=active]:text-white">
              <BarChart2Icon className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-0">
          <EnhancedDashboardWidgets />
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <Card className="glass-effect-lighter border border-white/10 shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="text-high-contrast text-shadow-md">Recent Activity</CardTitle>
              <CardDescription className="text-white/90 text-shadow-sm">
                A log of your recent actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card className="glass-effect-lighter border border-white/10 shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="text-high-contrast text-shadow-md">Usage Analytics</CardTitle>
              <CardDescription className="text-white/90 text-shadow-sm">
                Detailed metrics about your platform usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
