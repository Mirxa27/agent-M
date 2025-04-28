import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InsertCredential } from "@shared/schema";
import { Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const credentialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  data: z.record(z.string(), z.string()),
  agentId: z.number().optional(),
});

export type CredentialFormData = z.infer<typeof credentialFormSchema>;

interface CredentialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: CredentialFormData;
  agentId?: number; // Optional agent ID for associating credentials with agents
}

export default function CredentialForm({ 
  open, 
  onOpenChange, 
  initialValues,
  agentId
}: CredentialFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  // Form setup
  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: initialValues || {
      name: "",
      type: "",
      data: {},
      agentId: agentId,
    },
  });

  // Create credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: InsertCredential) => {
      const res = await apiRequest("POST", "/api/credentials", newCredential);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create credential");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      // If agentId was provided, also invalidate the agent's credentials query
      if (agentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/credentials", agentId] });
      }
      onOpenChange(false);
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

  // Handle form submission
  const onSubmit = (data: CredentialFormData) => {
    if (!user) return;
    
    const newCredential: InsertCredential = {
      userId: user.id,
      name: data.name,
      type: data.type,
      data: data.data,
      agentId: data.agentId,
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
  const toggleFieldVisibility = (fieldName: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Preset key templates based on credential type
  const getPresetFields = (type: string) => {
    switch (type) {
      case "openai":
        return {
          api_key: "",
          organization_id: "",
        };
      case "anthropic":
        return {
          api_key: "",
        };
      case "perplexity":
        return {
          api_key: "",
        };
      case "xai":
        return {
          api_key: "",
        };
      case "email":
        return {
          email: "",
          password: "",
          smtp_host: "",
          smtp_port: "",
        };
      case "database":
        return {
          host: "",
          port: "",
          username: "",
          password: "",
          database: "",
        };
      case "api":
        return {
          api_key: "",
          api_secret: "",
          base_url: "",
        };
      default:
        return {};
    }
  };

  // Handle credential type change and set preset fields
  const handleCredentialTypeChange = (type: string) => {
    const presetFields = getPresetFields(type);
    form.setValue('data', presetFields);
    form.trigger('data');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? "Edit Credential" : "Add New Credential"}
          </DialogTitle>
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
                    <Input placeholder="My OpenAI API Keys" {...field} />
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCredentialTypeChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a credential type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                      <SelectItem value="xai">xAI</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api">API</SelectItem>
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
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Value"
                        defaultValue={value}
                        type={visibleFields[key] ? "text" : "password"}
                        onChange={(e) => {
                          const currentData = form.getValues('data') || {};
                          form.setValue('data', {
                            ...currentData,
                            [key]: e.target.value
                          });
                        }}
                        className="pr-8 w-full"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleFieldVisibility(key)}
                      >
                        {visibleFields[key] ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
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
  );
}