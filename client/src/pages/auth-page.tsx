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
  FormMessage,
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
  PlugZap,
} from "lucide-react";

export default function AuthPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Handle window resize for better responsiveness
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize(); // Set initial size

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
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
      password: registrationData.password,
    });
  };

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card-glass p-6 rounded-xl shadow-md backdrop-blur-md bg-opacity-60 border border-white/10">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-heading font-bold text-high-contrast text-shadow-md">
            {t("app.name")}
          </h1>
          <p className="text-white/90 text-shadow-sm mt-1 text-sm">
            Login or Register
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4 btn-glass bg-opacity-30 backdrop-blur-md border border-white/10 rounded-xl shadow-glow-sm">
            <TabsTrigger value="login" className="text-white/90 text-shadow-sm font-medium data-[state=active]:bg-primary/30 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-glow-sm rounded-lg">{t("auth.login")}</TabsTrigger>
            <TabsTrigger value="register" className="text-white/90 text-shadow-sm font-medium data-[state=active]:bg-primary/30 data-[state=active]:backdrop-blur-md data-[state=active]:shadow-glow-sm rounded-lg">{t("auth.register")}</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                        {t("auth.username")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`${t("auth.username")}...`}
                            className="pl-9 btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                      <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                        {t("auth.password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder={`${t("auth.password")}...`}
                            className="pl-9 btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                    className="w-full btn-glass btn-glass-primary shadow-glow bg-opacity-50"
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
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                        {t("auth.fullName")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`${t("auth.fullName")}...`}
                            className="pl-9 btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                        <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                          {t("auth.username")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`${t("auth.username")}...`}
                            className="btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
                            {...field}
                          />
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
                        <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                          {t("auth.email")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder={`${t("auth.email")}...`}
                              className="pl-9 btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                        <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                          {t("auth.password")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder={`${t("auth.password")}...`}
                              className="pl-9 btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                        <FormLabel className="text-sm text-high-contrast text-shadow-sm">
                          {t("auth.confirmPassword")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={`${t("auth.confirmPassword")}...`}
                            className="btn-glass bg-opacity-30 border-white/10 text-white/90 text-shadow-sm placeholder:text-white/50"
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
                  className="w-full btn-glass btn-glass-primary shadow-glow bg-opacity-50"
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
    );
}
