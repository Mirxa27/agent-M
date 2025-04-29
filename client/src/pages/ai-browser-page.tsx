import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { 
  Loader2, 
  Settings, 
  PlayCircle, 
  PauseCircle, 
  List, 
  Activity, 
  Save,
  RotateCw 
} from "lucide-react";
import { WorkflowExecutionPanel } from "@/components/workflow/workflow-execution-panel";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define types for our component
type BrowserAction = {
  id: number;
  userId: number;
  sessionId: string;
  actionType: string;
  targetElement: string;
  url: string;
  valueOrText?: string;
  metadata: any;
  timestamp: string;
};

type BrowserSequence = {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isAutomated: boolean;
  triggerType?: string;
  triggerCondition?: any;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  isActive: boolean;
};

type BrowserSequenceStep = {
  id: number;
  sequenceId: number;
  stepOrder: number;
  actionType: string;
  targetElement: string;
  targetUrl?: string;
  valueOrText?: string;
  waitBeforeMs: number;
  waitAfterMs: number;
  isConditional: boolean;
  condition?: any;
  metadata: any;
};

type BrowserAiSuggestion = {
  id: number;
  userId: number;
  sessionId: string;
  suggestionType: string;
  title: string;
  description: string;
  suggestedActions: any[];
  status: string;
  createdAt: string;
  implementedAt?: string;
  confidence: number;
};

type BrowserSetting = {
  id: number;
  userId: number;
  isEnabled: boolean;
  privacyLevel: string;
  recordUrls: boolean;
  recordInputValues: boolean;
  domainAllowList: string[];
  domainBlockList: string[];
  aiSuggestions: boolean;
  updatedAt: string;
};

// Form schemas
const settingsFormSchema = z.object({
  isEnabled: z.boolean(),
  privacyLevel: z.enum(["minimal", "balanced", "complete"]),
  recordUrls: z.boolean(),
  recordInputValues: z.boolean(),
  domainAllowList: z.string().transform((val) => val.split(',').map(item => item.trim()).filter(Boolean)),
  domainBlockList: z.string().transform((val) => val.split(',').map(item => item.trim()).filter(Boolean)),
  aiSuggestions: z.boolean(),
});

const sequenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isAutomated: z.boolean().default(false),
  triggerType: z.enum(["manual", "scheduled", "event"]).optional(),
  isActive: z.boolean().default(true),
});

const convertSessionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// Session ID management for tracking browser actions
const getSessionId = () => {
  // Check if we already have a session ID in localStorage
  let sessionId = localStorage.getItem('browserObserverSessionId');
  
  // If not, create a new one
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('browserObserverSessionId', sessionId);
  }
  
  return sessionId;
};

const SESSION_ID = getSessionId();

