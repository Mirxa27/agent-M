import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plan } from "@shared/schema"; // Plan type from Drizzle schema
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BotIcon,
  BoxesIcon,
  BrainCircuitIcon,
  CheckIcon,
  CreditCardIcon,
  EditIcon,
  FilesIcon,
  PlusCircleIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Features definition for plans
type PlanFeatureSpec = {
  key: string;
  name: string;
  description: string;
  type: "boolean" | "number" | "string";
  icon: React.ReactNode;
};

const planFeatureSpecs: PlanFeatureSpec[] = [
  { key: "agents", name: "Agents", description: "Max agents", type: "number", icon: <BotIcon className="h-4 w-4" /> },
  { key: "tasks", name: "Tasks", description: "Max tasks/month", type: "number", icon: <ZapIcon className="h-4 w-4" /> },
  { key: "maxFilesSize", name: "Max Storage (MB)", description: "Max file storage", type: "number", icon: <FilesIcon className="h-4 w-4" /> },
  { key: "templates", name: "Templates", description: "Max templates", type: "number", icon: <BoxesIcon className="h-4 w-4" /> },
  { key: "advancedModels", name: "Advanced Models", description: "Access advanced AI", type: "boolean", icon: <BrainCircuitIcon className="h-4 w-4" /> },
  { key: "customPrompts", name: "Custom Prompts", description: "Create custom prompts", type: "boolean", icon: <PlusCircleIcon className="h-4 w-4" /> },
  { key: "priority", name: "Priority Support", description: "Prioritized support", type: "boolean", icon: <CreditCardIcon className="h-4 w-4" /> },
];

// Define form schema for creating/updating plans
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(), // This will be stored in plan.features.description
  price: z.coerce.number().min(0, "Price must be at least 0"),
  interval: z.enum(["monthly", "yearly", "one-time"]).default("monthly"),
  currency: z.string().default("SAR"), // This will be stored in plan.features.currency
  isActive: z.boolean().default(true),
  features: z.record(z.union([z.boolean(), z.number(), z.string()])).optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

// Default features values based on planFeatureSpecs
const defaultFeaturesSubObject = planFeatureSpecs.reduce((acc, feature) => {
  if (feature.type === "number") acc[feature.key] = 0;
  else if (feature.type === "boolean") acc[feature.key] = false;
  else acc[feature.key] = "";
  return acc;
}, {} as Record<string, string | number | boolean>);

// Helper function to format price
const formatPrice = (price: number, currency: string, interval: string) => {
  return `${price} ${currency}/${interval}`;
};

// Helper function to render feature value in table
const renderFeatureValueInTable = (plan: Plan, featureSpec: PlanFeatureSpec) => {
  const planFeaturesData = plan.features as Record<string, any> || {};
  const value = planFeaturesData[featureSpec.key];
  if (featureSpec.type === "boolean") {
    return value ? <CheckIcon className="text-green-500 h-4 w-4" /> : <XIcon className="text-red-500 h-4 w-4" />;
  }
  return value?.toString() || "-";
};


