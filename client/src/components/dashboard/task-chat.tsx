import { useState, useEffect, useRef } from "react";
import { Agent, Message, InsertMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Paperclip, Mic, Send, Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TaskChatProps {
  activeTaskId?: number;
  onNewTask?: (title: string, agentId: number) => Promise<number>;
  agents: Agent[];
}

export default function TaskChat({ activeTaskId, onNewTask, agents }: TaskChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: messages = [], isLoading } = useQuery({
    queryKey: activeTaskId ? [`/api/tasks/${activeTaskId}/messages`] : null,
    enabled: !!activeTaskId,
  });
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const sendMessageMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number, content: string }) => {
      const message: InsertMessage = {
        taskId,
        role: "user",
        content
      };
      const res = await apiRequest("POST", `/api/tasks/${taskId}/messages`, message);
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${activeTaskId}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    let taskId = activeTaskId;
    
    // If no active task, create a new one
    if (!taskId && onNewTask && selectedAgentId) {
      try {
        taskId = await onNewTask(message, parseInt(selectedAgentId));
      } catch (error) {
        toast({
          title: "Failed to create task",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
    }
    
    if (taskId) {
      sendMessageMutation.mutate({ taskId, content: message });
    } else {
      toast({
        title: "No active task",
        description: "Please select an agent to create a new task",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium">
          {activeTaskId ? "Task Conversation" : "New Task"}
        </h3>
        {!activeTaskId && (
          <div className="flex space-x-2">
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="text-sm border border-gray-300 rounded-md w-44">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Messages Container */}
      <div className="p-4 h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg: Message, index: number) => (
            <div 
              key={msg.id || index} 
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2 flex-shrink-0">
                  <span className="text-xs">AI</span>
                </div>
              )}
              
              <div 
                className={`${
                  msg.role === 'user' 
                    ? 'bg-primary-50 text-primary-800 rounded-lg rounded-tr-none'
                    : 'bg-gray-100 rounded-lg rounded-tl-none'
                } p-3 max-w-md`}
              >
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2 flex-shrink-0">
              <span className="text-xs">AI</span>
            </div>
            <div className="bg-gray-100 rounded-lg rounded-tl-none p-3 max-w-md">
              <p className="text-sm">
                {!activeTaskId 
                  ? "Hello! I'm your Mirxa AI assistant. What would you like to do today?"
                  : "This task doesn't have any messages yet. Start the conversation by sending a message."
                }
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-start bg-gray-50 rounded-lg px-3 py-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your task here..."
            className="flex-1 bg-transparent outline-none text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[40px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex space-x-2 ml-2 items-center">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Mic className="h-5 w-5" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending || (!activeTaskId && !selectedAgentId)}
              className="bg-primary text-white rounded-md w-8 h-8 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
}