// AI Browser Page Component
export default function AiBrowserPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [selectedSequence, setSelectedSequence] = useState<BrowserSequence | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BrowserAiSuggestion | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [activeSequenceTab, setActiveSequenceTab] = useState<"steps" | "execution">("steps");
  const [currentExecutionId, setCurrentExecutionId] = useState<number | null>(null);
  
  // Session for recording
  const [currentSessionId, setCurrentSessionId] = useState(SESSION_ID);

  // Settings form
  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      isEnabled: true,
      privacyLevel: "balanced",
      recordUrls: true,
      recordInputValues: true,
      domainAllowList: "",
      domainBlockList: "",
      aiSuggestions: true,
    },
  });

  // Sequence form
  const sequenceForm = useForm<z.infer<typeof sequenceFormSchema>>({
    resolver: zodResolver(sequenceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isAutomated: false,
      triggerType: "manual",
      isActive: true,
    },
  });

  // Convert session form
  const convertSessionForm = useForm<z.infer<typeof convertSessionFormSchema>>({
    resolver: zodResolver(convertSessionFormSchema),
    defaultValues: {
      name: "New Sequence",
      description: "",
    },
  });

  // Queries
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/browser-observer/settings"],
    queryFn: user ? undefined : () => null, // Don't fetch for anonymous users
    enabled: !!user,
  });

  const { data: sequences, isLoading: isLoadingSequences } = useQuery({
    queryKey: ["/api/browser-observer/sequences"],
    queryFn: user ? undefined : () => [],
    enabled: !!user,
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["/api/browser-observer/suggestions"],
    queryFn: user ? undefined : () => [],
    enabled: !!user,
  });

  const { data: recentActions, isLoading: isLoadingActions } = useQuery({
    queryKey: ["/api/browser-observer/actions/recent"],
    queryFn: user ? undefined : () => [],
    enabled: !!user,
  });

  const { data: sessionActions, isLoading: isLoadingSessionActions } = useQuery({
    queryKey: ["/api/browser-observer/actions/session", currentSessionId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/browser-observer/actions/session/${currentSessionId}`);
      return await response.json();
    },
  });

  // Sequence steps query
  const { data: sequenceSteps, isLoading: isLoadingSequenceSteps } = useQuery({
    queryKey: ["/api/browser-observer/sequences", selectedSequence?.id, "steps"],
    queryFn: async () => {
      if (!selectedSequence) return [];
      const response = await apiRequest("GET", `/api/browser-observer/sequences/${selectedSequence.id}/steps`);
      return await response.json();
    },
    enabled: !!selectedSequence,
  });

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsFormSchema>) => {
      const response = await apiRequest("POST", "/api/browser-observer/settings", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your browser observer settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSequenceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sequenceFormSchema>) => {
      const response = await apiRequest("POST", "/api/browser-observer/sequences", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sequence created",
        description: "Your automation sequence has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/sequences"] });
      sequenceForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating sequence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSequenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BrowserSequence> }) => {
      const response = await apiRequest("PATCH", `/api/browser-observer/sequences/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sequence updated",
        description: "Your automation sequence has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/sequences"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating sequence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/browser-observer/sequences/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sequence deleted",
        description: "Your automation sequence has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/sequences"] });
      setSelectedSequence(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting sequence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recordActionMutation = useMutation({
    mutationFn: async (action: Omit<BrowserAction, "id" | "userId" | "timestamp">) => {
      const response = await apiRequest("POST", "/api/browser-observer/action", action);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/browser-observer/actions/session", currentSessionId] 
      });
    },
    onError: (error) => {
      console.error("Error recording action:", error);
    },
  });

  const updateSuggestionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/browser-observer/suggestions/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion updated",
        description: "The suggestion status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/suggestions"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating suggestion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertSessionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof convertSessionFormSchema>) => {
      const response = await apiRequest("POST", `/api/browser-observer/sessions/${currentSessionId}/convert`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session converted",
        description: "Your browsing session has been converted to a sequence.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/sequences"] });
      setShowConvertDialog(false);
      setSelectedSequence(data.sequence);
      setActiveTab("sequences");
    },
    onError: (error) => {
      toast({
        title: "Error converting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const runSequenceMutation = useMutation({
    mutationFn: async (sequenceId: number) => {
      const response = await apiRequest("POST", `/api/browser-observer/sequences/${sequenceId}/run`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sequence started",
        description: "The automation sequence has been started.",
      });
      if (data.executionId) {
        setCurrentExecutionId(data.executionId);
        setActiveSequenceTab("execution");
      }
      // Update the sequence to reflect latest execution
      queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/sequences"] });
    },
    onError: (error) => {
      toast({
        title: "Error running sequence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/browser-observer/suggestions/generate", { 
        sessionId: currentSessionId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        toast({
          title: "Suggestions generated",
          description: `${data.length} new automation suggestions have been generated.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/browser-observer/suggestions"] });
      } else {
        toast({
          title: "No suggestions available",
          description: "Not enough data to generate meaningful suggestions. Keep browsing!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error generating suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update settings form when data is loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        isEnabled: settings.isEnabled,
        privacyLevel: settings.privacyLevel,
        recordUrls: settings.recordUrls,
        recordInputValues: settings.recordInputValues,
        domainAllowList: settings.domainAllowList.join(', '),
        domainBlockList: settings.domainBlockList.join(', '),
        aiSuggestions: settings.aiSuggestions,
      });
    }
  }, [settings]);

  // Implement browser observation functionality
  useEffect(() => {
    if (!isRecording) return;

    // Define event handlers for tracking browser actions
    const handleClick = (e: MouseEvent) => {
      if (!e.target) return;
      
      const element = e.target as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const path = generateElementPath(element);
      
      // Record click action
      recordActionMutation.mutate({
        sessionId: currentSessionId,
        actionType: "click",
        targetElement: path,
        url: window.location.href,
        valueOrText: element.textContent || undefined,
        metadata: {
          tagName,
          id: element.id,
          classes: element.className,
        }
      });
    };

    const handleInput = (e: Event) => {
      if (!e.target) return;
      
      const element = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const tagName = element.tagName.toLowerCase();
      const path = generateElementPath(element);
      
      // Record input action
      recordActionMutation.mutate({
        sessionId: currentSessionId,
        actionType: "input",
        targetElement: path,
        url: window.location.href,
        valueOrText: settings?.recordInputValues ? element.value : "[REDACTED]",
        metadata: {
          tagName,
          id: element.id,
          classes: element.className,
          inputType: tagName === 'input' ? (element as HTMLInputElement).type : tagName,
        }
      });
    };

    const handleNavigation = () => {
      // Record navigation action
      recordActionMutation.mutate({
        sessionId: currentSessionId,
        actionType: "navigation",
        targetElement: "window.location",
        url: window.location.href,
        metadata: {
          title: document.title,
          referrer: document.referrer,
        }
      });
    };

    // Helper function to generate CSS path to an element
    const generateElementPath = (element: HTMLElement): string => {
      if (element.id) {
        return `#${element.id}`;
      }
      
      let path = element.tagName.toLowerCase();
      
      if (element.className) {
        const classes = element.className.split(' ').filter(Boolean);
        if (classes.length > 0) {
          path += `.${classes.join('.')}`;
        }
      }
      
      // Add position among siblings
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element);
        path += `:nth-child(${index + 1})`;
      }
      
      return path;
    };

    // Add event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('popstate', handleNavigation);
    
    // Record initial navigation
    handleNavigation();
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleInput, true);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isRecording, currentSessionId, settings]);

  // Form submission handlers
  const onSettingsSubmit = (data: z.infer<typeof settingsFormSchema>) => {
    saveSettingsMutation.mutate(data);
  };

  const onSequenceSubmit = (data: z.infer<typeof sequenceFormSchema>) => {
    createSequenceMutation.mutate(data);
  };

  const onConvertSessionSubmit = (data: z.infer<typeof convertSessionFormSchema>) => {
    convertSessionMutation.mutate(data);
  };

  // Toggle recording state
  const toggleRecording = () => {
    if (recordingStatus === "idle" || recordingStatus === "paused") {
      setIsRecording(true);
      setRecordingStatus("recording");
      
      toast({
        title: "Recording started",
        description: "Your browser actions are now being recorded.",
      });
    } else {
      setIsRecording(false);
      setRecordingStatus("paused");
      
      toast({
        title: "Recording paused",
        description: "Browser action recording has been paused.",
      });
    }
  };

  // Reset recording
  const resetRecording = () => {
    setIsRecording(false);
    setRecordingStatus("idle");
    // Generate a new session ID
    const newSessionId = uuidv4();
    localStorage.setItem('browserObserverSessionId', newSessionId);
    setCurrentSessionId(newSessionId);
    
    toast({
      title: "Recording reset",
      description: "A new browsing session has been started.",
    });
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper to generate suggestion type badge
  const getSuggestionTypeBadge = (type: string) => {
    switch (type) {
      case "automation":
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Automation</span>;
      case "improvement":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Improvement</span>;
      case "shortcut":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Shortcut</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  // Helper to generate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case "accepted":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Accepted</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      case "implemented":
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Implemented</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  return (
    <MainLayout customLayout={true}>
      <div className="container mx-auto space-y-8 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">AI Browser Observer</h2>
            <p className="text-muted-foreground">Record, analyze, and automate your browsing patterns</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={recordingStatus === "recording" ? "destructive" : "default"}
                onClick={toggleRecording}
              >
                {recordingStatus === "recording" ? (
                  <><PauseCircle className="mr-2 h-4 w-4" /> Pause Recording</>
                ) : (
                  <><PlayCircle className="mr-2 h-4 w-4" /> {recordingStatus === "paused" ? "Resume Recording" : "Start Recording"}</>
                )}
              </Button>
            </div>
            {recordingStatus !== "idle" && (
              <Button variant="outline" onClick={resetRecording}>
                Reset Session
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-1/2 grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="sequences">Sequences</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Session Actions</CardTitle>
                  <CardDescription>
                    Actions recorded in your current browsing session
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] overflow-y-auto">
                  {isLoadingSessionActions ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessionActions?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Element</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionActions.map((action: BrowserAction) => (
                          <TableRow key={action.id}>
                            <TableCell className="font-medium">{action.actionType}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{action.targetElement}</TableCell>
                            <TableCell>{formatTime(action.timestamp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No actions recorded yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start recording to capture your browsing patterns
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConvertDialog(true)}
                    disabled={!sessionActions || sessionActions.length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Sequence
                  </Button>
                  <Button 
                    onClick={() => generateSuggestionsMutation.mutate()}
                    disabled={!sessionActions || sessionActions.length < 10 || generateSuggestionsMutation.isPending}
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Activity className="mr-2 h-4 w-4" />
                    )}
                    Generate Suggestions
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Statistics</CardTitle>
                  <CardDescription>
                    Summary of your browser activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>Current Session ID:</span>
                      <code className="bg-muted p-1 rounded text-sm">{currentSessionId.substring(0, 8)}...</code>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>Recording Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        recordingStatus === "recording" 
                          ? "bg-green-100 text-green-800" 
                          : recordingStatus === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {recordingStatus === "recording" 
                          ? "Recording" 
                          : recordingStatus === "paused"
                            ? "Paused"
                            : "Idle"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>Actions in Current Session:</span>
                      <span>{sessionActions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>Total Sequences:</span>
                      <span>{sequences?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>AI Suggestions:</span>
                      <span>{suggestions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span>Observer Enabled:</span>
                      <span>{settings?.isEnabled ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Automation Sequences</CardTitle>
                    <CardDescription>
                      Create and manage your automation sequences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px] overflow-y-auto">
                    {isLoadingSequences ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : sequences?.length > 0 ? (
                      <div className="space-y-2">
                        {sequences.map((sequence: BrowserSequence) => (
                          <div 
                            key={sequence.id}
                            className={`p-3 rounded-md cursor-pointer ${
                              selectedSequence?.id === sequence.id 
                                ? "bg-primary/10 border border-primary" 
                                : "bg-card hover:bg-muted"
                            }`}
                            onClick={() => setSelectedSequence(sequence)}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium">{sequence.name}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                sequence.isActive 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {sequence.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {sequence.description || "No description"}
                            </p>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>Steps: {sequenceSteps?.length || "..."}</span>
                              <span>Runs: {sequence.executionCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <List className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No sequences created yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Create a new sequence to automate repetitive tasks
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedSequence ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle>{selectedSequence.name}</CardTitle>
                        <CardDescription>
                          {selectedSequence.description || "No description"}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            updateSequenceMutation.mutate({
                              id: selectedSequence.id,
                              data: { isActive: !selectedSequence.isActive }
                            });
                          }}
                        >
                          {selectedSequence.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this sequence?")) {
                              deleteSequenceMutation.mutate(selectedSequence.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <div className="px-6 mb-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(selectedSequence.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(selectedSequence.updatedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Executed</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSequence.lastExecutedAt 
                              ? formatTime(selectedSequence.lastExecutedAt) 
                              : "Never"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Execution Count</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSequence.executionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Automated</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSequence.isAutomated ? "Yes" : "No"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Trigger Type</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSequence.triggerType || "Manual"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent>
                      <Tabs 
                        value={activeSequenceTab} 
                        onValueChange={(value) => setActiveSequenceTab(value as "steps" | "execution")}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="steps">
                            <List className="mr-2 h-4 w-4" /> Steps
                          </TabsTrigger>
                          <TabsTrigger value="execution">
                            <Activity className="mr-2 h-4 w-4" /> Execution
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="steps" className="mt-0">
                          <h3 className="text-lg font-medium mb-4">Sequence Steps</h3>
                          {isLoadingSequenceSteps ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : sequenceSteps?.length > 0 ? (
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Wait (ms)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sequenceSteps.map((step: BrowserSequenceStep) => (
                                    <TableRow key={step.id}>
                                      <TableCell>{step.stepOrder}</TableCell>
                                      <TableCell>{step.actionType}</TableCell>
                                      <TableCell className="max-w-[200px] truncate">{step.targetElement}</TableCell>
                                      <TableCell>{step.waitBeforeMs > 0 ? `Before: ${step.waitBeforeMs}` : ''} {step.waitAfterMs > 0 ? `After: ${step.waitAfterMs}` : ''}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                              <p className="text-muted-foreground">No steps in this sequence</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="execution" className="mt-0">
                          <WorkflowExecutionPanel
                            sequenceId={selectedSequence.id}
                            sequenceName={selectedSequence.name}
                            userId={selectedSequence.userId}
                            executionId={currentExecutionId}
                            onExecutionComplete={(executionId) => {
                              // Update execution count when complete
                              queryClient.invalidateQueries({ 
                                queryKey: ["/api/browser-observer/sequences"] 
                              });
                            }}
                            className="h-[450px]"
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => runSequenceMutation.mutate(selectedSequence.id)}
                        disabled={runSequenceMutation.isPending}
                      >
                        {runSequenceMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Sequence</>
                        ) : (
                          <><RotateCw className="mr-2 h-4 w-4" /> Execute Sequence</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Sequence</CardTitle>
                      <CardDescription>
                        Define a new automation sequence
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...sequenceForm}>
                        <form onSubmit={sequenceForm.handleSubmit(onSequenceSubmit)} className="space-y-6">
                          <FormField
                            control={sequenceForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sequence Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter a name for this sequence" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sequenceForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what this sequence does"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={sequenceForm.control}
                              name="isAutomated"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Automated Execution</FormLabel>
                                    <FormDescription>
                                      Run this sequence automatically
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={sequenceForm.control}
                              name="triggerType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Trigger Type</FormLabel>
                                  <Select
                                    disabled={!sequenceForm.watch("isAutomated")}
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a trigger type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="manual">Manual</SelectItem>
                                      <SelectItem value="scheduled">Scheduled</SelectItem>
                                      <SelectItem value="event">Event-based</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={sequenceForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Active</FormLabel>
                                  <FormDescription>
                                    Enable or disable this sequence
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={createSequenceMutation.isPending}
                          >
                            {createSequenceMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Sequence
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Suggestions</CardTitle>
                    <CardDescription>
                      Automation ideas based on your browsing patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px] overflow-y-auto">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : suggestions?.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions.map((suggestion: BrowserAiSuggestion) => (
                          <div 
                            key={suggestion.id}
                            className={`p-3 rounded-md cursor-pointer ${
                              selectedSuggestion?.id === suggestion.id 
                                ? "bg-primary/10 border border-primary" 
                                : "bg-card hover:bg-muted"
                            }`}
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              {getSuggestionTypeBadge(suggestion.suggestionType)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {suggestion.description}
                            </p>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(suggestion.createdAt)}
                              </span>
                              {getStatusBadge(suggestion.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No suggestions available yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Continue browsing to generate AI suggestions
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => generateSuggestionsMutation.mutate()}
                      disabled={generateSuggestionsMutation.isPending}
                    >
                      {generateSuggestionsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Activity className="mr-2 h-4 w-4" />
                      )}
                      Generate New Suggestions
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedSuggestion ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            {selectedSuggestion.title}
                            <span className="ml-2">
                              {getSuggestionTypeBadge(selectedSuggestion.suggestionType)}
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {selectedSuggestion.description}
                          </CardDescription>
                        </div>
                        <div>
                          {getStatusBadge(selectedSuggestion.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Suggested Actions</h3>
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Step</TableHead>
                                  <TableHead>Action</TableHead>
                                  <TableHead>Target</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedSuggestion.suggestedActions.map((action, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{action.actionType}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{action.targetElement}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{action.valueOrText || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Suggestion Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Created</p>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(selectedSuggestion.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Implemented</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedSuggestion.implementedAt 
                                  ? formatTime(selectedSuggestion.implementedAt) 
                                  : "Not yet"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Confidence Score</p>
                              <p className="text-sm text-muted-foreground">
                                {(selectedSuggestion.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedSuggestion.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            updateSuggestionStatusMutation.mutate({
                              id: selectedSuggestion.id,
                              status: "rejected"
                            });
                          }}
                          disabled={selectedSuggestion.status === "rejected" || updateSuggestionStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            updateSuggestionStatusMutation.mutate({
                              id: selectedSuggestion.id,
                              status: "accepted"
                            });
                          }}
                          disabled={selectedSuggestion.status === "accepted" || updateSuggestionStatusMutation.isPending}
                        >
                          Accept
                        </Button>
                      </div>
                      <Button
                        onClick={() => {
                          // Create a new sequence from the suggestion
                          createSequenceMutation.mutate({
                            name: selectedSuggestion.title,
                            description: selectedSuggestion.description,
                            isAutomated: false,
                            triggerType: "manual",
                            isActive: true,
                          });

                          // Mark as implemented
                          updateSuggestionStatusMutation.mutate({
                            id: selectedSuggestion.id,
                            status: "implemented"
                          });
                        }}
                        disabled={
                          selectedSuggestion.status === "implemented" || 
                          updateSuggestionStatusMutation.isPending ||
                          createSequenceMutation.isPending
                        }
                      >
                        {(updateSuggestionStatusMutation.isPending || createSequenceMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Implement
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Suggestion Details</CardTitle>
                      <CardDescription>
                        Select a suggestion to view details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center h-[400px]">
                      <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No suggestion selected</h3>
                      <p className="text-muted-foreground mt-2">
                        Choose a suggestion from the list to view its details and actions
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Browser Observer Settings</CardTitle>
                <CardDescription>
                  Configure how the AI Browser Observer works
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                      <FormField
                        control={settingsForm.control}
                        name="isEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">Enable Browser Observer</FormLabel>
                              <FormDescription>
                                Turn browser observation on or off globally
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="privacyLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Privacy Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select privacy level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="minimal">Minimal (Collect most data)</SelectItem>
                                <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                                <SelectItem value="complete">Complete (Collect minimal data)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Controls the amount and type of data collected
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={settingsForm.control}
                          name="recordUrls"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Record URLs</FormLabel>
                                <FormDescription>
                                  Capture the full URLs you visit
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="recordInputValues"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Record Input Values</FormLabel>
                                <FormDescription>
                                  Capture text entered in forms
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={settingsForm.control}
                        name="domainAllowList"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Allow List</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="example.com, another-site.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Only record actions on these domains (comma-separated). Leave empty to allow all.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="domainBlockList"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain Block List</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="example.com, another-site.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Never record actions on these domains (comma-separated)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={settingsForm.control}
                        name="aiSuggestions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>AI Suggestions</FormLabel>
                              <FormDescription>
                                Enable AI to analyze your browsing patterns and suggest automations
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={saveSettingsMutation.isPending}
                      >
                        {saveSettingsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Settings
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Convert Session Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Session as Sequence</AlertDialogTitle>
            <AlertDialogDescription>
              Convert your current browsing session into a reusable automation sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...convertSessionForm}>
            <form onSubmit={convertSessionForm.handleSubmit(onConvertSessionSubmit)}>
              <div className="space-y-4 py-4">
                <FormField
                  control={convertSessionForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sequence Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={convertSessionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ""}
                          placeholder="Describe what this sequence does"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button 
                    type="submit"
                    disabled={convertSessionMutation.isPending}
                  >
                    {convertSessionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Only use one export default
// The function is already exported as default at line 162