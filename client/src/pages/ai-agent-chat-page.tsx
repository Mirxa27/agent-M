import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent, Message as MessageType } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AiAgentChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
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
      // TODO: Replace with actual endpoint for fetching conversation messages if different from task messages
      // This might require a new backend endpoint /api/conversations/:id/messages
      // For now, assuming a similar structure to task messages or a placeholder.
      // const res = await apiRequest("GET", `/api/tasks/${currentConversationId}/messages`);
      // if (!res.ok) throw new Error("Failed to fetch messages");
      // return res.json();
      console.warn("Message fetching for conversations not fully implemented yet.");
      return []; // Placeholder
    },
    enabled: !!currentConversationId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: { agentId: string; content: string; conversationId?: number }) => {
      // TODO: This needs to be adapted to a new backend endpoint for agent chat.
      // It might involve creating a conversation if one doesn't exist,
      // then sending a message to that conversation, which then triggers the agent.
      // For now, this is a placeholder.
      console.log("Sending message (placeholder):", newMessage);
      // const res = await apiRequest("POST", `/api/agents/${newMessage.agentId}/chat`, { content: newMessage.content, conversationId: newMessage.conversationId });
      // if (!res.ok) {
      //   const errorData = await res.json().catch(() => ({ message: "Failed to send message" }));
      //   throw new Error(errorData.message);
      // }
      // return res.json();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return { id: Date.now(), conversationId: newMessage.conversationId || Date.now(), role: "assistant", content: "This is a simulated agent response.", timestamp: new Date().toISOString() };
    },
    onSuccess: (data) => {
      setInputMessage("");
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", currentConversationId, "messages"] });
      toast({ title: "Message sent (simulated)" });
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
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-2rem)] container mx-auto py-4 gap-4">
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle>Select an AI Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleAgentChange} value={selectedAgentId}>
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Choose an agent to chat with..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name} ({agent.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAgentId ? (
        <Card className="flex flex-col flex-grow overflow-hidden">
          <CardHeader>
            <CardTitle>Chat with: {agents.find(a => a.id.toString() === selectedAgentId)?.name || "Agent"}</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow p-4 space-y-4">
            {isLoadingMessages && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            {!isLoadingMessages && messages.length === 0 && (
              <div className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <Bot className="h-8 w-8 rounded-full bg-primary text-primary-foreground p-1.5 mr-2 flex-shrink-0" />
                )}
                <div
                  className={`p-3 rounded-lg max-w-[70%] break-words ${msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-bl-none"
                    }`}
                >
                  {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                </div>
                {msg.role === "user" && (
                  <User className="h-8 w-8 rounded-full bg-muted border p-1.5 ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <CardFooter className="p-4 border-t">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 resize-none"
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
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
          <Bot className="h-16 w-16 mb-4" />
          <p className="text-lg">Please select an agent to start chatting.</p>
        </div>
      )}
    </div>
  );
}
