import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

// UI Components
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Plan = {
  id: number;
  name: string;
  price: number;
  interval: string;
  features: any; // Features stored as JSON
  isActive: boolean;
};

type SubscriptionStatus = {
  plan: string;
  planExpiresAt: string | null;
  planDetails: Plan | null;
};

// Simplified placeholder component for subscription pages
export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planInterval, setPlanInterval] = useState<'monthly' | 'yearly'>('monthly');
  
  // Fetch available plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/plans"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/plans');
      const plans = await res.json();
      return plans as Plan[];
    }
  });
  
  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription');
      return await res.json() as SubscriptionStatus;
    }
  });
  
  // Create payment session mutation
  const createPaymentSession = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/payments/create-session', { planId });
      return await res.json() as { paymentUrl: string; sessionId: string };
    },
    onSuccess: (data) => {
      // Redirect to payment gateway
      window.location.href = data.paymentUrl;
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter active plans and sort by price
  const activePlans = plans?.filter(plan => plan.isActive) || [];
  const sortedPlans = [...activePlans].sort((a, b) => a.price - b.price);
  
  // Filter plans by interval
  const filteredPlans = sortedPlans.filter(plan => 
    plan.interval.toLowerCase() === planInterval
  );
  
  // Handle subscription purchase
  const handleSubscribe = (planId: number) => {
    createPaymentSession.mutate(planId);
  };
  
  // Check if user is already subscribed to this plan
  const isCurrentPlan = (planName: string) => {
    if (!subscription) return false;
    return subscription.plan.toLowerCase() === planName.toLowerCase();
  };
  
  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10 mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Choose Your Subscription Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of Mirxa.io with our flexible subscription plans. 
          Choose the plan that best suits your needs.
        </p>
      </div>
      
      {/* Current subscription status */}
      {subscription && (
        <div className="mb-10">
          <Alert className={subscription.plan !== 'free' ? 'bg-primary/10' : undefined}>
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Your current plan: {subscription.plan}</AlertTitle>
            <AlertDescription>
              {subscription.plan !== 'free' && subscription.planExpiresAt ? (
                <>
                  Your subscription expires on {new Date(subscription.planExpiresAt).toLocaleDateString()}.
                </>
              ) : (
                <>
                  You are currently on the free plan with limited features.
                  Upgrade for full access to all Mirxa.io capabilities.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Plan interval switcher */}
      <div className="flex justify-center mb-8">
        <Tabs defaultValue="monthly" onValueChange={(v) => setPlanInterval(v as 'monthly' | 'yearly')}>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly (Save 16%)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Pricing cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${isCurrentPlan(plan.name) ? 'border-primary' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>{plan.interval === 'monthly' ? 'Monthly billing' : 'Annual billing'}</CardDescription>
                </div>
                
                {isCurrentPlan(plan.name) && (
                  <Badge className="bg-primary hover:bg-primary">Current</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price} SAR</span>
                <span className="text-muted-foreground">/{plan.interval === 'monthly' ? 'month' : 'year'}</span>
              </div>
              
              <ul className="space-y-2">
                {Object.entries(plan.features || {}).map(([key, value]) => (
                  <li key={key} className="flex items-start">
                    <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{key}: {value.toString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                disabled={
                  isCurrentPlan(plan.name) || 
                  createPaymentSession.isPending
                }
                variant={isCurrentPlan(plan.name) ? "outline" : "default"}
                onClick={() => handleSubscribe(plan.id)}
              >
                {createPaymentSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isCurrentPlan(plan.name) 
                  ? "Current Plan" 
                  : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Add free plan if it's not included */}
      {!filteredPlans.some(p => p.name.toLowerCase() === 'free') && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Free</CardTitle>
              <CardDescription>Basic features</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">0 SAR</span>
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <span>Limited access to AI features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <span>Basic agent capabilities</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <span>Up to 3 stored credentials</span>
                </li>
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={isCurrentPlan('free')}
              >
                {isCurrentPlan('free') ? "Current Plan" : "Continue with Free"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Return link */}
      <div className="mt-10 text-center">
        <Link href="/dashboard">
          <Button variant="ghost">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}