import { useState, useEffect } from "react";
import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, Link } from "wouter";
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
import { useTranslation } from "react-i18next";
import { 
  ArrowRight, 
  Loader2, 
  Lock, 
  Mail, 
  User, 
  Bot, 
  ShieldCheck, 
  Zap, 
  PlugZap 
} from "lucide-react";

export default function AuthPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
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
    
    // Make sure we're passing an object with the correct fields
    registerMutation.mutate({
      username: registrationData.username,
      email: registrationData.email,
      fullName: registrationData.fullName,
      password: registrationData.password
    });
  };

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-950">
      {/* Left side - Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h1 className="text-2xl font-heading font-bold">{t("app.name")}</h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">{t("app.slogan")}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 sm:mb-8">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
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
                        <FormLabel className="text-sm">{t("auth.username")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={`${t("auth.username")}...`} 
                              className="pl-9"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t("auth.password")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              placeholder={`${t("auth.password")}...`} 
                              className="pl-9"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 transition-colors" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {t("auth.login")}
                    </Button>
                  </div>
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
                        <FormLabel className="text-sm">{t("auth.fullName")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder={`${t("auth.fullName")}...`}
                              className="pl-9"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={`${t("auth.username")}...`} {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">{t("auth.email")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="email" 
                                placeholder={`${t("auth.email")}...`}
                                className="pl-9" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">{t("auth.password")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="password" 
                                placeholder={`${t("auth.password")}...`}
                                className="pl-9" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">{t("auth.confirmPassword")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={`${t("auth.confirmPassword")}...`} 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 transition-colors" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t("auth.createAccount")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero image and overview */}
      <div className="hidden lg:flex w-full md:w-1/2 bg-gradient-to-br from-primary to-primary-foreground text-white p-8 flex-col justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -mb-40 -ml-20"></div>
        
        <div className="max-w-lg mx-auto relative z-10">
          <div className="flex items-center mb-6">
            <Bot className="h-10 w-10 text-white/80 mr-4" />
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">
              {t("auth.hero.title")}
            </h2>
          </div>
          <p className="text-primary-100 text-base sm:text-lg mb-8">
            {t("auth.hero.description")}
          </p>
          
          <div className="space-y-6 text-primary-100">
            <div className="flex items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-1">
                  {t("auth.hero.feature1")}
                </h3>
                <p className="text-sm sm:text-base">
                  {t("auth.hero.feature1Description")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-1">
                  {t("auth.hero.feature2")}
                </h3>
                <p className="text-sm sm:text-base">
                  {t("auth.hero.feature2Description")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-1">
                  {t("auth.hero.feature3")}
                </h3>
                <p className="text-sm sm:text-base">
                  {t("auth.hero.feature3Description")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <PlugZap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-1">
                  {t("auth.hero.feature4")}
                </h3>
                <p className="text-sm sm:text-base">
                  {t("auth.hero.feature4Description")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 hidden lg:block">
            <Button variant="secondary" size="lg" className="group">
              <span>Learn more about our platform</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile hero section (shown only on small screens) */}
      <div className="block md:hidden bg-gradient-to-br from-primary to-primary-foreground text-white p-6 rounded-lg mx-4 my-6">
        <div className="flex items-center mb-4">
          <Bot className="h-8 w-8 text-white/80 mr-3" />
          <h2 className="text-xl font-heading font-bold">
            {t("auth.hero.title")}
          </h2>
        </div>
        
        <p className="text-primary-100 text-sm mb-5">
          {t("auth.hero.description")}
        </p>
        
        <div className="space-y-3 mb-5">
          <div className="flex items-center">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-white/90">{t("auth.hero.feature1")}</p>
          </div>
          
          <div className="flex items-center">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-white/90">{t("auth.hero.feature2")}</p>
          </div>
          
          <div className="flex items-center">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-white/90">{t("auth.hero.feature3")}</p>
          </div>
        </div>
        
        <Link href="/">
          <Button variant="secondary" size="sm" className="w-full group">
            <span>Explore platform</span>
            <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
