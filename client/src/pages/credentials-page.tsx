import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
// Add a frontend type definition for credentials
interface Credential {
  id: number;
  userId: number;
  name: string;
  type: string; // 'openai', 'anthropic', 'perplexity', etc.
  data: any; // Holds encrypted API keys and other secure data
  createdAt: Date;
  updatedAt: Date;
}
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Key,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { decrypt } from "@shared/crypto";

const credentialSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string().min(1, "Type is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().optional(),
  baseUrl: z.string().optional(),
  organizationId: z.string().optional(),
  additionalParams: z.string().optional(),
});

export default function CredentialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);
  const [showSecret, setShowSecret] = useState<Record<number, boolean>>({});

  // Fetch credentials
  const { data: credentials, isLoading } = useQuery({
    queryKey: ["/api/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/credentials");
      if (!res.ok) throw new Error("Failed to fetch credentials");
      return res.json() as Promise<Credential[]>;
    },
  });

  // Create credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: async (data: typeof credentialSchema._type) => {
      const transformedData = {
        name: data.name,
        type: data.type,
        data: {
          apiKey: data.apiKey,
          apiSecret: data.apiSecret || null,
          baseUrl: data.baseUrl || null,
          organizationId: data.organizationId || null,
          additionalParams: data.additionalParams
            ? JSON.parse(data.additionalParams)
            : null,
        },
      };
      const res = await apiRequest("POST", "/api/credentials", transformedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Credential created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setIsDeleteDialogOpen(false);
      setSelectedCredential(null);
      toast({
        title: "Success",
        description: "Credential deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<z.infer<typeof credentialSchema>>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      name: "",
      type: "",
      apiKey: "",
      apiSecret: "",
      baseUrl: "",
      organizationId: "",
      additionalParams: "",
    },
  });

  const handleCreateSubmit = (data: z.infer<typeof credentialSchema>) => {
    createCredentialMutation.mutate(data);
  };

  const handleDeleteClick = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCredential) {
      deleteCredentialMutation.mutate(selectedCredential.id);
    }
  };

  const toggleShowSecret = (id: number) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter credentials based on active tab
  const filteredCredentials =
    activeTab === "all"
      ? credentials
      : credentials?.filter((cred) => cred.type === activeTab);

  // Organize credentials by type for the tabs
  const credentialTypes = credentials
    ? Array.from(new Set(credentials.map((cred) => cred.type)))
    : [];

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">
            Manage your API keys and credentials for various services
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="mt-4 md:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Credential
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {credentialTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredCredentials?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Key className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No credentials found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Add your first credential to connect your AI agents to
                    external services.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Credential
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCredentials?.map((credential) => (
                  <Card key={credential.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-bold">
                            {credential.name}
                          </CardTitle>
                          <CardDescription>
                            {credential.type.charAt(0).toUpperCase() +
                              credential.type.slice(1)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(credential)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">API Key</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm bg-muted p-2 rounded w-full font-mono truncate">
                            {showSecret[credential.id]
                              ? "•••••••••••••••••••• (Temporarily hidden for security)"
                              : "••••••••••••••••••••••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleShowSecret(credential.id)}
                          >
                            {showSecret[credential.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {credential.data && typeof credential.data === 'object' && 
                       typeof credential.data === 'object' && 
                       'baseUrl' in credential.data && 
                       credential.data.baseUrl && (
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Base URL
                          </div>
                          <div className="text-sm bg-muted p-2 rounded font-mono truncate">
                            {String(credential.data.baseUrl)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Credential Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
            <DialogDescription>
              Add API keys and other credentials for connecting with external
              services.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My OpenAI API Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                        <SelectItem value="xai">xAI (Grok)</SelectItem>
                        <SelectItem value="azure">Azure OpenAI</SelectItem>
                        <SelectItem value="google">Google AI</SelectItem>
                        <SelectItem value="myfatoorah">MyFatoorah</SelectItem>
                        <SelectItem value="custom">Custom API</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization ID (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalParams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Additional Parameters (Optional, JSON format)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"param1": "value1", "param2": "value2"}'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCredentialMutation.isPending}
                >
                  {createCredentialMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the credential "
              {selectedCredential?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCredentialMutation.isPending}
            >
              {deleteCredentialMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
