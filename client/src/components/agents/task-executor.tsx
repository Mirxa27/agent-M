import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Agent, Task, Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Bot,
  Sparkles,
  FileText,
  RefreshCw,
  Loader2,
  Send,
  PaperclipIcon,
  DownloadIcon,
  CheckIcon,
  Clock,
  XIcon,
  Paperclip,
  Download,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dropzone } from "@/components/ui/dropzone";

// Create task schema
const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  files: z.array(z.any()).optional(),
  useCredentials: z.boolean().default(false),
  credentialIds: z.array(z.coerce.number()).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

// Create message schema
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  files: z.array(z.any()).optional(),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface TaskExecutorProps {
  agentId: number;
  taskId?: number; // Optional for existing tasks
}

export default function TaskExecutor({ agentId, taskId }: TaskExecutorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [messagesContainerHeight, setMessagesContainerHeight] =
    useState<number>(400);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch agent details
  const {
    data: agent,
    isLoading: isLoadingAgent,
    error: agentError,
  } = useQuery({
    queryKey: ["/api/agents", agentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/agents/${agentId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch agent details");
      }
      return res.json();
    },
  });

  // Fetch current task if taskId is provided
  const {
    data: task,
    isLoading: isLoadingTask,
    error: taskError,
  } = useQuery({
    queryKey: ["/api/tasks", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await apiRequest("GET", `/api/tasks/${taskId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch task details");
      }
      return res.json();
    },
    enabled: !!taskId,
  });

  // Fetch messages for the current task
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["/api/tasks", taskId, "messages"],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await apiRequest("GET", `/api/tasks/${taskId}/messages`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch messages");
      }
      return res.json();
    },
    enabled: !!taskId,
    refetchInterval: task?.status === "running" ? 2000 : false,
  });

  // Fetch available credentials for this agent
  const {
    data: credentials = [],
    isLoading: isLoadingCredentials,
    error: credentialsError,
  } = useQuery({
    queryKey: ["/api/credentials", agentId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/credentials?agentId=${agentId}`,
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch credentials");
      }
      return res.json();
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest(
        "POST",
        `/api/agents/${agentId}/tasks`,
        undefined,
        formData,
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: (data: Task) => {
      toast({
        title: "Task created",
        description: "Your task has been created and is now running.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      navigate(`/agents/${agentId}/tasks/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest(
        "POST",
        `/api/tasks/${taskId}/messages`,
        undefined,
        formData,
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent to the agent.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tasks", taskId, "messages"],
      });
      messageForm.reset({ content: "", files: [] });
      setFiles([]);
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Task retry mutation
  const retryTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/retry`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to retry task");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task restarted",
        description: "The task has been restarted and is now running.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      queryClient.invalidateQueries({
        queryKey: ["/api/tasks", taskId, "messages"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error retrying task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel task mutation
  const cancelTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/cancel`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to cancel task");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task cancelled",
        description: "The task has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
    },
    onError: (error) => {
      toast({
        title: "Error cancelling task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Task form
  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      files: [],
      useCredentials: false,
      credentialIds: [],
    },
  });

  // Message form
  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
      files: [],
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle file upload for task creation
  const handleFileUpload = (acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  // Remove file from the list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Create a new task
  const onTaskSubmit = (values: TaskFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title);

    if (values.description) {
      formData.append("description", values.description);
    }

    if (values.useCredentials && values.credentialIds?.length) {
      formData.append("credentialIds", JSON.stringify(values.credentialIds));
    }

    files.forEach((file) => {
      formData.append("files", file);
    });

    createTaskMutation.mutate(formData);
  };

  // Send a message to the agent
  const onMessageSubmit = (values: MessageFormValues) => {
    if (!taskId) return;

    const formData = new FormData();
    formData.append("content", values.content);

    files.forEach((file) => {
      formData.append("files", file);
    });

    sendMessageMutation.mutate(formData);
  };

  // Handle retry task button click
  const handleRetryTask = () => {
    if (taskId) {
      retryTaskMutation.mutate();
    }
  };

  // Handle cancel task button click
  const handleCancelTask = () => {
    if (taskId && task?.status === "running") {
      cancelTaskMutation.mutate();
    }
  };

  // Get the status badge style based on task status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render error state
  if (agentError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load agent:{" "}
          {agentError instanceof Error ? agentError.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  // Render loading state
  if (isLoadingAgent || (taskId && isLoadingTask)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render the task creation form if no taskId provided
  if (!taskId) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center">
            <div className="mr-2 p-2 rounded-full bg-primary/10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Create Task for {agent?.name}</CardTitle>
              <CardDescription>
                Give your agent a task to work on
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...taskForm}>
            <form
              onSubmit={taskForm.handleSubmit(onTaskSubmit)}
              className="space-y-6"
            >
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What do you need help with?"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title for your task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide additional details or context..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional context or instructions for your agent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {agent?.config?.useFiles && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label>Files (Optional)</Label>
                    <Dropzone
                      onDrop={handleFileUpload}
                      maxFiles={5}
                      maxSize={10 * 1024 * 1024} // 10MB
                      accept={{
                        "application/pdf": [".pdf"],
                        "text/plain": [".txt"],
                        "text/csv": [".csv"],
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                          [".docx"],
                        "application/json": [".json"],
                      }}
                    />
                    <FormDescription>
                      Upload files for your agent to process (PDF, TXT, CSV,
                      DOCX, JSON up to 10MB)
                    </FormDescription>
                  </div>

                  {files.length > 0 && (
                    <div className="border rounded-md p-3">
                      <Label className="mb-2 block">Uploaded Files</Label>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm bg-secondary/50 rounded p-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <PaperclipIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-6 w-6 p-0 rounded-full"
                            >
                              <XIcon className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {agent?.config?.useCredentials && credentials.length > 0 && (
                <div className="space-y-4">
                  <FormField
                    control={taskForm.control}
                    name="useCredentials"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between border rounded-md p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Use Credentials
                          </FormLabel>
                          <FormDescription>
                            Allow this task to access your saved credentials
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

                  {taskForm.watch("useCredentials") && (
                    <FormField
                      control={taskForm.control}
                      name="credentialIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Credentials</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) =>
                                field.onChange([
                                  ...(field.value || []),
                                  parseInt(value),
                                ])
                              }
                              value=""
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select credentials to use" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {credentials
                                  .filter(
                                    (cred) => !field.value?.includes(cred.id),
                                  )
                                  .map((credential) => (
                                    <SelectItem
                                      key={credential.id}
                                      value={credential.id.toString()}
                                    >
                                      {credential.name} ({credential.service})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Choose which credentials the agent can access
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {taskForm.watch("useCredentials") &&
                    taskForm.watch("credentialIds")?.length > 0 && (
                      <div className="border rounded-md p-3">
                        <Label className="mb-2 block">
                          Selected Credentials
                        </Label>
                        <div className="space-y-2">
                          {taskForm.watch("credentialIds")?.map((credId) => {
                            const credential = credentials.find(
                              (c) => c.id === credId,
                            );
                            return credential ? (
                              <div
                                key={credId}
                                className="flex items-center justify-between text-sm bg-secondary/50 rounded p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  <span>{credential.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {credential.service}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentIds =
                                      taskForm.watch("credentialIds") || [];
                                    taskForm.setValue(
                                      "credentialIds",
                                      currentIds.filter((id) => id !== credId),
                                    );
                                  }}
                                  className="h-6 w-6 p-0 rounded-full"
                                >
                                  <XIcon className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/agents/${agentId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Start Task
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Render the task execution/chat interface
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/agents/${agentId}`)}
              >
                Back
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{task?.title}</CardTitle>
                  {getStatusBadge(task?.status || "pending")}
                </div>
                {task?.description && (
                  <CardDescription className="line-clamp-1">
                    {task.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task?.status === "running" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelTask}
                  disabled={cancelTaskMutation.isPending}
                >
                  {cancelTaskMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XIcon className="mr-2 h-4 w-4" />
                  )}
                  Cancel
                </Button>
              )}
              {(task?.status === "failed" || task?.status === "completed") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryTask}
                  disabled={retryTaskMutation.isPending}
                >
                  {retryTaskMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {task?.status === "running"
                      ? "The agent is processing your request..."
                      : "No messages yet. Start the conversation with the agent."}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} gap-3`}
                    >
                      <Avatar className="h-8 w-8">
                        {message.role === "user" ? (
                          <AvatarFallback className="bg-primary">
                            U
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>

                          {message.files?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-t-primary/20 space-y-1">
                              {message.files.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {typeof file === "string"
                                      ? file
                                      : file.name}
                                  </span>
                                  {file.url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => window.open(file.url)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-xs text-muted-foreground mt-1 ${
                            message.role === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {task?.status === "running" && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] flex flex-row gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted">
                      <div className="flex items-center">
                        <div className="h-2 w-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                        <div className="h-2 w-2 bg-primary rounded-full mr-2 animate-pulse delay-300"></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {task?.status === "running" && (
            <div className="border-t p-4">
              <Form {...messageForm}>
                <form
                  onSubmit={messageForm.handleSubmit(onMessageSubmit)}
                  className="space-y-4"
                >
                  <div className="grid gap-4">
                    <FormField
                      control={messageForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <FormControl>
                              <Textarea
                                placeholder="Send a message to the agent..."
                                className="resize-none pr-10 min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            {agent?.config?.useFiles && (
                              <div className="absolute bottom-3 left-3">
                                <Dropzone
                                  onDrop={handleFileUpload}
                                  maxFiles={3}
                                  maxSize={5 * 1024 * 1024} // 5MB
                                  accept={{
                                    "application/pdf": [".pdf"],
                                    "text/plain": [".txt"],
                                    "text/csv": [".csv"],
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                                      [".docx"],
                                    "application/json": [".json"],
                                  }}
                                  buttonOnly
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <PaperclipIcon className="h-4 w-4" />
                                    <span className="sr-only">Attach file</span>
                                  </Button>
                                </Dropzone>
                              </div>
                            )}
                            <Button
                              type="submit"
                              size="sm"
                              className="absolute bottom-3 right-3 h-8 w-8 p-0 rounded-full"
                              disabled={
                                sendMessageMutation.isPending || !field.value
                              }
                            >
                              {sendMessageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              <span className="sr-only">Send message</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="border rounded p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <PaperclipIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Attached files
                        </span>
                      </div>
                      <div className="space-y-1">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs bg-secondary/50 rounded p-1"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="truncate">{file.name}</span>
                              <span className="text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-5 w-5 p-0 rounded-full"
                            >
                              <XIcon className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          )}

          {task?.status !== "running" && (
            <div className="border-t p-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                {task?.status === "completed" ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Task completed</span>
                  </>
                ) : task?.status === "failed" ? (
                  <>
                    <XIcon className="h-4 w-4" />
                    <span>Task failed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Task {task?.status}</span>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryTask}
                  disabled={retryTaskMutation.isPending}
                  className="ml-2"
                >
                  {retryTaskMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Retry Task
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
