import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Key, MoreHorizontal, PlusCircle, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CredentialForm } from "./credential-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Provider icon mapping
const ProviderIconMap: Record<string, string> = {
  openai: "🤖",
  anthropic: "🧠",
  perplexity: "🔍",
  xai: "🔮",
  custom: "🔑",
};

export function CredentialList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  type Credential = {
    id: number;
    name: string;
    type: string;
  };

  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);

  // Fetch credentials
  const {
    data: credentials,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/credentials"],
    queryFn: async () => {
      const response = await fetch("/api/credentials");
      if (!response.ok) {
        throw new Error("Failed to fetch credentials");
      }
      return response.json();
    },
  });

  // Delete mutation
  const deleteCredential = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/credentials/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Credential deleted",
        description: "The credential has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit
  const handleEdit = (credential: Credential) => {
    setSelectedCredential(credential);
    setEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (credential: Credential) => {
    setSelectedCredential(credential);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedCredential) {
      deleteCredential.mutate(selectedCredential.id);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse text-primary">Loading credentials...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Error loading credentials</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["/api/credentials"] })
          }
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>
              Manage your API keys and authentication credentials securely.
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>
                  Create a new credential for your AI agents to use.
                </DialogDescription>
              </DialogHeader>
              <CredentialForm onSuccess={() => setCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {credentials && credentials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((credential: Credential) => (
                <Card key={credential.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">
                          {ProviderIconMap[credential.type] || "🔑"}
                        </span>
                        <div>
                          <CardTitle className="text-base">
                            {credential.name}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {credential.type}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEdit(credential)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(credential)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Securely encrypted credential
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No credentials yet</h3>
              <p className="text-muted-foreground mb-4">
                Add credentials to securely store API keys and access tokens for
                your agents.
              </p>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Credential
                </Button>
              </DialogTrigger>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
            <DialogDescription>
              Update your credential details.
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <CredentialForm
              onSuccess={() => setEditDialogOpen(false)}
              defaultValues={{
                name: selectedCredential.name,
                type: selectedCredential.type,
                data: {}, // The actual data will be fetched when needed
              }}
              isEditing={true}
              credentialId={selectedCredential.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the credential and remove it from any
              agents using it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCredential.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCredential.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
