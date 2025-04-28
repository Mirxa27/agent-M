import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Loader2, Users, Bot, Zap, CreditCard, Key, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import AiProvidersPanel from "@/components/admin/ai-providers-panel";
import AiModelsPanel from "@/components/admin/ai-models-panel";
import AiPromptsPanel from "@/components/admin/ai-prompts-panel";
import UsersPanel from "@/components/admin/users-panel";
import PlansPanel from "@/components/admin/plans-panel";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Protect admin routes
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const stats = [
    {
      title: "Total Users",
      value: "247",
      icon: <Users className="h-4 w-4" />,
      change: "+12% from last month",
      positive: true,
    },
    {
      title: "Active Agents",
      value: "1,203",
      icon: <Bot className="h-4 w-4" />,
      change: "+49% from last month",
      positive: true,
    },
    {
      title: "Tasks Executed",
      value: "8,732",
      icon: <Zap className="h-4 w-4" />,
      change: "+24% from last month",
      positive: true,
    },
    {
      title: "MRR",
      value: "12,350 SAR",
      icon: <CreditCard className="h-4 w-4" />,
      change: "+18% from last month",
      positive: true,
    },
  ];

  return (
    <DashboardLayout 
      title="Admin Dashboard"
      subtitle="Manage all aspects of your Mirxa.io platform"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-background border border-muted w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ai-providers">AI Providers</TabsTrigger>
          <TabsTrigger value="ai-models">AI Models</TabsTrigger>
          <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full flex justify-between items-center">
                  <span>Add New AI Provider</span>
                  <Key className="h-4 w-4" />
                </Button>
                <Button className="w-full flex justify-between items-center">
                  <span>Configure New AI Model</span>
                  <Bot className="h-4 w-4" />
                </Button>
                <Button className="w-full flex justify-between items-center">
                  <span>Create New Pricing Plan</span>
                  <CreditCard className="h-4 w-4" />
                </Button>
                <Button className="w-full flex justify-between items-center">
                  <span>View System Logs</span>
                  <Search className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>API Service</span>
                  <span className="text-green-500 font-medium">Operational</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '98%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Database</span>
                  <span className="text-green-500 font-medium">Operational</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '99%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>AI Service Connections</span>
                  <span className="text-green-500 font-medium">Operational</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '96%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>File Storage</span>
                  <span className="text-green-500 font-medium">Operational</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '97%' }}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>

        {/* AI Providers Tab */}
        <TabsContent value="ai-providers">
          <AiProvidersPanel />
        </TabsContent>

        {/* AI Models Tab */}
        <TabsContent value="ai-models">
          <AiModelsPanel />
        </TabsContent>

        {/* AI Prompts Tab */}
        <TabsContent value="ai-prompts">
          <AiPromptsPanel />
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PlansPanel />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}