import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import color pickers
import { SketchPicker, ChromePicker } from 'react-color';

interface SiteSettings {
  logo: {
    url: string;
    showText: boolean;
    text: string;
    animated: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  header: {
    sticky: boolean;
    transparent: boolean;
    showLogo: boolean;
    showNavigation: boolean;
  };
  footer: {
    showCopyright: boolean;
    copyrightText: string;
    showSocial: boolean;
  };
  chatbot: {
    enabled: boolean;
    position: "bottom-right" | "bottom-left";
    welcomeMessage: string;
    color: string;
  };
}

const SiteEditorPanel: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("logo");
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  
  // In a real implementation, this would be loaded from the server
  const [settings, setSettings] = useState<SiteSettings>({
    logo: {
      url: "/assets/images/mirxa-logo.svg",
      showText: true,
      text: "Mirxa.io",
      animated: true
    },
    colors: {
      primary: "#6366f1",
      secondary: "#0ea5e9",
      accent: "#f97316",
      background: "#ffffff",
      text: "#1e293b"
    },
    header: {
      sticky: true,
      transparent: false,
      showLogo: true,
      showNavigation: true
    },
    footer: {
      showCopyright: true,
      copyrightText: "© 2025 Mirxa.io. All rights reserved.",
      showSocial: true
    },
    chatbot: {
      enabled: true,
      position: "bottom-right",
      welcomeMessage: "Hi! How can I assist you today?",
      color: "#6366f1"
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would save the settings to the server
      // For now, we'll just show a success message
      
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
    if (file) {
      // In a real implementation, you would upload the file to the server
      // and update the settings with the new URL
      // For now, we'll just simulate it
      
      const reader = new FileReader();
      reader.onload = () => {
        setSettings({
          ...settings,
          logo: {
            ...settings.logo,
            url: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (color: any, colorKey: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [colorKey]: color.hex
      }
    });
  };

  const handleChatbotColorChange = (color: any) => {
    setSettings({
      ...settings,
      chatbot: {
        ...settings.chatbot,
        color: color.hex
      }
    });
  };

  const toggleColorPicker = (colorKey: string) => {
    if (activeColorPicker === colorKey) {
      setActiveColorPicker(null);
    } else {
      setActiveColorPicker(colorKey);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("admin.siteEditor")}</h2>
        <Button 
          onClick={handleSave} 
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
      
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.editSiteAppearance")}</CardTitle>
          <CardDescription>
            {t("admin.editSiteAppearanceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="logo">{t("admin.logo")}</TabsTrigger>
              <TabsTrigger value="colors">{t("admin.colors")}</TabsTrigger>
              <TabsTrigger value="header">{t("admin.header")}</TabsTrigger>
              <TabsTrigger value="footer">{t("admin.footer")}</TabsTrigger>
              <TabsTrigger value="chatbot">{t("admin.chatbot")}</TabsTrigger>
            </TabsList>
            
            {/* Logo Settings */}
            <TabsContent value="logo" className="space-y-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6 flex flex-col items-center">
                <div className="mb-4">
                  <img 
                    src={settings.logo.url} 
                    alt="Site Logo" 
                    className="h-24"
                  />
                </div>
                
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="logo-upload">{t("admin.uploadNewLogo")}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        {t("common.upload")}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-logo-text"
                      checked={settings.logo.showText}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          logo: { ...settings.logo, showText: checked }
                        })
                      }
                    />
                    <Label htmlFor="show-logo-text">{t("admin.showLogoText")}</Label>
                  </div>
                  
                  {settings.logo.showText && (
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="logo-text">{t("admin.logoText")}</Label>
                      <Input
                        id="logo-text"
                        value={settings.logo.text}
                        onChange={(e) => 
                          setSettings({
                            ...settings,
                            logo: { ...settings.logo, text: e.target.value }
                          })
                        }
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="animated-logo"
                      checked={settings.logo.animated}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          logo: { ...settings.logo, animated: checked }
                        })
                      }
                    />
                    <Label htmlFor="animated-logo">{t("admin.useAnimatedLogo")}</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Colors Settings */}
            <TabsContent value="colors" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(settings.colors).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                    <Label className="mb-2 block capitalize">{key} {t("admin.color")}</Label>
                    <div className="flex items-center mt-2 space-x-4">
                      <div 
                        className="w-12 h-12 rounded border cursor-pointer" 
                        style={{ backgroundColor: value }}
                        onClick={() => toggleColorPicker(key)}
                      />
                      <Input 
                        value={value}
                        onChange={(e) => 
                          setSettings({
                            ...settings,
                            colors: { ...settings.colors, [key]: e.target.value }
                          })
                        }
                      />
                    </div>
                    
                    {activeColorPicker === key && (
                      <div className="absolute z-10 mt-2">
                        <div 
                          className="fixed inset-0" 
                          onClick={() => setActiveColorPicker(null)}
                        />
                        <ChromePicker 
                          color={value}
                          onChange={(color) => handleColorChange(color, key)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            {/* Header Settings */}
            <TabsContent value="header" className="space-y-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sticky-header"
                      checked={settings.header.sticky}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          header: { ...settings.header, sticky: checked }
                        })
                      }
                    />
                    <Label htmlFor="sticky-header">{t("admin.stickyHeader")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="transparent-header"
                      checked={settings.header.transparent}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          header: { ...settings.header, transparent: checked }
                        })
                      }
                    />
                    <Label htmlFor="transparent-header">{t("admin.transparentHeader")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-header-logo"
                      checked={settings.header.showLogo}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          header: { ...settings.header, showLogo: checked }
                        })
                      }
                    />
                    <Label htmlFor="show-header-logo">{t("admin.showLogoInHeader")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-header-nav"
                      checked={settings.header.showNavigation}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          header: { ...settings.header, showNavigation: checked }
                        })
                      }
                    />
                    <Label htmlFor="show-header-nav">{t("admin.showNavigationInHeader")}</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Footer Settings */}
            <TabsContent value="footer" className="space-y-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-copyright"
                      checked={settings.footer.showCopyright}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          footer: { ...settings.footer, showCopyright: checked }
                        })
                      }
                    />
                    <Label htmlFor="show-copyright">{t("admin.showCopyright")}</Label>
                  </div>
                  
                  {settings.footer.showCopyright && (
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="copyright-text">{t("admin.copyrightText")}</Label>
                      <Input
                        id="copyright-text"
                        value={settings.footer.copyrightText}
                        onChange={(e) => 
                          setSettings({
                            ...settings,
                            footer: { ...settings.footer, copyrightText: e.target.value }
                          })
                        }
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-social"
                      checked={settings.footer.showSocial}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          footer: { ...settings.footer, showSocial: checked }
                        })
                      }
                    />
                    <Label htmlFor="show-social">{t("admin.showSocialLinks")}</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Chatbot Settings */}
            <TabsContent value="chatbot" className="space-y-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6">
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-chatbot"
                      checked={settings.chatbot.enabled}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          chatbot: { ...settings.chatbot, enabled: checked }
                        })
                      }
                    />
                    <Label htmlFor="enable-chatbot">{t("admin.enableChatbot")}</Label>
                  </div>
                  
                  {settings.chatbot.enabled && (
                    <>
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="chatbot-position">{t("admin.chatbotPosition")}</Label>
                        <select
                          id="chatbot-position"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.chatbot.position}
                          onChange={(e) => 
                            setSettings({
                              ...settings,
                              chatbot: { 
                                ...settings.chatbot, 
                                position: e.target.value as "bottom-right" | "bottom-left" 
                              }
                            })
                          }
                        >
                          <option value="bottom-right">{t("admin.bottomRight")}</option>
                          <option value="bottom-left">{t("admin.bottomLeft")}</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="welcome-message">{t("admin.welcomeMessage")}</Label>
                        <Textarea
                          id="welcome-message"
                          value={settings.chatbot.welcomeMessage}
                          onChange={(e) => 
                            setSettings({
                              ...settings,
                              chatbot: { ...settings.chatbot, welcomeMessage: e.target.value }
                            })
                          }
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="chatbot-color">{t("admin.chatbotColor")}</Label>
                        <div className="flex items-center mt-2 space-x-4">
                          <div 
                            className="w-12 h-12 rounded border cursor-pointer" 
                            style={{ backgroundColor: settings.chatbot.color }}
                            onClick={() => toggleColorPicker("chatbot")}
                          />
                          <Input 
                            id="chatbot-color"
                            value={settings.chatbot.color}
                            onChange={(e) => 
                              setSettings({
                                ...settings,
                                chatbot: { ...settings.chatbot, color: e.target.value }
                              })
                            }
                          />
                        </div>
                        
                        {activeColorPicker === "chatbot" && (
                          <div className="absolute z-10 mt-2">
                            <div 
                              className="fixed inset-0" 
                              onClick={() => setActiveColorPicker(null)}
                            />
                            <ChromePicker 
                              color={settings.chatbot.color}
                              onChange={handleChatbotColorChange}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteEditorPanel;