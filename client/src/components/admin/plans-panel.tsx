import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plan, InsertPlan } from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  MoreHorizontal, 
  Check, 
  X, 
  CreditCard,
  Search,
  BarChart4,
  Users as UsersIcon,
  Zap,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Switch } from "@/components/ui/switch";
import {
  Badge,
} from "@/components/ui/badge";

// Define the form schema for plans
const planFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  interval: z.string().min(1, "Interval is required"),
  features: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planFormSchema>;

// Feature structure for plans
const featuresList = [
  { id: "agents", name: "AI Agents", type: "number" },
  { id: "tasks", name: "Tasks per month", type: "number" },
  { id: "templates", name: "Templates", type: "number" },
  { id: "fileStorage", name: "File Storage (GB)", type: "number" },
  { id: "apiAccess", name: "API Access", type: "boolean" },
  { id: "prioritySupport", name: "Priority Support", type: "boolean" },
  { id: "teamMembers", name: "Team Members", type: "number" },
  { id: "customBranding", name: "Custom Branding", type: "boolean" },
  { id: "advancedAnalytics", name: "Advanced Analytics", type: "boolean" },
  { id: "dedicatedManager", name: "Dedicated Account Manager", type: "boolean" },
];

export default function PlansPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Record<string, any>>({
    agents: 2,
    tasks: 100,
    templates: 5,
    fileStorage: 1,
    apiAccess: false,
    prioritySupport: false,
    teamMembers: 1,
    customBranding: false,
    advancedAnalytics: false,
    dedicatedManager: false,
  });

  // Form setup for creating plan
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      interval: "monthly",
      features: features,
      isActive: true,
    },
  });

  // Form setup for editing plan
  const editForm = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      interval: "monthly",
      features: {},
      isActive: true,
    },
  });

  // Get plans data
  const { 
    data: plans = [], 
    isLoading: isLoadingPlans 
  } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (newPlan: InsertPlan) => {
      const res = await apiRequest("POST", "/api/admin/plans", newPlan);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsCreateDialogOpen(false);
      form.reset({ features: features });
      toast({
        title: "Plan created",
        description: "The subscription plan has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<InsertPlan> }) => {
      const res = await apiRequest("PATCH", `/api/admin/plans/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Plan updated",
        description: "The subscription plan has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/admin/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle plan active status
  const togglePlanStatus = (plan: Plan) => {
    updatePlanMutation.mutate({
      id: plan.id,
      updates: {
        isActive: !plan.isActive,
      },
    });
  };

  // Handle creating a new plan
  const onSubmit = (data: PlanFormData) => {
    // Combine form data with features
    const planData = {
      ...data,
      features: features,
    };
    
    createPlanMutation.mutate(planData as InsertPlan);
  };

  // Handle editing a plan
  const onEditSubmit = (data: PlanFormData) => {
    if (!selectedPlan) return;
    
    // Combine form data with features
    const planData = {
      ...data,
      features: features,
    };
    
    updatePlanMutation.mutate({
      id: selectedPlan.id,
      updates: planData as InsertPlan,
    });
  };

  // Handle edit button click
  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    
    // Set features state from plan
    setFeatures(plan.features || {});
    
    // Prefill the edit form
    editForm.reset({
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      isActive: plan.isActive,
    });
    
    setIsEditDialogOpen(true);
  };

  // Update feature value
  const updateFeature = (id: string, value: any) => {
    setFeatures(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Filter plans based on search term
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format price
  const formatPrice = (price: number, interval: string) => {
    return `${price} SAR/${interval === 'monthly' ? 'mo' : 'yr'}`;
  };

  // Format feature value
  const formatFeatureValue = (feature: any, id: string) => {
    const featureObj = featuresList.find(f => f.id === id);
    
    if (featureObj?.type === 'boolean') {
      return feature ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    }
    
    if (id === 'fileStorage') {
      return `${feature} GB`;
    }
    
    if (feature === -1) {
      return "Unlimited";
    }
    
    return feature;
  };

  // Get badge color for interval
  const getIntervalBadgeColor = (interval: string) => {
    switch (interval) {
      case 'monthly':
        return 'bg-blue-100 text-blue-800';
      case 'yearly':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search plans..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Plan</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Create a new subscription plan for your platform
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Professional" {...field} />
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
                              <SelectValue placeholder="Interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SAR)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input type="number" placeholder="99" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Price in Saudi Riyal (SAR)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Plan Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {featuresList.map(feature => (
                      <div key={feature.id} className="flex items-center justify-between">
                        <span className="text-sm">{feature.name}</span>
                        {feature.type === 'boolean' ? (
                          <Switch
                            checked={!!features[feature.id]}
                            onCheckedChange={(checked) => updateFeature(feature.id, checked)}
                          />
                        ) : (
                          <div className="w-24">
                            <Input
                              type="number"
                              value={features[feature.id] || 0}
                              onChange={(e) => updateFeature(feature.id, parseInt(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                            <p className="text-xs text-gray-500 mt-1">-1 for unlimited</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Make this plan available for subscription
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
                    type="submit" 
                    disabled={createPlanMutation.isPending}
                  >
                    {createPlanMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription>
                Update this subscription plan
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
                {/* Same form fields as the create form, but with edit values */}
                {/* ... (Include similar form fields as in the create form) */}
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Manage your platform's subscription plans and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">{plan.price} SAR</div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntervalBadgeColor(plan.interval)}`}>
                        {plan.interval === 'monthly' ? 'Monthly' : 'Yearly'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.features && plan.features.agents && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            <span>{plan.features.agents === -1 ? 'Unlimited' : plan.features.agents} agents</span>
                          </Badge>
                        )}
                        {plan.features && plan.features.tasks && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>{plan.features.tasks === -1 ? 'Unlimited' : plan.features.tasks} tasks</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`flex h-2 w-2 rounded-full mr-2 ${plan.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span>{plan.isActive ? 'Active' : 'Disabled'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePlanStatus(plan)}>
                            {plan.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              window.open(`/admin/plans/${plan.id}/analytics`, '_blank');
                            }}
                          >
                            <BarChart4 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              window.open(`/admin/plans/${plan.id}/subscribers`, '_blank');
                            }}
                          >
                            <UsersIcon className="h-4 w-4 mr-2" />
                            View Subscribers
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                <span className="text-red-500">Delete</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the plan "{plan.name}". This action cannot be undone. Existing subscribers will not be affected.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deletePlanMutation.mutate(plan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletePlanMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
                      {searchTerm ? (
                        <>
                          <p className="font-medium text-gray-700">No plans found matching "{searchTerm}"</p>
                          <p className="text-gray-500 text-sm">Try adjusting your search</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700">No subscription plans configured</p>
                          <p className="text-gray-500 text-sm">Add your first plan to start offering subscriptions</p>
                          <Button 
                            onClick={() => setIsCreateDialogOpen(true)} 
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Plan
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}