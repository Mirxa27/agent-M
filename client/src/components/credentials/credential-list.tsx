import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Credential } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CredentialForm } from "@/components/credentials";
import { 
  Plus, 
  Search, 
  Key, 
  Trash2, 
  Loader2, 
  Eye,
  EyeOff,
  Copy, 
  Check,
  Edit
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CredentialListProps {
  agentId?: number; // Optional agentId for filtering credentials by agent
}

export default function CredentialList({ agentId }: CredentialListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch credentials (filtered by agentId if provided)
  const { 
    data: credentials = [], 
    isLoading,
    error
  } = useQuery<Credential[]>({
    queryKey: agentId ? ["/api/credentials", agentId] : ["/api/credentials"],
    queryFn: async () => {
      const url = agentId 
        ? `/api/credentials?agentId=${agentId}` 
        : '/api/credentials';
      const res = await apiRequest("GET", url);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch credentials");
      }
      return res.json();
    }
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const res = await apiRequest("DELETE", `/api/credentials/${credentialId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete credential");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: agentId ? ["/api/credentials", agentId] : ["/api/credentials"]
      });
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
    try {
      const res = await apiRequest("GET", `/api/credentials/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch credential details");
      }
      const data = await res.json();
      setSelectedCredential(data);
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Filter credentials based on search term
  const filteredCredentials = credentials.filter(credential => 
    credential.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credential.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color based on credential type
  const getCredentialColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'anthropic':
        return 'bg-purple-100 text-purple-800';
      case 'perplexity':
        return 'bg-blue-100 text-blue-800';
      case 'xai':
        return 'bg-red-100 text-red-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'database':
        return 'bg-emerald-100 text-emerald-800';
      case 'api':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-4">
        <p className="font-medium">Error loading credentials</p>
        <p className="text-sm">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search credentials..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>New Credential</span>
        </Button>
      </div>

      {/* Credential form dialog */}
      <CredentialForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        agentId={agentId}
      />

      {/* Credentials grid/list */}
      {filteredCredentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">{credential.name}</CardTitle>
                  <CardDescription>
                    <Badge className={`mt-1 ${getCredentialColor(credential.type)}`}>
                      {credential.type}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => fetchCredential(credential.id)}
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
                          This will permanently delete the credential "{credential.name}". 
                          This action cannot be undone.
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
              
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Key className="h-3.5 w-3.5 mr-1" />
                      <span>
                        {Object.keys(credential.data).length} stored fields
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Last updated: {new Date(credential.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Credential editing is coming soon",
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
          {searchQuery ? (
            <>
              <p className="text-lg font-medium text-gray-700">
                No credentials found matching "{searchQuery}"
              </p>
              <p className="text-gray-500 mt-1">
                Try adjusting your search or add a new credential
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">No credentials found</p>
              <p className="text-gray-500 mt-1">
                Add your first credential to use with your AI agents
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span>Add Credential</span>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}