import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Plan } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  PlusCircleIcon,
  BrainCircuitIcon,
  CoinsIcon,
  BotIcon,
  FilesIcon,
  ZapIcon,
  BoxesIcon,
  CreditCardIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Features definition for plans
type PlanFeature = {
  key: string;
  name: string;
  description: string;
  type: "boolean" | "number" | "string";
  icon: React.ReactNode;
};

const planFeatures: PlanFeature[] = [
  {
    key: "agents",
    name: "Agents",
    description: "Maximum number of AI agents allowed",
    type: "number",
    icon: <BotIcon className="h-4 w-4" />,
  },
  {
    key: "tasks",
    name: "Tasks",
    description: "Maximum number of tasks allowed per month",
    type: "number",
    icon: <ZapIcon className="h-4 w-4" />,
  },
  {
    key: "maxFilesSize",
    name: "Max Storage",
    description: "Maximum file storage in MB",
    type: "number",
    icon: <FilesIcon className="h-4 w-4" />,
  },
  {
    key: "templates",
    name: "Templates",
    description: "Maximum number of templates",
    type: "number",
    icon: <BoxesIcon className="h-4 w-4" />,
  },
  {
    key: "advancedModels",
    name: "Advanced Models",
    description: "Access to advanced AI models",
    type: "boolean",
    icon: <BrainCircuitIcon className="h-4 w-4" />,
  },
  {
    key: "customPrompts",
    name: "Custom Prompts",
    description: "Create custom AI prompts",
    type: "boolean",
    icon: <PlusCircleIcon className="h-4 w-4" />,
  },
  {
    key: "priority",
    name: "Priority Support",
    description: "Get prioritized support",
    type: "boolean",
    icon: <CreditCardIcon className="h-4 w-4" />,
  },
];

