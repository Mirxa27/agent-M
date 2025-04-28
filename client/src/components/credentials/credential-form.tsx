import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Credential form schema
const credentialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Please select a credential type"),
  data: z.record(z.string()),
});

// Types for the form values
type CredentialFormValues = z.infer<typeof credentialSchema>;

// Types for the different credential form fields
const credentialFormFields: Record<string, { label: string, type: string, required: boolean, placeholder: string }[]> = {
  openai: [
    { label: "API Key", type: "password", required: true, placeholder: "sk-..." },
  ],
  anthropic: [
    { label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
  ],
  perplexity: [
    { label: "API Key", type: "password", required: true, placeholder: "pplx-..." },
  ],
  xai: [
    { label: "API Key", type: "password", required: true, placeholder: "..." },
  ],
  custom: [
    { label: "Key", type: "text", required: true, placeholder: "API Key Name" },
    { label: "Value", type: "password", required: true, placeholder: "API Key Value" },
  ],
};

interface CredentialFormProps {
  onSuccess?: () => void;
  defaultValues?: CredentialFormValues;
  isEditing?: boolean;
  credentialId?: number;
}

export function CredentialForm({ 
  onSuccess, 
  defaultValues = { name: "", type: "", data: {} },
  isEditing = false,
  credentialId 
}: CredentialFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Initialize the form with default values
  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues,
  });

  // If editing, fetch the credential data
  const { data: existingCredential, isLoading: isLoadingCredential } = useQuery({
    queryKey: ["/api/credentials", credentialId],
    queryFn: async () => {
      if (!isEditing || !credentialId) return null;
      const response = await fetch(`/api/credentials/${credentialId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch credential");
      }
      return response.json();
    },
    enabled: isEditing && !!credentialId,
  });

  // Update form when existing credential is loaded
  useEffect(() => {
    if (existingCredential && isEditing) {
      form.reset({
        name: existingCredential.name,
        type: existingCredential.type,
        data: existingCredential.data || {},
      });
    }
  }, [existingCredential, form, isEditing]);

  // Create mutation
  const createCredential = useMutation({
    mutationFn: async (data: CredentialFormValues) => {
      const res = await apiRequest("POST", "/api/credentials", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential created",
        description: "Your credential has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      if (onSuccess) onSuccess();
      form.reset({ name: "", type: "", data: {} });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateCredential = useMutation({
    mutationFn: async (data: CredentialFormValues) => {
      const res = await apiRequest("PATCH", `/api/credentials/${credentialId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential updated",
        description: "Your credential has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials", credentialId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: CredentialFormValues) => {
    if (isEditing && credentialId) {
      updateCredential.mutate(values);
    } else {
      createCredential.mutate(values);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Show loading state when fetching credential data
  if (isEditing && isLoadingCredential) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Determine the current form fields based on selected type
  const selectedType = form.watch("type");
  const currentFields = selectedType ? credentialFormFields[selectedType] || [] : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My API Key" {...field} />
              </FormControl>
              <FormDescription>
                A friendly name to identify this credential
              </FormDescription>
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
                disabled={isEditing}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credential type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                  <SelectItem value="xai">xAI</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The type of credential you're adding
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType && currentFields.map((field, index) => (
          <FormField
            key={`${field.label}-${index}`}
            control={form.control}
            name={`data.${field.label.toLowerCase().replace(/ /g, '_')}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword[field.label] ? "text" : field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      {...formField}
                    />
                  </FormControl>
                  {field.type === "password" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => togglePasswordVisibility(field.label)}
                    >
                      {showPassword[field.label] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createCredential.isPending || updateCredential.isPending}
        >
          {createCredential.isPending || updateCredential.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Credential" : "Create Credential"
          )}
        </Button>
      </form>
    </Form>
  );
}