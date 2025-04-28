import { useState, useEffect } from "react";
import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword as it's not part of the API
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h1 className="text-2xl font-heading font-bold">Mirxa.io</h1>
            </div>
            <p className="text-gray-500 mt-2">Next-Generation AI Agent Platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-600" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : null}
                    Login
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-600" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : null}
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero image and overview */}
      <div className="w-full md:w-1/2 bg-primary-600 text-white p-8 flex items-center justify-center hidden md:flex">
        <div className="max-w-lg">
          <h2 className="text-4xl font-heading font-bold mb-6">Next-Generation AI Agent Platform</h2>
          
          <div className="space-y-6 text-primary-100">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-xl">1</span>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-1">AI Agents that work for you</h3>
                <p>Create customized AI agents that can send emails, update websites, manage documents, and more.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-xl">2</span>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-1">Secure credential storage</h3>
                <p>Store your API keys, passwords, and other sensitive data with end-to-end encryption.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-xl">3</span>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-1">File and template management</h3>
                <p>Store and manage files, templates, and documents that your agents can use automatically.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <span className="text-xl">4</span>
              </div>
              <div>
                <h3 className="text-xl font-medium text-white mb-1">Task automation</h3>
                <p>Automate repetitive tasks and workflows with natural language instructions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
