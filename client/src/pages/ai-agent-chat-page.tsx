import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent, Conversation, Message as MessageType } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, Send, User, Search, FileText, ImageIcon, Code2, Settings2, PlusCircle } from "lucide-react"; // Added new icons
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; // For sidebar
import { Input } from "@/components/ui/input"; // For search input

export default function AiAgentChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"], // Consider adding user.id to queryKey if agents are user-specific
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<MessageType[]>({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    queryFn: async () => {
      if (!currentConversationId) return [];
      const res = await apiRequest("GET", `/api/conversations/${currentConversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentConversationId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: { agentId: string; content: string; conversationId?: number | null }) => {
      let convId = newMessage.conversationId;

      if (!convId) {
        // Create a new conversation if one doesn't exist
        const createConvRes = await apiRequest("POST", "/api/conversations", { agentId: newMessage.agentId, title: `Chat with Agent ${newMessage.agentId}` });
        if (!createConvRes.ok) {
          const errorData = await createConvRes.json().catch(() => ({ message: "Failed to create conversation" }));
          throw new Error(errorData.message);
        }
        const conversation: Conversation = await createConvRes.json();
        if (conversation && typeof conversation.id === 'number') {
          convId = conversation.id;
          setCurrentConversationId(convId);
        } else {
          console.error("Failed to get valid ID from new conversation:", conversation);
          throw new Error("Failed to create conversation with a valid ID.");
        }
      }

      if (convId === null || convId === undefined) {
        throw new Error("Conversation ID is missing after attempt to create/get conversation.");
      }

      // Send the message to the conversation
      const sendMessageRes = await apiRequest("POST", `/api/conversations/${convId}/messages`, { content: newMessage.content });
      if (!sendMessageRes.ok) {
        const errorData = await sendMessageRes.json().catch(() => ({ message: "Failed to send message" }));
        throw new Error(errorData.message);
      }
      return sendMessageRes.json(); // This should return the user's message and a processing flag
    },
    onSuccess: (data) => {
      setInputMessage("");
      // The currentConversationId should be set by the mutationFn if a new conversation was created.
      // Invalidate queries to refetch messages, which will include the user's new message and the pending agent response.
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentConversationId, "messages"] });
      toast({ title: "Message sent" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedAgentId) return;
    sendMessageMutation.mutate({
      agentId: selectedAgentId,
      content: inputMessage,
      conversationId: currentConversationId || undefined,
    });
    // Optimistically add user message - this should be refined with proper API integration
    queryClient.setQueryData(["/api/conversations", currentConversationId, "messages"], (oldMessages: any[] = []) => [
      ...oldMessages,
      { id: Date.now(), role: 'user', content: inputMessage, timestamp: new Date().toISOString() }
    ]);
    setInputMessage("");
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentConversationId(null); // Start a new conversation context
    // Potentially fetch/create a conversation ID here
    // For now, we'll let sendMessageMutation handle it or create one implicitly
    toast({ title: `Agent selected: ${agents.find(a => a.id.toString() === agentId)?.name}` });
  };

  if (isLoadingAgents) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      {/* Sidebar for Agent Selection and Conversation History */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Select onValueChange={handleAgentChange} value={selectedAgentId}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Select an AI Agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name} ({agent.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Placeholder for conversation history list */}
            <div className="text-sm text-muted-foreground">
              Conversation history will appear here.
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
              <Settings2 className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {selectedAgentId ? agents.find(a => a.id.toString() === selectedAgentId)?.name || "Chat" : "AI Agent Chat"}
            </h2>
          </div>
          {/* Add other header controls if needed */}
        </header>

        <ScrollArea className="flex-grow p-6 space-y-4">
          {isLoadingMessages && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!selectedAgentId && !isLoadingMessages && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="h-16 w-16 mb-4" />
              <p className="text-lg">Select an agent from the sidebar to start chatting.</p>
            </div>
          )}
          {selectedAgentId && !isLoadingMessages && messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              No messages yet. Send a message to start the conversation!
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <Bot className="h-8 w-8 rounded-full bg-primary text-primary-foreground p-1.5 flex-shrink-0" />
              )}
              <div
                className={`p-3 rounded-lg max-w-[75%] break-words shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted rounded-bl-none"
                  }`}
              >
                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
              </div>
              {msg.role === "user" && (
                <User className="h-8 w-8 rounded-full bg-muted border p-1.5 flex-shrink-0" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <footer className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            {/* Toolbar for additional actions */}
            <Button variant="ghost" size="icon" title="Search History (coming soon)"> <Search className="h-5 w-5" /> </Button>
            <Button variant="ghost" size="icon" title="Generate Document (coming soon)"> <FileText className="h-5 w-5" /> </Button>
            <Button variant="ghost" size="icon" title="Generate Image (coming soon)"> <ImageIcon className="h-5 w-5" /> </Button>
            <Button variant="ghost" size="icon" title="Generate Code (coming soon)"> <Code2 className="h-5 w-5" /> </Button>
            <Button variant="ghost" size="icon" title="Attach File (coming soon)"> <PlusCircle className="h-5 w-5" /> </Button>
          </div>
          <div className="mt-2 flex w-full items-center space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedAgentId ? `Message ${agents.find(a => a.id.toString() === selectedAgentId)?.name || "Agent"}...` : "Select an agent to send a message..."}
              className="flex-1 resize-none min-h-[40px] max-h-[150px] p-2.5"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessageMutation.isPending || !selectedAgentId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !inputMessage.trim() || !selectedAgentId}
              size="lg"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
