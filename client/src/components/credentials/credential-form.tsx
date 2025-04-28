import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Define the credential form schema
const credentialSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  type: z.string(),
  data: z.record(z.any())
});

type CredentialFormValues = z.infer<typeof credentialSchema>;

// Pre-defined credential templates with required fields
const credentialTemplates = {
  openai: {
    api_key: ""
  },
  anthropic: {
    api_key: ""
  },
  perplexity: {
    api_key: ""
  },
  xai: {
    api_key: ""
  },
  custom: {}
};

// Friendly names for credential types
const credentialTypeNames = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  perplexity: "Perplexity",
  xai: "xAI (Grok)",
  custom: "Custom"
};

// Default values for each credential type
const getDefaultValues = (type: string = "custom") => {
  return {
    name: `My ${credentialTypeNames[type]} Credential`,
    type,
    data: { ...credentialTemplates[type] }
  };
};

interface CredentialFormProps {
  onSuccess?: () => void;
  defaultValues?: CredentialFormValues;
  isEditing?: boolean;
  credentialId?: number;
}

export function CredentialForm({ 
  onSuccess, 
  defaultValues = getDefaultValues(), 
  isEditing = false,
  credentialId 
}: CredentialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  
  // Setup form with default values
  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues
  });
  
  // Current selected type value
  const currentType = form.watch("type");
  
  // Handle mutations
  const createCredential = useMutation({
    mutationFn: async (data: CredentialFormValues) => {
      const response = await apiRequest("POST", "/api/credentials", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential created",
        description: "Your credential has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create credential",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const updateCredential = useMutation({
    mutationFn: async (data: CredentialFormValues) => {
      const response = await apiRequest("PATCH", `/api/credentials/${credentialId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential updated",
        description: "Your credential has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update credential",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: CredentialFormValues) => {
    if (isEditing && credentialId) {
      updateCredential.mutate(values);
    } else {
      createCredential.mutate(values);
    }
  };

  // Toggle field visibility
  const toggleFieldVisibility = (field: string) => {
    setVisibleFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field) 
        : [...prev, field]
    );
  };
  
  // Handle credential type change
  const handleTypeChange = (type: string) => {
    // Get current form data
    const currentData = form.getValues();
    
    // Create new form data with selected type template
    const newData = {
      name: `My ${credentialTypeNames[type]} Credential`,
      type: type,
      data: { ...credentialTemplates[type] }
    };
    
    // If editing, preserve the name
    if (isEditing) {
      newData.name = currentData.name;
    }
    
    // Reset the form with new template
    form.reset(newData);
  };
  
  // Get credential data fields based on type
  const getCredentialDataFields = () => {
    const data = form.getValues().data || {};
    return Object.keys(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Credential" : "Add New Credential"}</CardTitle>
        <CardDescription>
          Securely store API keys and credentials for your AI agents to use.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My API Credential" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this credential.
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTypeChange(value);
                      }}
                      defaultValue={field.value}
                      value={field.value}
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
                        <SelectItem value="xai">xAI (Grok)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of service this credential is for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Credential Details</h3>
              
              {getCredentialDataFields().map((field) => (
                <FormField
                  key={field}
                  control={form.control}
                  name={`data.${field}`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{field.replace(/_/g, ' ')}</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input 
                            type={visibleFields.includes(field) ? "text" : "password"} 
                            placeholder={`Enter ${field}`} 
                            {...formField} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => toggleFieldVisibility(field)}
                        >
                          {visibleFields.includes(field) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormDescription>
                        Securely stored and encrypted.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              {currentType === "custom" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentData = form.getValues().data || {};
                    form.setValue("data", { 
                      ...currentData, 
                      [`field_${Object.keys(currentData).length + 1}`]: "" 
                    });
                  }}
                >
                  Add Custom Field
                </Button>
              )}
            </div>
            
            <CardFooter className="flex justify-end px-0">
              <Button 
                type="submit"
                disabled={createCredential.isPending || updateCredential.isPending}
              >
                {(createCredential.isPending || updateCredential.isPending) && (
                  <span className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update" : "Save"} Credential
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}