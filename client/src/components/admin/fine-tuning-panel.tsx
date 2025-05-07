import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added
import { Input } from "@/components/ui/input"; // Added

// Define a type for the settings, this will be expanded based on user requirements
interface TaskModelMapping {
  [taskType: string]: string; // e.g., { summarization: "gpt-4o", generation: "claude-3-opus" }
}

interface ApiKeySettings {
  globalRequestLimit?: number; // e.g., per day or per month
  userPriority?: "low" | "standard" | "high";
  // More complex settings like per-user limits or key pooling can be added later
}

interface RagConfig {
  id: string;
  name: string;
  description?: string;
  modelId?: string; // Associated AI model for this RAG setup
  // Further details like data sources, indexing strategy would go here
}

interface MultiModelConfig {
  replyModel?: string;
  thinkingModel?: string;
  reasoningModel?: string;
  // other specific AI functions
}

interface FineTuningSettings {
  enableAdvancedChatFeatures?: boolean; // Keep this as it's a good example
  defaultModelsForTasks?: TaskModelMapping;
  contentModerationLevel?: "low" | "medium" | "high";
  apiKeyManagement?: ApiKeySettings;
  ragConfigurations?: RagConfig[];
  multiModelStrategy?: MultiModelConfig;
  // Add more settings here as they are defined
}

const FineTuningPanel: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<FineTuningSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current settings when the component mounts
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // const currentSettings = await apiRequest<FineTuningSettings>("GET", "/api/admin/fine-tuning-settings");
        // setSettings(currentSettings);
        // For now, using placeholder data as the API endpoint doesn't exist yet
        setSettings({
          enableAdvancedChatFeatures: true,
          defaultModelsForTasks: {
            summarization: "gpt-4o-mini",
            contentGeneration: "claude-3-haiku",
            generalQuery: "gpt-4o",
          },
          contentModerationLevel: "medium",
          apiKeyManagement: {
            globalRequestLimit: 10000,
            userPriority: "standard",
          },
          ragConfigurations: [{id: "default-rag", name: "Default RAG", description: "General knowledge base"}],
          multiModelStrategy: {
            replyModel: "gpt-4o",
            reasoningModel: "claude-3-opus"
          }
        });
      } catch (error) {
        toast({
          title: "Error fetching settings",
          description: "Could not load current fine-tuning settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSettingChange = (key: keyof FineTuningSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // await apiRequest<FineTuningSettings>("POST", "/api/admin/fine-tuning-settings", settings);
      // For now, just simulating save as the API endpoint doesn't exist yet
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Settings Saved",
        description: "Fine-tuning settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "Could not save fine-tuning settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fine-Tuning Settings</CardTitle>
        <CardDescription>
          Configure application settings for frontend users. (Placeholder - more settings to be added based on requirements)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
          <div>
            <Label htmlFor="enableAdvancedChatFeatures" className="font-semibold">
              Enable Advanced Chat Features
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow users to access advanced chatbot capabilities like summarization and content generation.
            </p>
          </div>
          <Switch
            id="enableAdvancedChatFeatures"
            checked={settings.enableAdvancedChatFeatures ?? false}
            onCheckedChange={(checked) => handleSettingChange("enableAdvancedChatFeatures", checked)}
            disabled={isSaving}
          />
        </div>

        {/* Default Models for Tasks */}
        <div className="space-y-2 p-4 border rounded-lg">
          <Label className="font-semibold">Default AI Models for Tasks</Label>
          <p className="text-sm text-muted-foreground">
            Set the default AI model for specific user tasks. (e.g., 'summarization', 'contentGeneration')
          </p>
          {Object.entries(settings.defaultModelsForTasks || {}).map(([task, model]) => (
            <div key={task} className="flex items-center space-x-2">
              <Label htmlFor={`model-${task}`} className="w-1/3">{task.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Label>
              <Input
                id={`model-${task}`}
                value={model}
                onChange={(e) => handleSettingChange("defaultModelsForTasks", { ...settings.defaultModelsForTasks, [task]: e.target.value })}
                placeholder="e.g., gpt-4o"
                disabled={isSaving}
                className="flex-1"
              />
            </div>
          ))}
          {/* TODO: Add button to add new task-model mapping */}
        </div>

        {/* Content Moderation Level */}
        <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
          <div>
            <Label htmlFor="contentModerationLevel" className="font-semibold">Content Moderation Level</Label>
            <p className="text-sm text-muted-foreground">
              Configure the strictness of content moderation.
            </p>
          </div>
          <Select
            value={settings.contentModerationLevel || "medium"}
            onValueChange={(value: "low" | "medium" | "high") => handleSettingChange("contentModerationLevel", value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key Management */}
        <div className="space-y-2 p-4 border rounded-lg">
          <Label className="font-semibold">API Key Management</Label>
           <p className="text-sm text-muted-foreground">Manage API key usage limits and priorities.</p>
          <div className="flex items-center space-x-2">
            <Label htmlFor="globalRequestLimit" className="w-1/3">Global Request Limit:</Label>
            <Input
              id="globalRequestLimit"
              type="number"
              value={settings.apiKeyManagement?.globalRequestLimit || ""}
              onChange={(e) => handleSettingChange("apiKeyManagement", { ...settings.apiKeyManagement, globalRequestLimit: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 10000"
              disabled={isSaving}
              className="flex-1"
            />
          </div>
           {/* Placeholder for more API key settings */}
        </div>

        {/* RAG Configurations */}
        <div className="space-y-2 p-4 border rounded-lg">
          <Label className="font-semibold">RAG Configurations</Label>
          <p className="text-sm text-muted-foreground">
            Manage Retrieval Augmented Generation setups. (UI for adding/editing RAGs TBD)
          </p>
          {settings.ragConfigurations?.map(rag => (
            <div key={rag.id} className="p-2 border rounded bg-gray-50 dark:bg-gray-800/50">
              <p className="font-medium">{rag.name}</p>
              <p className="text-xs text-muted-foreground">{rag.description || "No description"}</p>
            </div>
          ))}
           {/* TODO: Add UI to create/edit RAG configurations */}
        </div>

        {/* Multi-Model Strategy */}
        <div className="space-y-2 p-4 border rounded-lg">
          <Label className="font-semibold">Multi-Model Strategy</Label>
          <p className="text-sm text-muted-foreground">Configure different AI models for various internal AI functions.</p>
           <div className="flex items-center space-x-2">
            <Label htmlFor="replyModel" className="w-1/3">Reply Model:</Label>
            <Input
              id="replyModel"
              value={settings.multiModelStrategy?.replyModel || ""}
              onChange={(e) => handleSettingChange("multiModelStrategy", { ...settings.multiModelStrategy, replyModel: e.target.value })}
              placeholder="e.g., gpt-4o"
              disabled={isSaving}
              className="flex-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="reasoningModel" className="w-1/3">Reasoning Model:</Label>
            <Input
              id="reasoningModel"
              value={settings.multiModelStrategy?.reasoningModel || ""}
              onChange={(e) => handleSettingChange("multiModelStrategy", { ...settings.multiModelStrategy, reasoningModel: e.target.value })}
              placeholder="e.g., claude-3-opus"
              disabled={isSaving}
              className="flex-1"
            />
          </div>
          {/* TODO: Add more model configuration options */}
        </div>

        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FineTuningPanel;
