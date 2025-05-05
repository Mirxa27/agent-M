import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, Save, Upload, Layers, EyeIcon, EyeOffIcon, 
  Move, Copy, Trash, ChevronDown, ChevronUp, Undo, Redo, 
  Palette, LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Import improved color pickers
import { HexColorPicker, HexColorInput } from "react-colorful";

// Import DnD functionality
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

// Preview component
interface PreviewProps {
  settings: SiteSettings;
}

const SitePreview: React.FC<PreviewProps> = ({ settings }) => {
  return (
    <div className="preview-container border rounded-lg overflow-hidden shadow-lg">
      <div 
        className="preview-header p-4 flex items-center justify-between" 
        style={{ 
          backgroundColor: settings.header.transparent ? 'transparent' : settings.colors.background,
          position: settings.header.sticky ? 'sticky' : 'relative',
          top: 0,
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {settings.header.showLogo && (
          <div className="flex items-center">
            <img src={settings.logo.url || "/assets/images/mirxa-logo.svg"} alt="Logo" className="h-8 w-auto" />
            {settings.logo.showText && (
              <span 
                className="ml-2 font-bold" 
                style={{ color: settings.colors.text }}
              >
                {settings.logo.text}
              </span>
            )}
          </div>
        )}
        
        {settings.header.showNavigation && (
          <div className="flex space-x-4">
            <a href="#" style={{ color: settings.colors.primary }}>Home</a>
            <a href="#" style={{ color: settings.colors.text }}>Features</a>
            <a href="#" style={{ color: settings.colors.text }}>Pricing</a>
            <a href="#" style={{ color: settings.colors.text }}>About</a>
          </div>
        )}
      </div>
      
      <div 
        className="preview-content p-6"
        style={{ backgroundColor: settings.colors.background, color: settings.colors.text }}
      >
        <h2 style={{ color: settings.colors.primary }} className="text-xl font-bold mb-2">
          Welcome to the Preview
        </h2>
        <p className="mb-4">This is how your site will look with the current settings.</p>
        
        <button 
          className="px-4 py-2 rounded mb-4"
          style={{ 
            backgroundColor: settings.colors.primary,
            color: 'white',
          }}
        >
          Primary Button
        </button>
        
        <button 
          className="px-4 py-2 rounded ml-2 mb-4"
          style={{ 
            backgroundColor: settings.colors.secondary,
            color: 'white',
          }}
        >
          Secondary Button
        </button>
        
        <div className="mt-4 p-3 rounded" style={{ backgroundColor: settings.colors.accent, color: 'white' }}>
          This is an accent-colored notification box.
        </div>
      </div>
      
      <div 
        className="preview-footer p-4 text-center"
        style={{ backgroundColor: settings.colors.background, borderTop: '1px solid rgba(0,0,0,0.1)' }}
      >
        {settings.footer.showCopyright && (
          <p style={{ color: settings.colors.text }}>{settings.footer.copyrightText}</p>
        )}
        
        {settings.footer.showSocial && (
          <div className="flex justify-center mt-2 space-x-4">
            <a href="#" style={{ color: settings.colors.primary }}>Twitter</a>
            <a href="#" style={{ color: settings.colors.primary }}>Facebook</a>
            <a href="#" style={{ color: settings.colors.primary }}>Instagram</a>
          </div>
        )}
      </div>
      
      {settings.chatbot.enabled && (
        <div 
          className="preview-chatbot p-2 rounded-full w-12 h-12 flex items-center justify-center"
          style={{ 
            backgroundColor: settings.chatbot.color,
            position: 'absolute',
            bottom: '1rem',
            right: settings.chatbot.position === 'bottom-right' ? '1rem' : 'auto',
            left: settings.chatbot.position === 'bottom-left' ? '1rem' : 'auto',
            color: 'white'
          }}
        >
          <span>💬</span>
        </div>
      )}
    </div>
  );
};

// Draggable component
interface DraggableItemProps {
  id: string;
  type: string;
  children: React.ReactNode;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
  id, type, children, index, moveItem 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: type,
    hover: (item: { id: string; index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref} 
      className={`p-3 mb-2 border rounded cursor-move ${isDragging ? 'opacity-50 bg-gray-100' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Move className="h-4 w-4 mr-2 text-gray-400" />
          {children}
        </div>
      </div>
    </div>
  );
};

const SiteEditorPanel: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("logo");
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  // Default site settings
  const [settings, setSettings] = useState<SiteSettings>({
    logo: {
      url: "/assets/images/mirxa-logo.svg",
      showText: true,
      text: "Mirxa.io",
      animated: true,
    },
    colors: {
      primary: "#6366f1",
      secondary: "#0ea5e9",
      accent: "#f97316",
      background: "#ffffff",
      text: "#1e293b",
    },
    header: {
      sticky: true,
      transparent: false,
      showLogo: true,
      showNavigation: true,
    },
    footer: {
      showCopyright: true,
      copyrightText: "© 2025 Mirxa.io. All rights reserved.",
      showSocial: true,
    },
    chatbot: {
      enabled: true,
      position: "bottom-right",
      welcomeMessage: "Hi! How can I assist you today?",
      color: "#6366f1",
    },
  });

  // Draggable widgets state
  const [widgets, setWidgets] = useState([
    { id: 'header-widget', label: 'Header' },
    { id: 'hero-widget', label: 'Hero Section' },
    { id: 'features-widget', label: 'Features' },
    { id: 'testimonials-widget', label: 'Testimonials' },
    { id: 'cta-widget', label: 'Call to Action' },
    { id: 'footer-widget', label: 'Footer' },
  ]);

  const moveWidget = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedItem);
    setWidgets(newWidgets);
  };

  // Load site settings on component mount
  useEffect(() => {
    const loadSiteSettings = async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest("GET", "/api/site-settings");
        if (data) {
          // Update settings with data from the server
          setSettings({
            logo: data.logo || settings.logo,
            colors: data.colors || settings.colors,
            header: data.header || settings.header,
            footer: data.footer || settings.footer,
            chatbot: data.chatbot || settings.chatbot
          });
          
          // Update widgets if they exist in the data
          if (data.widgets) {
            setWidgets(data.widgets);
          }
        }
      } catch (error) {
        console.error("Error loading site settings:", error);
        toast({
          title: "Error",
          description: "Failed to load site settings. Using default values.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSiteSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Create a complete settings object with widgets to save
      const settingsToSave = {
        ...settings,
        widgets
      };
      
      // Send the updated settings to the server
      await apiRequest("PATCH", "/api/admin/site-settings", settingsToSave);
      
      toast({
        title: "Success",
        description: "Site settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving site settings:", error);
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('logo', file);
        
        // Upload the file to the server - credentials:include sends cookies for auth
        const response = await fetch('/api/admin/upload-logo', {
          method: 'POST',
          body: formData,
          credentials: 'include', // This ensures cookies are sent with the request
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload logo');
        }
        
        const result = await response.json();
        
        // Update the settings with the new logo URL
        setSettings({
          ...settings,
          logo: {
            ...settings.logo,
            url: result.url,
          },
        });
        
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Error",
          description: "Failed to upload logo",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleColorChange = (colorHex: string, colorKey: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [colorKey]: colorHex,
      },
    });
  };

  const handleChatbotColorChange = (colorHex: string) => {
    setSettings({
      ...settings,
      chatbot: {
        ...settings.chatbot,
        color: colorHex,
      },
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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("admin.siteEditor") || "Site Editor"}
          </h2>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving") || "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("common.saveChanges") || "Save Changes"}
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.editSiteAppearance") || "Edit Site Appearance"}</CardTitle>
            <CardDescription>
              {t("admin.editSiteAppearanceDescription") || "Customize your site's appearance and preview changes in real-time."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Settings Controls */}
              <div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="logo">{t("admin.logo") || "Logo"}</TabsTrigger>
                    <TabsTrigger value="colors">{t("admin.colors") || "Colors"}</TabsTrigger>
                    <TabsTrigger value="header">{t("admin.header") || "Header"}</TabsTrigger>
                    <TabsTrigger value="footer">{t("admin.footer") || "Footer"}</TabsTrigger>
                    <TabsTrigger value="chatbot">{t("admin.chatbot") || "Chatbot"}</TabsTrigger>
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
                          <Label htmlFor="logo-upload">
                            {t("admin.uploadNewLogo") || "Upload New Logo"}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="logo-upload"
                              type="file"
                              accept="image/svg+xml,image/png,image/jpeg"
                              onChange={handleLogoUpload}
                              className="flex-1"
                            />
                            {/* The upload is handled by the onChange event of the input */}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-logo-text"
                            checked={settings.logo.showText}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                logo: { ...settings.logo, showText: checked },
                              })
                            }
                          />
                          <Label htmlFor="show-logo-text">
                            {t("admin.showLogoText") || "Show Logo Text"}
                          </Label>
                        </div>

                        {settings.logo.showText && (
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="logo-text">{t("admin.logoText") || "Logo Text"}</Label>
                            <Input
                              id="logo-text"
                              value={settings.logo.text}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  logo: { ...settings.logo, text: e.target.value },
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
                                logo: { ...settings.logo, animated: checked },
                              })
                            }
                          />
                          <Label htmlFor="animated-logo">
                            {t("admin.useAnimatedLogo") || "Use Animated Logo"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Colors Settings */}
                  <TabsContent value="colors" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(settings.colors).map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4"
                        >
                          <Label className="mb-2 block capitalize">
                            {key} {t("admin.color") || "Color"}
                          </Label>
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
                                  colors: {
                                    ...settings.colors,
                                    [key]: e.target.value,
                                  },
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
                              <div 
                                className="p-3 bg-white rounded-md shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HexColorPicker 
                                  color={value} 
                                  onChange={(color) => handleColorChange(color, key)} 
                                />
                                <div className="mt-2">
                                  <HexColorInput
                                    className="w-full p-2 text-sm border rounded"
                                    color={value}
                                    onChange={(color) => handleColorChange(color, key)}
                                    prefixed
                                  />
                                </div>
                              </div>
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
                                header: { ...settings.header, sticky: checked },
                              })
                            }
                          />
                          <Label htmlFor="sticky-header">
                            {t("admin.stickyHeader") || "Sticky Header"}
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="transparent-header"
                            checked={settings.header.transparent}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                header: { ...settings.header, transparent: checked },
                              })
                            }
                          />
                          <Label htmlFor="transparent-header">
                            {t("admin.transparentHeader") || "Transparent Header"}
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-header-logo"
                            checked={settings.header.showLogo}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                header: { ...settings.header, showLogo: checked },
                              })
                            }
                          />
                          <Label htmlFor="show-header-logo">
                            {t("admin.showLogoInHeader") || "Show Logo in Header"}
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-header-nav"
                            checked={settings.header.showNavigation}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                header: {
                                  ...settings.header,
                                  showNavigation: checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="show-header-nav">
                            {t("admin.showNavigationInHeader") || "Show Navigation in Header"}
                          </Label>
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
                                footer: {
                                  ...settings.footer,
                                  showCopyright: checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="show-copyright">
                            {t("admin.showCopyright") || "Show Copyright"}
                          </Label>
                        </div>

                        {settings.footer.showCopyright && (
                          <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="copyright-text">
                              {t("admin.copyrightText") || "Copyright Text"}
                            </Label>
                            <Input
                              id="copyright-text"
                              value={settings.footer.copyrightText}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  footer: {
                                    ...settings.footer,
                                    copyrightText: e.target.value,
                                  },
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
                                footer: { ...settings.footer, showSocial: checked },
                              })
                            }
                          />
                          <Label htmlFor="show-social">
                            {t("admin.showSocialLinks") || "Show Social Links"}
                          </Label>
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
                                chatbot: { ...settings.chatbot, enabled: checked },
                              })
                            }
                          />
                          <Label htmlFor="enable-chatbot">
                            {t("admin.enableChatbot") || "Enable Chatbot"}
                          </Label>
                        </div>

                        {settings.chatbot.enabled && (
                          <>
                            <div className="flex flex-col space-y-1.5">
                              <Label htmlFor="chatbot-position">
                                {t("admin.chatbotPosition") || "Chatbot Position"}
                              </Label>
                              <select
                                id="chatbot-position"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={settings.chatbot.position}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    chatbot: {
                                      ...settings.chatbot,
                                      position: e.target.value as
                                        | "bottom-right"
                                        | "bottom-left",
                                    },
                                  })
                                }
                              >
                                <option value="bottom-right">
                                  {t("admin.bottomRight") || "Bottom Right"}
                                </option>
                                <option value="bottom-left">
                                  {t("admin.bottomLeft") || "Bottom Left"}
                                </option>
                              </select>
                            </div>

                            <div className="flex flex-col space-y-1.5">
                              <Label htmlFor="welcome-message">
                                {t("admin.welcomeMessage") || "Welcome Message"}
                              </Label>
                              <Textarea
                                id="welcome-message"
                                value={settings.chatbot.welcomeMessage}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    chatbot: {
                                      ...settings.chatbot,
                                      welcomeMessage: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="flex flex-col space-y-1.5">
                              <Label htmlFor="chatbot-color">
                                {t("admin.chatbotColor") || "Chatbot Color"}
                              </Label>
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
                                      chatbot: {
                                        ...settings.chatbot,
                                        color: e.target.value,
                                      },
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
                                  <div 
                                    className="p-3 bg-white rounded-md shadow-xl"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <HexColorPicker 
                                      color={settings.chatbot.color} 
                                      onChange={handleChatbotColorChange} 
                                    />
                                    <div className="mt-2">
                                      <HexColorInput
                                        className="w-full p-2 text-sm border rounded"
                                        color={settings.chatbot.color}
                                        onChange={handleChatbotColorChange}
                                        prefixed
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Added Draggable Widget Layout Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">
                    {t("admin.pageLayout") || "Page Layout"}
                  </h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                    <p className="text-sm text-gray-500 mb-4">
                      {t("admin.dragElementsDescription") || "Drag elements to reorder them on your page."}
                    </p>
                    
                    <div className="space-y-1">
                      {widgets.map((widget, index) => (
                        <DraggableItem
                          key={widget.id}
                          id={widget.id}
                          type="widget"
                          index={index}
                          moveItem={moveWidget}
                        >
                          <span className="font-medium">{widget.label}</span>
                        </DraggableItem>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Live Preview */}
              <div className="relative">
                <div className="sticky top-0 p-4 bg-gray-50 dark:bg-gray-900 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{t("admin.livePreview") || "Live Preview"}</h3>
                    <div className="flex items-center space-x-2">
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{t("admin.realTimePreview") || "Real-time preview"}</span>
                    </div>
                  </div>
                  <div className="relative" style={{ height: '600px', overflow: 'auto' }}>
                    <SitePreview settings={settings} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button variant="outline" onClick={() => {
              // Reset to default settings
              setSettings({
                logo: {
                  url: "/assets/images/mirxa-logo.svg",
                  showText: true,
                  text: "Mirxa.io",
                  animated: true,
                },
                colors: {
                  primary: "#6366f1",
                  secondary: "#0ea5e9",
                  accent: "#f97316",
                  background: "#ffffff",
                  text: "#1e293b",
                },
                header: {
                  sticky: true,
                  transparent: false,
                  showLogo: true,
                  showNavigation: true,
                },
                footer: {
                  showCopyright: true,
                  copyrightText: "© 2025 Mirxa.io. All rights reserved.",
                  showSocial: true,
                },
                chatbot: {
                  enabled: true,
                  position: "bottom-right",
                  welcomeMessage: "Hi! How can I assist you today?",
                  color: "#6366f1",
                },
              });
            }}>
              <Undo className="mr-2 h-4 w-4" />
              {t("common.resetToDefaults") || "Reset to defaults"}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("common.saveChanges") || "Save Changes"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DndProvider>
  );
};

export default SiteEditorPanel;