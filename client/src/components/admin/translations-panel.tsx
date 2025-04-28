import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Languages, Plus, Save, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

// Translation schema
const translationSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Translation value is required"),
});

const TranslationsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState<{ section: string; key: string } | null>(null);
  const [newTranslationMode, setNewTranslationMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof translationSchema>>({
    resolver: zodResolver(translationSchema),
    defaultValues: {
      key: "",
      value: "",
    },
  });

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch these from the server
        // Here we're getting them from the i18n instance for demonstration
        const resources = i18n.options.resources || {};
        const langs = Object.keys(resources);
        
        const translationsData: Record<string, Record<string, any>> = {};
        
        for (const lang of langs) {
          if (resources[lang]?.translation) {
            translationsData[lang] = resources[lang].translation;
          }
        }
        
        setTranslations(translationsData);
      } catch (error) {
        console.error("Failed to load translations:", error);
        toast({
          title: "Error Loading Translations",
          description: "There was a problem loading the translations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [i18n]);

  const saveTranslation = async (section: string, key: string, value: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, you would send this to the server
      // Here we're just updating the local state for demonstration
      const updatedTranslations = { ...translations };
      
      if (!updatedTranslations[currentLanguage]) {
        updatedTranslations[currentLanguage] = {};
      }
      
      if (!updatedTranslations[currentLanguage][section]) {
        updatedTranslations[currentLanguage][section] = {};
      }
      
      updatedTranslations[currentLanguage][section][key] = value;
      setTranslations(updatedTranslations);
      
      // In a real implementation, you would save to server here
      // await apiRequest("PATCH", "/api/admin/translations", { language: currentLanguage, section, key, value });
      
      // Now we need to update the i18n instance with new translations
      i18n.addResourceBundle(currentLanguage, 'translation', updatedTranslations[currentLanguage], true, true);
      
      toast({
        title: "Translation Saved",
        description: "The translation has been updated successfully.",
      });
      setEditMode(null);
    } catch (error) {
      console.error("Failed to save translation:", error);
      toast({
        title: "Error Saving Translation",
        description: "There was a problem saving the translation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addNewTranslation = async (data: z.infer<typeof translationSchema>) => {
    if (!newTranslationMode) return;
    
    setIsLoading(true);
    try {
      const { key, value } = data;
      
      // In a real implementation, you would send this to the server
      const updatedTranslations = { ...translations };
      
      if (!updatedTranslations[currentLanguage]) {
        updatedTranslations[currentLanguage] = {};
      }
      
      if (!updatedTranslations[currentLanguage][newTranslationMode]) {
        updatedTranslations[currentLanguage][newTranslationMode] = {};
      }
      
      updatedTranslations[currentLanguage][newTranslationMode][key] = value;
      setTranslations(updatedTranslations);
      
      // In a real implementation, you would save to server here
      // await apiRequest("POST", "/api/admin/translations", { language: currentLanguage, section: newTranslationMode, key, value });
      
      // Now we need to update the i18n instance with new translations
      i18n.addResourceBundle(currentLanguage, 'translation', updatedTranslations[currentLanguage], true, true);
      
      toast({
        title: "Translation Added",
        description: "The new translation has been added successfully.",
      });
      setNewTranslationMode(null);
      form.reset();
    } catch (error) {
      console.error("Failed to add translation:", error);
      toast({
        title: "Error Adding Translation",
        description: "There was a problem adding the translation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTranslationSections = () => {
    if (!translations[currentLanguage]) return [];
    return Object.keys(translations[currentLanguage]);
  };

  const getFilteredTranslations = (section: string) => {
    if (!translations[currentLanguage] || !translations[currentLanguage][section]) return {};
    
    const sectionData = translations[currentLanguage][section];
    
    if (!searchTerm) return sectionData;
    
    return Object.keys(sectionData)
      .filter(key => 
        key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(sectionData[key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .reduce((filtered, key) => {
        filtered[key] = sectionData[key];
        return filtered;
      }, {} as Record<string, any>);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{t("admin.translations")}</h2>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="language-select">{t("settings.language")}:</Label>
            <select
              id="language-select"
              className="border rounded px-2 py-1"
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
            >
              {Object.keys(translations).map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "en" ? "English" : lang === "ar" ? "العربية" : lang}
                </option>
              ))}
            </select>
          </div>
          <Input
            placeholder={t("common.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Tabs defaultValue={getTranslationSections()[0] || "app"}>
        <TabsList className="mb-4 flex flex-wrap">
          {getTranslationSections().map((section) => (
            <TabsTrigger key={section} value={section} className="capitalize">
              {section}
            </TabsTrigger>
          ))}
        </TabsList>

        {getTranslationSections().map((section) => (
          <TabsContent key={section} value={section}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="capitalize">{section} {t("admin.translations")}</CardTitle>
                    <CardDescription>
                      {t("admin.manageTranslationsFor")} {section} {t("admin.section")}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setNewTranslationMode(section)}
                    disabled={!!newTranslationMode || !!editMode}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("common.add")} {t("admin.translation")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {newTranslationMode === section && (
                  <div className="mb-6 border p-4 rounded-md bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{t("admin.addNewTranslation")}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setNewTranslationMode(null);
                          form.reset();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(addNewTranslation)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("admin.translationKey")}</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. welcome" {...field} />
                              </FormControl>
                              <FormDescription>
                                The key used to access this translation in code.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("admin.translationValue")}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={`Translation in ${currentLanguage}`} 
                                  {...field} 
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? t("common.saving") : t("common.save")}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}

                <ScrollArea className="h-[500px] w-full pr-4">
                  <div className="space-y-4">
                    {Object.keys(getFilteredTranslations(section)).length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>{t("common.noResults")}</AlertTitle>
                        <AlertDescription>
                          {searchTerm 
                            ? t("admin.noMatchingTranslations") 
                            : t("admin.noTranslationsInSection")}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      Object.entries(getFilteredTranslations(section)).map(([key, value]) => (
                        <div 
                          key={key} 
                          className="border rounded-md p-3 transition-all hover:bg-accent/30"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-muted-foreground break-all">{key}</div>
                            {editMode?.section === section && editMode?.key === key ? (
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditMode(null)}
                                  disabled={isLoading}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {t("common.cancel")}
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => {
                                    const textarea = document.getElementById(`edit-${section}-${key}`) as HTMLTextAreaElement;
                                    saveTranslation(section, key, textarea.value);
                                  }}
                                  disabled={isLoading}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  {t("common.save")}
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditMode({ section, key })}
                                disabled={!!newTranslationMode || !!(editMode && (editMode.section !== section || editMode.key !== key))}
                              >
                                {t("common.edit")}
                              </Button>
                            )}
                          </div>
                          {editMode?.section === section && editMode?.key === key ? (
                            <Textarea 
                              id={`edit-${section}-${key}`}
                              defaultValue={value as string} 
                              className="mt-1"
                              rows={Math.max(2, (value as string).split('\n').length)}
                            />
                          ) : (
                            <div className="text-sm break-words whitespace-pre-wrap">{value as string}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TranslationsPanel;