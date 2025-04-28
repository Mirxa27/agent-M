import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Undo, Redo, RefreshCw, X, Eye, Terminal, Play, Maximize, Minimize } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BrowserAction {
  type: 'navigation' | 'click' | 'input' | 'form_submit' | 'scroll' | 'custom';
  data: any;
  timestamp: Date;
}

interface BrowserState {
  url: string;
  title: string;
  actions: BrowserAction[];
  htmlSnapshot?: string;
  screenshot?: string;
}

export default function AiBrowserPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [browserState, setBrowserState] = useState<BrowserState | null>(null);
  const [actions, setActions] = useState<BrowserAction[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to navigate to a URL
  const navigateTo = async (targetUrl: string) => {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would use a proxy or browser automation
      // Here we're just setting the iframe src
      setUrl(targetUrl);
      
      // Record this action
      const action: BrowserAction = {
        type: 'navigation',
        data: { url: targetUrl },
        timestamp: new Date()
      };
      
      setActions(prev => [...prev, action]);
      
      // Update browser state
      setBrowserState({
        url: targetUrl,
        title: "Loading...",
        actions: [...actions, action],
        htmlSnapshot: undefined,
        screenshot: undefined
      });
      
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the URL",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start recording user actions
  const startRecording = () => {
    setIsRecording(true);
    setActions([]);
    toast({
      title: "Recording Started",
      description: "AI assistant is now observing your actions"
    });
  };

  // Stop recording user actions
  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording Stopped",
      description: "AI assistant has stopped observing your actions"
    });
  };

  // Replay recorded actions
  const replayActions = async () => {
    if (actions.length === 0) {
      toast({
        title: "No Actions",
        description: "There are no recorded actions to replay",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, you would actually perform these actions
      // Here we'll just simulate it with a delay
      
      // First navigate to the initial URL
      if (actions[0].type === 'navigation') {
        await navigateTo(actions[0].data.url);
      }
      
      // Then replay other actions with delays
      for (let i = 1; i < actions.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // In a real implementation, you would execute the action here
        console.log(`Replaying action: ${actions[i].type}`, actions[i].data);
      }
      
      toast({
        title: "Replay Complete",
        description: "All recorded actions have been replayed"
      });
      
    } catch (error) {
      toast({
        title: "Replay Error",
        description: "Failed to replay actions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get AI assistance based on recorded actions
  const getAiAssistance = async () => {
    if (actions.length === 0 && !userPrompt) {
      toast({
        title: "No Context",
        description: "Please record some actions or enter a question first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setAiResponse("");
    
    try {
      // In a real implementation, you would send the actions and browser state to the AI
      // For now, we'll simulate a response
      
      const context = {
        url: browserState?.url,
        title: browserState?.title,
        actions: actions,
        userPrompt: userPrompt
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI response based on the context
      let response = "";
      
      if (actions.length > 0) {
        response += "I've observed the following on the webpage:\n\n";
        
        if (context.url) {
          response += `- You're currently on: ${context.url}\n`;
        }
        
        response += `- You performed ${actions.length} actions including `;
        response += actions.map(a => a.type).join(", ") + "\n\n";
        
        if (context.userPrompt) {
          response += `Regarding your question "${context.userPrompt}":\n`;
          response += "Based on what I've observed, here's my assistance:\n";
          response += "I can help you navigate the webpage, fill forms, or understand what you're seeing.";
        } else {
          response += "I can help with navigating this website, filling forms, or understanding what you're seeing. Please let me know what you'd like assistance with.";
        }
      } else if (context.userPrompt) {
        response = `You asked: "${context.userPrompt}"\n\n`;
        response += "I'll need to observe some of your interactions with the webpage to provide specific assistance. Try clicking 'Record' and performing the actions you need help with.";
      }
      
      setAiResponse(response);
      
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get AI assistance",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // In a real implementation, you would inject scripts to capture events
      // For now, we'll just update the browser state
      setBrowserState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          title: iframeRef.current?.contentWindow?.document.title || prev.title
        };
      });
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`container py-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Browser</h1>
          <p className="text-muted-foreground">
            Browse with AI assistance to help you navigate and complete tasks
          </p>
        </div>
        <Button variant="outline" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Browser Section */}
        <div className={`${isFullscreen ? 'md:col-span-2' : 'md:col-span-2'}`}>
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL"
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigateTo(url);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigateTo(url)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopRecording}>
                      <X className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={startRecording}>
                      <Eye className="h-4 w-4 mr-2" />
                      Record
                    </Button>
                  )}
                  <Button variant="outline" onClick={replayActions} disabled={actions.length === 0 || isLoading}>
                    <Play className="h-4 w-4 mr-2" />
                    Replay
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`w-full ${isFullscreen ? 'h-[70vh]' : 'h-[50vh]'} bg-background border rounded-md overflow-hidden`}>
                {browserState?.url ? (
                  <iframe
                    ref={iframeRef}
                    src={browserState.url}
                    className="w-full h-full"
                    onLoad={handleIframeLoad}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Enter a URL to begin browsing
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant Section */}
        <div className={`${isFullscreen ? 'md:col-span-1' : 'md:col-span-1'}`}>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Get help with browsing or ask questions about what you see
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <Tabs defaultValue="assistant" className="flex-grow flex flex-col">
                <TabsList className="mb-4">
                  <TabsTrigger value="assistant">Assistant</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assistant" className="flex-grow flex flex-col">
                  <div className="flex-grow overflow-auto p-3 bg-muted/30 rounded-md mb-4 whitespace-pre-wrap">
                    {aiResponse ? (
                      aiResponse
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        Start browsing and recording your actions, then ask for help
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Ask the AI for help..."
                      className="flex-grow"
                    />
                    <Button 
                      className="self-end"
                      onClick={getAiAssistance}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="flex-grow overflow-auto">
                  <div className="space-y-2">
                    {actions.length > 0 ? (
                      actions.map((action, index) => (
                        <div key={index} className="p-2 border rounded-md text-sm">
                          <div className="font-medium capitalize">{action.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="mt-1 text-xs truncate">
                            {JSON.stringify(action.data)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No actions recorded yet. Click "Record" to start.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}