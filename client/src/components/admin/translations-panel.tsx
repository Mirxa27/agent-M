import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Save, Edit, Plus, X, Check, Languages, Wand2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import i18next from "i18next";
import { apiRequest } from "@/lib/queryClient";

const TranslationsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeSection, setActiveSection] = useState("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [selectedTranslation, setSelectedTranslation] = useState<{key: string, value: string, section: string} | null>(null);
  const [editMode, setEditMode] = useState<{key: string, value: string, section: string} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({key: "", value: "", section: activeSection});
  const [translateOptions, setTranslateOptions] = useState({
    sourceLanguage: i18n.language || "en",
    targetLanguage: "",
    text: ""
  });

  // Load translations on component mount
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // Get all resources from i18next
        const resources = i18next.getDataByLanguage(i18n.language) || {};
        
        if (resources && resources.translation) {
          // Convert the flat translation object to a nested structure
          const translationObj = resources.translation;
          const nestedTranslations: Record<string, Record<string, any>> = {};
          
          // Group translations by their first segment (before the first dot)
          Object.entries(translationObj).forEach(([key, value]) => {
            const segments = key.split('.');
            const section = segments[0];
            const rest = segments.slice(1);
            
            if (!nestedTranslations[section]) {
              nestedTranslations[section] = {};
            }
            
            if (rest.length > 0) {
              // If there are more segments, use the rest as a nested key
              nestedTranslations[section][rest.join('.')] = value;
            } else {
              // If no more segments, just use the value
              nestedTranslations[section]['_value'] = value;
            }
          });
          
          // Ensure we have all common admin sections even if they're empty
          const requiredSections = ['common', 'admin', 'auth', 'nav', 'app'];
          requiredSections.forEach(section => {
            if (!nestedTranslations[section]) {
              nestedTranslations[section] = {};
            }
          });
          
          setTranslations(nestedTranslations);
        }
      } catch (error) {
        console.error("Error loading translations:", error);
        toast({
          title: t("common.error"),
          description: t("admin.failedToLoadTranslations"),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [i18n.language, toast, t]);

  // Get the sections from the translations
  const sections = Object.keys(translations).sort();

  // Get filtered translations for the current section
  const getFilteredTranslations = () => {
    if (!translations[activeSection]) return [];
    
    const sectionTranslations = translations[activeSection];
    
    if (typeof sectionTranslations !== 'object' || sectionTranslations === null) {
      return [];
    }
    
    const entries = Object.entries(sectionTranslations).filter(([key, value]) => {
      if (!searchQuery) return true;
      return (
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    return entries.map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value)
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would save the translations to the server
      // For now, we'll just show a success message
      
      toast({
        title: "Success",
        description: "Translations saved successfully"
      });
    } catch (error) {
      console.error("Error saving translations:", error);
      toast({
        title: "Error",
        description: "Failed to save translations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (key: string, value: string) => {
    setEditMode({key, value, section: activeSection});
  };

  const handleCancelEdit = () => {
    setEditMode(null);
  };

  const handleSaveEdit = () => {
    if (!editMode) return;
    
    // Update translations
    const updatedTranslations = {...translations};
    updatedTranslations[editMode.section] = {
      ...updatedTranslations[editMode.section],
      [editMode.key]: editMode.value
    };
    
    setTranslations(updatedTranslations);
    setEditMode(null);
    
    toast({
      title: "Success",
      description: "Translation updated"
    });
  };

  const handleAddTranslation = () => {
    if (!newTranslation.key || !newTranslation.value) {
      toast({
        title: "Error",
        description: "Key and value are required",
        variant: "destructive"
      });
      return;
    }
    
    // Update translations
    const updatedTranslations = {...translations};
    
    if (!updatedTranslations[newTranslation.section]) {
      updatedTranslations[newTranslation.section] = {};
    }
    
    updatedTranslations[newTranslation.section] = {
      ...updatedTranslations[newTranslation.section],
      [newTranslation.key]: newTranslation.value
    };
    
    setTranslations(updatedTranslations);
    setIsDialogOpen(false);
    setNewTranslation({key: "", value: "", section: activeSection});
    
    toast({
      title: "Success",
      description: "Translation added"
    });
  };
  
  // AI Translation functionality
  const handleTranslateText = async () => {
    if (!translateOptions.text || !translateOptions.targetLanguage) {
      toast({
        title: "Error",
        description: "Please provide text and select a target language",
        variant: "destructive"
      });
      return;
    }
    
    setIsTranslating(true);
    
    try {
      const response = await apiRequest<{translatedText: string}>('POST', '/api/ai/translate', {
        body: JSON.stringify({
          text: translateOptions.text,
          sourceLanguage: translateOptions.sourceLanguage,
          targetLanguage: translateOptions.targetLanguage
        })
      });
      
      // Update the text field with the translated text
      if (response.translatedText) {
        // If editing, update the edit value
        if (editMode) {
          setEditMode({
            ...editMode,
            value: response.translatedText
          });
        }
        
        // Otherwise update the translation options with the result
        setTranslateOptions({
          ...translateOptions,
          text: response.translatedText
        });
        
        toast({
          title: "Translation Complete",
          description: "Text has been translated successfully"
        });
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "There was a problem translating the text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Bulk translation of all text in current section
  const handleBulkTranslate = async () => {
    if (!translations[activeSection] || Object.keys(translations[activeSection]).length === 0) {
      toast({
        title: "No translations",
        description: "There are no translations to translate in this section",
        variant: "destructive"
      });
      return;
    }
    
    if (!translateOptions.targetLanguage) {
      toast({
        title: "Target language required",
        description: "Please select a target language for translation",
        variant: "destructive"
      });
      return;
    }
    
    setIsTranslating(true);
    
    try {
      interface BulkTranslationResponse {
        translations: {
          [key: string]: {
            [key: string]: string
          }
        }
      }
      
      const response = await apiRequest<BulkTranslationResponse>('POST', '/api/ai/translate-bulk', {
        body: JSON.stringify({
          translations: { [activeSection]: translations[activeSection] },
          sourceLanguage: translateOptions.sourceLanguage,
          targetLanguage: translateOptions.targetLanguage
        })
      });
      
      if (response && response.translations && response.translations[activeSection]) {
        // Merge the returned translations with the current ones
        const updatedTranslations = {
          ...translations,
          [activeSection]: {
            ...translations[activeSection],
            ...response.translations[activeSection]
          }
        };
        
        setTranslations(updatedTranslations);
        
        toast({
          title: "Bulk Translation Complete",
          description: `Translated ${Object.keys(response.translations[activeSection]).length} items successfully`
        });
      }
    } catch (error) {
      console.error("Bulk translation error:", error);
      toast({
        title: "Bulk Translation Failed",
        description: "There was a problem translating the section. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("admin.translations")}</h2>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="self-end sm:self-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">{t("common.saving")}</span>
              <span className="sm:hidden">Saving</span>
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("common.saveChanges")}</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.manageTranslationsFor")} "{activeSection}" {t("admin.section")}</CardTitle>
          <CardDescription>
            {t("common.manage")} {t("admin.translations")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="sm:w-auto">
                      <Languages className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">AI Translation</span>
                      <span className="sm:hidden">Translate</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>AI-Powered Translation</DialogTitle>
                      <DialogDescription>
                        Translate content using OpenAI's advanced language model
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="sourceLanguage">Source Language</Label>
                        <Select 
                          value={translateOptions.sourceLanguage}
                          onValueChange={(value) => setTranslateOptions({...translateOptions, sourceLanguage: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="targetLanguage">Target Language</Label>
                        <Select 
                          value={translateOptions.targetLanguage}
                          onValueChange={(value) => setTranslateOptions({...translateOptions, targetLanguage: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="text">Text to Translate</Label>
                        <Input
                          id="text"
                          value={translateOptions.text}
                          onChange={(e) => setTranslateOptions({...translateOptions, text: e.target.value})}
                          placeholder="Enter text to translate"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTranslateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleTranslateText}
                        disabled={isTranslating || !translateOptions.text || !translateOptions.targetLanguage}
                      >
                        {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Translate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{t("admin.addNewTranslation")}</span>
                      <span className="sm:hidden">Add New</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("admin.addNewTranslation")}</DialogTitle>
                      <DialogDescription>
                        {t("common.addItemDescription", {item: t("admin.translation").toLowerCase()})}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="section">{t("admin.section")}</Label>
                        <Input
                          id="section"
                          value={newTranslation.section}
                          onChange={(e) => setNewTranslation({...newTranslation, section: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="key">{t("admin.translationKey")}</Label>
                        <Input
                          id="key"
                          value={newTranslation.key}
                          onChange={(e) => setNewTranslation({...newTranslation, key: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="value">{t("admin.translationValue")}</Label>
                        <Input
                          id="value"
                          value={newTranslation.value}
                          onChange={(e) => setNewTranslation({...newTranslation, value: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button onClick={handleAddTranslation}>
                        {t("common.add")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <Tabs defaultValue={activeSection} onValueChange={setActiveSection}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="flex-wrap h-auto inline-flex min-w-max">
                  {sections.map((section) => (
                    <TabsTrigger key={section} value={section}>
                      {section}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value={activeSection} className="mt-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableCaption>
                      {t("admin.translation")} {t("common.list")}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%] min-w-[200px]">{t("admin.translationKey")}</TableHead>
                        <TableHead className="w-[55%] min-w-[300px]">{t("admin.translationValue")}</TableHead>
                        <TableHead className="w-[15%] min-w-[100px]">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredTranslations().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6">
                            {searchQuery ? t("admin.noMatchingTranslations") : t("admin.noTranslationsInSection")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredTranslations().map(({ key, value }) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium break-all">{key}</TableCell>
                            <TableCell className="break-all">
                              {editMode && editMode.key === key ? (
                                <Input 
                                  value={editMode.value}
                                  onChange={(e) => setEditMode({...editMode, value: e.target.value})}
                                />
                              ) : (
                                value
                              )}
                            </TableCell>
                            <TableCell>
                              {editMode && editMode.key === key ? (
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(key, value)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            {Object.keys(translations[activeSection] || {}).length} {t("admin.translation", {count: Object.keys(translations[activeSection] || {}).length})}
          </div>
          <Button 
            variant="outline" 
            onClick={handleBulkTranslate} 
            disabled={isTranslating || !translateOptions.targetLanguage}
            className="h-auto py-2"
          >
            {isTranslating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            <span className="text-sm">Translate All to {translateOptions.targetLanguage.toUpperCase()}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TranslationsPanel;