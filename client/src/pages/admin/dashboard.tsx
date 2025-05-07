import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users2Icon,
  ServerIcon,
  BrainCircuitIcon,
  MessageSquareTextIcon,
  CreditCardIcon,
  Settings2Icon, // Added
  PaletteIcon,   // Added
  LanguagesIcon, // Added
  WrenchIcon,    // Added
} from "lucide-react";

// Import admin panels
import AiProvidersPanel from "@/components/admin/ai-providers-panel";
import AiModelsPanel from "@/components/admin/ai-models-panel";
import AiPromptsPanel from "@/components/admin/ai-prompts-panel";
import UsersPanel from "@/components/admin/users-panel";
import PlansPanel from "@/components/admin/plans-panel";
import FineTuningPanel from "@/components/admin/fine-tuning-panel"; // Added
import SiteEditorPanel from "@/components/admin/site-editor-panel"; // Added
import TranslationsPanel from "@/components/admin/translations-panel"; // Added
import { AgentToolsPanel } from "@/components/admin/fixed-agent-tools-panel"; // Added

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  // Redirect if user is not an admin
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, AI settings, site content, and application configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            {/* Adjust grid columns for more tabs, e.g., grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 or use scrollable container */}
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 w-full">
              <TabsTrigger
                value="users"
                className="flex items-center space-x-2"
              >
                <Users2Icon className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="providers"
                className="flex items-center space-x-2"
              >
                <ServerIcon className="h-4 w-4" />
                <span>AI Providers</span>
              </TabsTrigger>
              <TabsTrigger
                value="models"
                className="flex items-center space-x-2"
              >
                <BrainCircuitIcon className="h-4 w-4" />
                <span>AI Models</span>
              </TabsTrigger>
              <TabsTrigger
                value="prompts"
                className="flex items-center space-x-2"
              >
                <MessageSquareTextIcon className="h-4 w-4" />
                <span>AI Prompts</span>
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="flex items-center space-x-2"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span>Plans</span>
              </TabsTrigger>
              <TabsTrigger
                value="agent-tools"
                className="flex items-center space-x-2"
              >
                <WrenchIcon className="h-4 w-4" />
                <span>Agent Tools</span>
              </TabsTrigger>
              <TabsTrigger
                value="site-editor"
                className="flex items-center space-x-2"
              >
                <PaletteIcon className="h-4 w-4" />
                <span>Site Editor</span>
              </TabsTrigger>
              <TabsTrigger
                value="translations"
                className="flex items-center space-x-2"
              >
                <LanguagesIcon className="h-4 w-4" />
                <span>Translations</span>
              </TabsTrigger>
              <TabsTrigger
                value="fine-tuning"
                className="flex items-center space-x-2"
              >
                <Settings2Icon className="h-4 w-4" />
                <span>Fine-Tuning</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <UsersPanel />
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <AiProvidersPanel />
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <AiModelsPanel />
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <AiPromptsPanel />
            </TabsContent>

            <TabsContent value="plans" className="space-y-4">
              <PlansPanel />
            </TabsContent>

            <TabsContent value="agent-tools" className="space-y-4">
              <AgentToolsPanel />
            </TabsContent>

            <TabsContent value="site-editor" className="space-y-4">
              <SiteEditorPanel />
            </TabsContent>

            <TabsContent value="translations" className="space-y-4">
              <TranslationsPanel />
            </TabsContent>

            <TabsContent value="fine-tuning" className="space-y-4">
              <FineTuningPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