export default function PlansPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const queryClient = useQueryClient();

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery<Plan[], Error>({
    queryKey: ["/api/admin/plans"],
    queryFn: async () => apiRequest<Plan[]>("GET", "/api/admin/plans"),
  });

  const createPlanMutation = useMutation<Plan, Error, PlanFormValues>({
    mutationFn: async (planData: PlanFormValues) => {
      const { description, currency, features, ...restOfPlanData } = planData;
      const featuresPayload = {
        ...(features || {}),
        description: description || "",
        currency: currency || "SAR",
      };
      return apiRequest<Plan>("POST", "/api/admin/plans", { ...restOfPlanData, features: featuresPayload });
    },
    onSuccess: () => {
      toast({ title: "Plan created", description: "Subscription plan created." });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Error creating plan", description: err.message, variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation<Plan, Error, { id: number; plan: Partial<PlanFormValues> }>({
    mutationFn: async ({ id, plan: planData }) => {
      const { description, currency, features, ...restOfPlanData } = planData;
      const featuresPayload: Record<string, any> = { ...(features || {}) };
      if (description !== undefined) featuresPayload.description = description;
      if (currency !== undefined) featuresPayload.currency = currency;

      return apiRequest<Plan>("PATCH", `/api/admin/plans/${id}`, { ...restOfPlanData, features: featuresPayload });
    },
    onSuccess: () => {
      toast({ title: "Plan updated", description: "Subscription plan updated." });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating plan", description: err.message, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation<boolean, Error, number>({
    mutationFn: async (id: number) => {
      // apiRequest already parses the response or handles non-JSON responses.
      // If DELETE returns 204 No Content, apiRequest might return undefined or an empty object.
      await apiRequest("DELETE", `/api/admin/plans/${id}`);
      return true; // Assuming success if apiRequest doesn't throw an error.
    },
    onSuccess: () => {
      toast({ title: "Plan deleted", description: "Subscription plan deleted." });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error deleting plan", description: err.message, variant: "destructive" });
    },
  });

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      interval: "monthly",
      currency: "SAR",
      isActive: true,
      features: { ...defaultFeaturesSubObject },
    },
  });

  const editForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
  });

  useEffect(() => {
    if (selectedPlan) {
      const planFeaturesData = selectedPlan.features as Record<string, any> || {};

      const currentFeaturesForForm = planFeatureSpecs.reduce((acc, pf) => {
        const val = planFeaturesData[pf.key];
        if (pf.type === "number") acc[pf.key] = typeof val === 'number' ? val : (defaultFeaturesSubObject[pf.key] || 0);
        else if (pf.type === "boolean") acc[pf.key] = typeof val === 'boolean' ? val : (defaultFeaturesSubObject[pf.key] || false);
        else acc[pf.key] = typeof val === 'string' ? val : (defaultFeaturesSubObject[pf.key] || "");
        return acc;
      }, {} as Record<string, any>);

      editForm.reset({
        name: selectedPlan.name,
        price: selectedPlan.price,
        interval: (selectedPlan.interval && ["monthly", "yearly", "one-time"].includes(selectedPlan.interval) ? selectedPlan.interval : "monthly") as PlanFormValues['interval'],
        isActive: selectedPlan.isActive,
        description: (planFeaturesData.description as string) || "",
        currency: (planFeaturesData.currency as string) || "SAR",
        features: currentFeaturesForForm,
      });
    }
  }, [selectedPlan, editForm]);

  const handleCreate = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      interval: "monthly",
      currency: "SAR",
      isActive: true,
      features: { ...defaultFeaturesSubObject },
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (planToEdit: Plan) => {
    setSelectedPlan(planToEdit);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (planToDelete: Plan) => {
    setSelectedPlan(planToDelete);
    setIsDeleteDialogOpen(true);
  };

  const onCreateSubmit = (values: PlanFormValues) => {
    createPlanMutation.mutate(values);
  };

  const onEditSubmit = (values: PlanFormValues) => {
    if (selectedPlan) {
      updatePlanMutation.mutate({ id: selectedPlan.id, plan: values });
    }
  };

  const onDeleteConfirm = () => {
    if (selectedPlan) {
      deletePlanMutation.mutate(selectedPlan.id);
    }
  };

  const filteredPlans = plans.filter((planItem: Plan) =>
    planItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const renderFormFields = (currentForm: typeof form | typeof editForm) => (
    <>
      <FormField
        control={currentForm.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="E.g., Basic, Pro" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={currentForm.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (stored in features)</FormLabel>
            <FormControl><Textarea placeholder="Plan description" {...field} value={field.value || ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={currentForm.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={currentForm.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency (stored in features)</FormLabel>
              <FormControl><Input placeholder="SAR" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={currentForm.control}
        name="interval"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Interval</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={currentForm.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <FormLabel>Active</FormLabel>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )}
      />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="features">
          <AccordionTrigger>Specific Features</AccordionTrigger>
          <AccordionContent>
            {planFeatureSpecs.map((featureSpec) => (
              <FormField
                key={featureSpec.key}
                control={currentForm.control}
                name={`features.${featureSpec.key}` as const}
                render={({ field: featureField }) => (
                  <FormItem className="mb-2">
                    <FormLabel>{featureSpec.name}</FormLabel>
                    <FormControl>
                      {featureSpec.type === "boolean" ? (
                        <Switch
                          checked={!!featureField.value}
                          onCheckedChange={featureField.onChange}
                        />
                      ) : featureSpec.type === "number" ? (
                        <Input
                          type="number"
                          name={featureField.name}
                          onBlur={featureField.onBlur}
                          ref={featureField.ref}
                          value={Number(featureField.value ?? 0)}
                          onChange={e => featureField.onChange(parseFloat(e.target.value) || 0)}
                        />
                      ) : ( // string
                        <Input
                          type="text"
                          name={featureField.name}
                          onBlur={featureField.onBlur}
                          ref={featureField.ref}
                          value={String(featureField.value ?? "")}
                          onChange={featureField.onChange}
                        />
                      )}
                    </FormControl>
                    <FormDescription>{featureSpec.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="relative w-full max-w-xs">
            <Input
              type="search"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <Button onClick={handleCreate}><PlusIcon className="mr-2 h-4 w-4" /> Create Plan</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length > 0 ? (
              filteredPlans.map((planItem) => {
                const planFeaturesData = planItem.features as Record<string, any> || {};
                const currency = (planFeaturesData.currency as string) || "SAR";
                const description = (planFeaturesData.description as string) || "-";
                return (
                  <TableRow key={planItem.id}>
                    <TableCell>{planItem.name}</TableCell>
                    <TableCell>{formatPrice(planItem.price, currency, planItem.interval)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{description}</TableCell>
                    <TableCell>
                      <Badge variant={planItem.isActive ? "default" : "outline"}>
                        {planItem.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(planItem)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(planItem)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center">No plans found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Create New Plan</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
              {renderFormFields(form)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPlanMutation.isPending}>Create Plan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Edit Plan</DialogTitle></DialogHeader>
          {selectedPlan && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                {renderFormFields(editForm)}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updatePlanMutation.isPending}>Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Plan</DialogTitle></DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the plan "{selectedPlan?.name}"? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onDeleteConfirm} disabled={deletePlanMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
