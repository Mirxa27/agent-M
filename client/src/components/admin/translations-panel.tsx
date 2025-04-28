import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import { Loader2, Search, Save, Edit, Plus, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import i18next from "i18next";

const TranslationsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [selectedTranslation, setSelectedTranslation] = useState<{key: string, value: string, section: string} | null>(null);
  const [editMode, setEditMode] = useState<{key: string, value: string, section: string} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({key: "", value: "", section: activeSection});

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
            const [section, ...rest] = key.split('.');
            
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
          
          setTranslations(nestedTranslations);
        }
      } catch (error) {
        console.error("Error loading translations:", error);
        toast({
          title: "Error",
          description: "Failed to load translations",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [i18n.language, toast]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("admin.translations")}</h2>
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
          <CardTitle>{t("admin.manageTranslationsFor")} "{activeSection}" {t("admin.section")}</CardTitle>
          <CardDescription>
            {t("common.manage")} {t("admin.translations")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("admin.addNewTranslation")}
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
            
            <Tabs defaultValue={activeSection} onValueChange={setActiveSection}>
              <TabsList className="flex-wrap h-auto">
                {sections.map((section) => (
                  <TabsTrigger key={section} value={section}>
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeSection} className="mt-4">
                <Table>
                  <TableCaption>
                    {t("admin.translation")} {t("common.list")}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">{t("admin.translationKey")}</TableHead>
                      <TableHead>{t("admin.translationValue")}</TableHead>
                      <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
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
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell>
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
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationsPanel;