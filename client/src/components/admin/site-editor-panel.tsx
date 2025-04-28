import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Info, Save, PlusCircle, MinusCircle, Upload, Bot, LayoutGrid, MessageCircle, Settings, 
  ArrowLeft, ArrowRight, Trash, Image, Type, Palette } from "lucide-react";
import { SketchPicker } from 'react-color';
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Site Settings Schema
const siteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string(),
  logo: z.any().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  enableDarkMode: z.boolean(),
  defaultLanguage: z.string(),
  enableChatbot: z.boolean(),
  chatbotGreeting: z.string().optional(),
  chatbotPosition: z.string(),
  copyrightText: z.string(),
  socialLinks: z.array(
    z.object({
      platform: z.string(),
      url: z.string().url("Please enter a valid URL"),
      enabled: z.boolean()
    })
  ).optional(),
  customCode: z.object({
    header: z.string().optional(),
    footer: z.string().optional(),
  }).optional()
});

type SiteSettings = z.infer<typeof siteSettingsSchema>;

interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const ColorField: React.FC<ColorFieldProps> = ({ value, onChange, label }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  
  return (
    <div className="flex flex-col space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <Popover open={displayColorPicker} onOpenChange={setDisplayColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <div 
                className="w-4 h-4 rounded mr-2" 
                style={{ backgroundColor: value }}
              />
              {value}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <SketchPicker
              color={value}
              onChange={(color) => onChange(color.hex)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const SiteEditorPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default site settings - in a real implementation, these would be fetched from the server
  const defaultSettings: SiteSettings = {
    siteName: "Mirxa.io",
    siteDescription: "Next-Generation AI Agent Platform",
    logo: null,
    faviconUrl: "/favicon.ico",
    primaryColor: "#6366f1",
    secondaryColor: "#4f46e5",
    accentColor: "#10b981",
    enableDarkMode: true,
    defaultLanguage: "en",
    enableChatbot: true,
    chatbotGreeting: "Hi there! How can I help you today?",
    chatbotPosition: "right",
    copyrightText: "© 2025 Mirxa.io. All rights reserved.",
    socialLinks: [
      { platform: "twitter", url: "https://twitter.com/mirxaio", enabled: true },
      { platform: "linkedin", url: "https://linkedin.com/company/mirxaio", enabled: true },
      { platform: "facebook", url: "https://facebook.com/mirxaio", enabled: false },
    ],
    customCode: {
      header: "",
      footer: ""
    }
  };

  const form = useForm<SiteSettings>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: defaultSettings
  });

  // Fetch site settings
  useEffect(() => {
    const fetchSiteSettings = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch these from an API
        // await apiRequest("GET", "/api/admin/site-settings")
        
        // For now, we'll just use our default settings
        form.reset(defaultSettings);
      } catch (error) {
        console.error("Error fetching site settings:", error);
        toast({
          title: "Error",
          description: "Failed to load site settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteSettings();
  }, [form]);

  const onSubmit = async (data: SiteSettings) => {
    setIsLoading(true);
    try {
      // In a real implementation, you would send this to the server
      // await apiRequest("PUT", "/api/admin/site-settings", data);
      
      console.log("Saved site settings:", data);
      toast({
        title: "Success",
        description: "Site settings saved successfully"
      });
    } catch (error) {
      console.error("Error saving site settings:", error);
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload the file to your server
    // For now, we'll just update the form with the file
    form.setValue("logo", file);
    
    // Preview the logo (optional)
    const reader = new FileReader();
    reader.onload = (event) => {
      const logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
      if (logoPreview && event.target?.result) {
        logoPreview.src = event.target.result as string;
        logoPreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("admin.siteEditor")}</h2>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("common.saveChanges")}
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            {t("admin.generalSettings")}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            {t("admin.appearance")}
          </TabsTrigger>
          <TabsTrigger value="content">
            <LayoutGrid className="w-4 h-4 mr-2" />
            {t("admin.content")}
          </TabsTrigger>
          <TabsTrigger value="chatbot">
            <Bot className="w-4 h-4 mr-2" />
            {t("admin.chatbot")}
          </TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.siteInformation")}</CardTitle>
                  <CardDescription>
                    {t("admin.siteInformationDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.siteName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("admin.siteNameDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.siteDescription")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormDescription>
                          {t("admin.siteDescriptionHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="copyrightText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.copyrightText")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("admin.copyrightTextHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.defaultLanguage")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("admin.defaultLanguageHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.socialMedia")}</CardTitle>
                  <CardDescription>
                    {t("admin.socialMediaDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.watch('socialLinks')?.map((link, index) => (
                      <div key={index} className="flex items-center space-x-3 border p-3 rounded-md">
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.enabled`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="capitalize font-medium">
                                {link.platform}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} disabled={!form.watch(`socialLinks.${index}.enabled`)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentLinks = form.getValues('socialLinks') || [];
                        form.setValue('socialLinks', [
                          ...currentLinks,
                          { platform: '', url: '', enabled: true }
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("admin.addSocialLink")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.brandingAndLogo")}</CardTitle>
                  <CardDescription>
                    {t("admin.brandingDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>{t("admin.siteLogo")}</Label>
                    <div className="flex flex-col space-y-3">
                      <div className="border rounded-md p-4 flex items-center justify-center">
                        <img 
                          id="logo-preview"
                          alt="Logo Preview" 
                          className="max-h-20 object-contain" 
                          src="/logo.png"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {t("admin.uploadLogo")}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.favicon")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("admin.faviconHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <ColorField
                      label={t("admin.primaryColor")}
                      value={form.watch('primaryColor')}
                      onChange={(value) => form.setValue('primaryColor', value)}
                    />
                    <ColorField
                      label={t("admin.secondaryColor")}
                      value={form.watch('secondaryColor')}
                      onChange={(value) => form.setValue('secondaryColor', value)}
                    />
                    <ColorField
                      label={t("admin.accentColor")}
                      value={form.watch('accentColor')}
                      onChange={(value) => form.setValue('accentColor', value)}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="enableDarkMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t("admin.enableDarkMode")}</FormLabel>
                          <FormDescription>
                            {t("admin.darkModeDescription")}
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.customCode")}</CardTitle>
                  <CardDescription>
                    {t("admin.customCodeDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert variant="warning">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("admin.customCodeWarningTitle")}</AlertTitle>
                    <AlertDescription>
                      {t("admin.customCodeWarningDescription")}
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="customCode.header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.headerCustomCode")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={6} className="font-mono text-sm" />
                        </FormControl>
                        <FormDescription>
                          {t("admin.headerCustomCodeHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customCode.footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.footerCustomCode")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={6} className="font-mono text-sm" />
                        </FormControl>
                        <FormDescription>
                          {t("admin.footerCustomCodeHelp")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.contentBlocks")}</CardTitle>
                  <CardDescription>
                    {t("admin.contentBlocksDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* This would be dynamically generated from stored content blocks */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>{t("admin.contentBlocksInfoTitle")}</AlertTitle>
                      <AlertDescription>
                        {t("admin.contentBlocksInfoDescription")}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Hero</Badge>
                          <h4 className="font-medium">Home Page Hero</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Main hero section on the home page
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Features</Badge>
                          <h4 className="font-medium">Product Features</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Features section with 3 feature cards
                      </div>
                    </div>
                    
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("admin.addContentBlock")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.notifications")}</CardTitle>
                  <CardDescription>
                    {t("admin.notificationsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge>Active</Badge>
                          <h4 className="font-medium">Special Offer</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm">
                        Get 20% off your first month subscription with code WELCOME20
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: Dec 31, 2025
                      </div>
                    </div>
                    
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("admin.addNotification")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chatbot" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.chatbotSettings")}</CardTitle>
                  <CardDescription>
                    {t("admin.chatbotSettingsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="enableChatbot"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t("admin.enableChatbot")}</FormLabel>
                          <FormDescription>
                            {t("admin.enableChatbotDescription")}
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
                  
                  <div className={cn(
                    "space-y-6 transition-opacity",
                    !form.watch('enableChatbot') && "opacity-50 pointer-events-none"
                  )}>
                    <FormField
                      control={form.control}
                      name="chatbotGreeting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.chatbotGreeting")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormDescription>
                            {t("admin.chatbotGreetingHelp")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="chatbotPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.chatbotPosition")}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="left">{t("common.left")}</SelectItem>
                              <SelectItem value="right">{t("common.right")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t("admin.chatbotPositionHelp")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">{t("admin.chatbotPreview")}</h4>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("admin.chatbotPreviewDescription")}
                        </div>
                        <div className={cn(
                          "relative border rounded-full p-3 shadow-md",
                          form.watch('chatbotPosition') === 'left' ? "ml-auto" : "mr-auto"
                        )}>
                          <MessageCircle className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default SiteEditorPanel;