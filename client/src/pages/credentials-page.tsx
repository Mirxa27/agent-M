import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Credential, InsertCredential } from "@shared/schema";
import { Loader2, Plus, Search, Key, Edit, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";

const credentialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  data: z.record(z.string(), z.string()),
});

type CredentialFormData = z.infer<typeof credentialFormSchema>;

export default function CredentialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form setup
  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      name: "",
      type: "",
      data: {},
    },
  });

  // Get credentials data
  const { 
    data: credentials = [], 
    isLoading: isLoadingCredentials 
  } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  // Create credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: InsertCredential) => {
      const res = await apiRequest("POST", "/api/credentials", newCredential);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Credential created",
        description: "Your new credential has been securely stored",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      await apiRequest("DELETE", `/api/credentials/${credentialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      toast({
        title: "Credential deleted",
        description: "The credential has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create credential form submission
  const onSubmit = (data: CredentialFormData) => {
    if (!user) return;
    
    const newCredential: InsertCredential = {
      userId: user.id,
      name: data.name,
      type: data.type,
      data: data.data,
    };
    
    createCredentialMutation.mutate(newCredential);
  };

  // Helper function to add field to the form
  const addField = () => {
    const currentData = form.getValues('data') || {};
    const fieldName = `field_${Object.keys(currentData).length + 1}`;
    form.setValue('data', {
      ...currentData,
      [fieldName]: '',
    });
    form.trigger('data');
  };

  // Helper function to remove field from form
  const removeField = (fieldName: string) => {
    const currentData = form.getValues('data') || {};
    const { [fieldName]: removedField, ...rest } = currentData;
    form.setValue('data', rest);
    form.trigger('data');
  };

  // Toggle field visibility
  const toggleFieldVisibility = (field: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Copy field value to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get a single credential
  const fetchCredential = async (id: number) => {
    const res = await apiRequest("GET", `/api/credentials/${id}`);
    const data = await res.json();
    setSelectedCredential(data);
    return data;
  };

  // Filter credentials based on search term
  const filteredCredentials = credentials.filter(credential => 
    credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credential.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get icon for credential type
  const getCredentialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'fa-envelope';
      case 'api':
        return 'fa-code';
      case 'database':
        return 'fa-database';
      case 'wordpress':
        return 'fa-wordpress';
      case 'google':
        return 'fa-google';
      default:
        return 'fa-key';
    }
  };

  // Get color for credential type
  const getCredentialColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'bg-blue-100 text-blue-700';
      case 'api':
        return 'bg-purple-100 text-purple-700';
      case 'database':
        return 'bg-green-100 text-green-700';
      case 'wordpress':
        return 'bg-secondary-100 text-secondary-700';
      case 'google':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Loading state
  if (isLoadingCredentials) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Credentials"
      subtitle="Securely store and manage your credentials"
    >
      {/* Actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search credentials..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>New Credential</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>
                Securely store your credentials for use with your AI agents.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Gmail Account" {...field} />
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
                      <FormLabel>Credential Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a credential type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="api">API Key</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="wordpress">WordPress</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Credential Fields</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addField}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(form.getValues('data') || {}).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <Input 
                          placeholder="Field name"
                          defaultValue={key}
                          onChange={(e) => {
                            const currentData = form.getValues('data') || {};
                            const { [key]: oldValue, ...rest } = currentData;
                            form.setValue('data', {
                              ...rest,
                              [e.target.value]: oldValue
                            });
                          }}
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Value"
                          defaultValue={value}
                          type="password"
                          onChange={(e) => {
                            const currentData = form.getValues('data') || {};
                            form.setValue('data', {
                              ...currentData,
                              [key]: e.target.value
                            });
                          }}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeField(key)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createCredentialMutation.isPending}
                  >
                    {createCredentialMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Credential
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials grid */}
      {filteredCredentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">{credential.name}</CardTitle>
                  <CardDescription>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getCredentialColor(credential.type)}`}>
                      <i className={`fa-solid ${getCredentialIcon(credential.type)} mr-1`}></i>
                      {credential.type}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      // View credential details (would fetch from API)
                      toast({
                        title: "View credential",
                        description: "This functionality is coming soon",
                      });
                    }}
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the credential "{credential.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteCredentialMutation.mutate(credential.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteCredentialMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(credential.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span className="text-sm">Encrypted & securely stored</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // Open dialog to view/edit credential
                    toast({
                      title: "Edit credential",
                      description: "This functionality is coming soon",
                    });
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Credential
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          {searchTerm ? (
            <>
              <p className="text-lg font-medium text-gray-700">No credentials found matching "{searchTerm}"</p>
              <p className="text-gray-500 mt-1">Try adjusting your search or add a new credential</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">No credentials found</p>
              <p className="text-gray-500 mt-1">Add your first credential to use with your AI agents</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span>Add Credential</span>
              </Button>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