// Define form schema for creating/updating plans
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  interval: z.enum(["monthly", "yearly", "one-time"]).default("monthly"),
  currency: z.string().default("SAR"),
  isActive: z.boolean().default(true),
  features: z.record(z.union([z.boolean(), z.number(), z.string()])).optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function PlansPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const queryClient = useQueryClient();

  // Fetch all plans
  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/plans"],
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (plan: PlanFormValues) => {
      const res = await apiRequest("POST", "/api/admin/plans", plan);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create plan");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "The subscription plan has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({
      id,
      plan,
    }: {
      id: number;
      plan: Partial<PlanFormValues>;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/plans/${id}`, plan);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update plan");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "The subscription plan has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/plans/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete plan");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create form with default feature values
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      interval: "monthly",
      currency: "SAR",
      isActive: true,
      features: {
        agents: 2,
        tasks: 100,
        maxFilesSize: 100,
        templates: 5,
        advancedModels: false,
        customPrompts: false,
        priority: false,
      },
    },
  });

  // Edit form
  const editForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      interval: "monthly",
      currency: "SAR",
      isActive: true,
      features: {},
    },
  });

  // Reset form to default values
  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      interval: "monthly",
      currency: "SAR",
      isActive: true,
      features: {
        agents: 2,
        tasks: 100,
        maxFilesSize: 100,
        templates: 5,
        advancedModels: false,
        customPrompts: false,
        priority: false,
      },
    });
  };

  // Handle create submission
  const onCreateSubmit = (values: PlanFormValues) => {
    createPlanMutation.mutate(values);
  };

  // Handle edit submission
  const onEditSubmit = (values: PlanFormValues) => {
    if (selectedPlan) {
      updatePlanMutation.mutate({
        id: selectedPlan.id,
        plan: values,
      });
    }
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedPlan) {
      deletePlanMutation.mutate(selectedPlan.id);
    }
  };

  // Handle opening edit dialog
  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);

    // Parse features from string/JSON if needed
    let featuresObj = {};
    try {
      if (typeof plan.features === "string") {
        featuresObj = JSON.parse(plan.features);
      } else if (plan.features && typeof plan.features === "object") {
        featuresObj = plan.features;
      }
    } catch (err) {
      console.error("Error parsing plan features:", err);
    }

    editForm.reset({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      interval: plan.interval as "monthly" | "yearly" | "one-time",
      currency: "SAR", // Default to SAR as per requirements
      isActive: plan.isActive,
      features: featuresObj as Record<string, any>,
    });

    setIsEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Filter plans by search query
  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.description &&
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Format price with currency
  const formatPrice = (
    price: number,
    currency: string = "SAR",
    interval: string = "monthly",
  ) => {
    let formatted = `${price} ${currency}`;

    if (interval === "monthly") {
      formatted += "/month";
    } else if (interval === "yearly") {
      formatted += "/year";
    }

    return formatted;
  };

  // Get feature value from plan (handles different storage formats)
  const getFeatureValue = (plan: Plan, key: string) => {
    try {
      let features = {};

      if (typeof plan.features === "string") {
        features = JSON.parse(plan.features);
      } else if (plan.features && typeof plan.features === "object") {
        features = plan.features;
      }

      return features[key];
    } catch (err) {
      return undefined;
    }
  };

  // Render feature value based on its type
  const renderFeatureValue = (plan: Plan, feature: PlanFeature) => {
    const value = getFeatureValue(plan, feature.key);

    if (feature.type === "boolean") {
      return value === true ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <XIcon className="h-5 w-5 text-red-500" />
      );
    } else if (feature.type === "number") {
      return value !== undefined ? (
        <span className="font-medium">{value}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    } else {
      return value || <span className="text-muted-foreground">-</span>;
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Subscription Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Error loading plans:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">
            Subscription Plans
          </CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search plans..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No plans match your search"
                    : "No subscription plans found"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map((plan) => (
                    <Card key={plan.id} className="relative">
                      {!plan.isActive && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline">Inactive</Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>{plan.name}</span>
                          <span className="text-xl font-bold text-primary">
                            {plan.price > 0
                              ? formatPrice(plan.price, "SAR", plan.interval)
                              : "Free"}
                          </span>
                        </CardTitle>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {plan.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Accordion
                          type="single"
                          collapsible
                          defaultValue="features"
                        >
                          <AccordionItem value="features">
                            <AccordionTrigger>Features</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {planFeatures.map((feature) => (
                                  <div
                                    key={feature.key}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center">
                                      <div className="mr-2 text-primary">
                                        {feature.icon}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {feature.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {feature.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      {renderFeatureValue(plan, feature)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <EditIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(plan)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Subscription Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan for your users.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one-time">
                            One-time Payment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for a free plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the plan"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Plan Features</h3>

                {planFeatures.map((feature) => {
                  if (feature.type === "boolean") {
                    // Boolean feature (checkbox/switch)
                    return (
                      <FormField
                        key={feature.key}
                        control={form.control}
                        name={`features.${feature.key}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <div className="mr-2 text-primary">
                                  {feature.icon}
                                </div>
                                <FormLabel className="text-base">
                                  {feature.name}
                                </FormLabel>
                              </div>
                              <FormDescription>
                                {feature.description}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  } else {
                    // Number feature (input)
                    return (
                      <FormField
                        key={feature.key}
                        control={form.control}
                        name={`features.${feature.key}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center mb-2">
                              <div className="mr-2 text-primary">
                                {feature.icon}
                              </div>
                              <FormLabel>{feature.name}</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              {feature.description}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                })}
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Make this plan available to users
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Create Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update this subscription plan's details and features.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Interval</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one-time">
                            One-time Payment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for a free plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the plan"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Plan Features</h3>

                {planFeatures.map((feature) => {
                  if (feature.type === "boolean") {
                    // Boolean feature (checkbox/switch)
                    return (
                      <FormField
                        key={feature.key}
                        control={editForm.control}
                        name={`features.${feature.key}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <div className="mr-2 text-primary">
                                  {feature.icon}
                                </div>
                                <FormLabel className="text-base">
                                  {feature.name}
                                </FormLabel>
                              </div>
                              <FormDescription>
                                {feature.description}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={Boolean(field.value)}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  } else {
                    // Number feature (input)
                    return (
                      <FormField
                        key={feature.key}
                        control={editForm.control}
                        name={`features.${feature.key}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center mb-2">
                              <div className="mr-2 text-primary">
                                {feature.icon}
                              </div>
                              <FormLabel>{feature.name}</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              {feature.description}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }
                })}
              </div>

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Make this plan available to users
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin">◌</span>
                  )}
                  Update Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{selectedPlan?.name}"?
              This action cannot be undone and will affect any users currently
              subscribed to this plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending && (
                <span className="mr-2 h-4 w-4 animate-spin">◌</span>
              )}
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
