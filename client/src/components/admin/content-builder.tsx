import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Copy, Clipboard, Search, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ContentBuilder: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Generation state
  const [generateOptions, setGenerateOptions] = useState<{
    prompt: string;
    contentType: string;
    tone: string;
  }>({
    prompt: "",
    contentType: "blog",
    tone: "professional"
  });
  
  const [generatedContent, setGeneratedContent] = useState<string>("");
  
  // Analysis state
  const [textToAnalyze, setTextToAnalyze] = useState<string>("");
  const [analysis, setAnalysis] = useState<{
    sentiment: string;
    keyTerms: string[];
    readabilityScore: number;
    suggestions: string[];
  } | null>(null);
  
  // Generate content using OpenAI
  const handleGenerateContent = async () => {
    if (!generateOptions.prompt || !generateOptions.contentType || !generateOptions.tone) {
      toast({
        title: "Missing information",
        description: "Please provide a prompt, content type, and tone",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent("");
    
    try {
      const response = await apiRequest<{content: string}>('/api/ai/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          prompt: generateOptions.prompt,
          contentType: generateOptions.contentType,
          tone: generateOptions.tone
        })
      });
      
      if (response.content) {
        setGeneratedContent(response.content);
        toast({
          title: "Content Generated",
          description: "AI has successfully generated content based on your prompt"
        });
      }
    } catch (error) {
      console.error("Content generation error:", error);
      toast({
        title: "Generation Failed",
        description: "There was a problem generating content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Analyze content using OpenAI
  const handleAnalyzeContent = async () => {
    if (!textToAnalyze) {
      toast({
        title: "No content",
        description: "Please provide text to analyze",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      const response = await apiRequest<{
        sentiment: string;
        keyTerms: string[];
        readabilityScore: number;
        suggestions: string[];
      }>('/api/ai/analyze-content', {
        method: 'POST',
        body: JSON.stringify({
          text: textToAnalyze
        })
      });
      
      setAnalysis(response);
      
      toast({
        title: "Analysis Complete",
        description: "Content has been analyzed successfully"
      });
    } catch (error) {
      console.error("Content analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was a problem analyzing the content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Copy generated content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("admin.contentBuilder")}</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.aiContentTools")}</CardTitle>
          <CardDescription>
            {t("admin.contentToolsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="generate">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>{t("admin.generateContent")}</span>
              </TabsTrigger>
              <TabsTrigger value="analyze">
                <Search className="w-4 h-4 mr-2" />
                <span>{t("admin.analyzeContent")}</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Content Generation Tab */}
            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contentType">{t("admin.contentType")}</Label>
                  <Select 
                    value={generateOptions.contentType}
                    onValueChange={(value) => setGenerateOptions({...generateOptions, contentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.selectContentType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">{t("admin.blogPost")}</SelectItem>
                      <SelectItem value="email">{t("admin.emailCampaign")}</SelectItem>
                      <SelectItem value="product">{t("admin.productDescription")}</SelectItem>
                      <SelectItem value="social">{t("admin.socialMediaPost")}</SelectItem>
                      <SelectItem value="headline">{t("admin.headline")}</SelectItem>
                      <SelectItem value="ad">{t("admin.advertisementCopy")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tone">{t("admin.contentTone")}</Label>
                  <Select 
                    value={generateOptions.tone}
                    onValueChange={(value) => setGenerateOptions({...generateOptions, tone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.selectTone")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">{t("admin.professional")}</SelectItem>
                      <SelectItem value="casual">{t("admin.casual")}</SelectItem>
                      <SelectItem value="friendly">{t("admin.friendly")}</SelectItem>
                      <SelectItem value="formal">{t("admin.formal")}</SelectItem>
                      <SelectItem value="persuasive">{t("admin.persuasive")}</SelectItem>
                      <SelectItem value="humorous">{t("admin.humorous")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="prompt">{t("admin.prompt")}</Label>
                  <Textarea
                    id="prompt"
                    value={generateOptions.prompt}
                    onChange={(e) => setGenerateOptions({...generateOptions, prompt: e.target.value})}
                    placeholder={t("admin.promptPlaceholder")}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={isGenerating || !generateOptions.prompt}
                  className="w-full sm:w-auto ml-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>{t("admin.generating")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span>{t("admin.generateContent")}</span>
                    </>
                  )}
                </Button>
              </div>
              
              {generatedContent && (
                <div className="mt-6">
                  <div className="bg-muted rounded-md p-4 relative">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generatedContent)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-line">
                      {generatedContent}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Content Analysis Tab */}
            <TabsContent value="analyze" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="textToAnalyze">{t("admin.textToAnalyze")}</Label>
                  <Textarea
                    id="textToAnalyze"
                    value={textToAnalyze}
                    onChange={(e) => setTextToAnalyze(e.target.value)}
                    placeholder={t("admin.textToAnalyzePlaceholder")}
                    className="min-h-[150px]"
                  />
                </div>
                
                <Button 
                  onClick={handleAnalyzeContent} 
                  disabled={isAnalyzing || !textToAnalyze}
                  className="w-full sm:w-auto ml-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>{t("admin.analyzing")}</span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      <span>{t("admin.analyzeContent")}</span>
                    </>
                  )}
                </Button>
              </div>
              
              {analysis && (
                <div className="mt-6">
                  <div className="bg-muted rounded-md p-4">
                    <h3 className="text-lg font-medium mb-3">{t("admin.analysisResults")}</h3>
                    
                    <div className="grid gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">{t("admin.sentiment")}</h4>
                        <div className="bg-background rounded p-2">
                          {analysis.sentiment}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">{t("admin.keyTerms")}</h4>
                        <div className="bg-background rounded p-2">
                          <div className="flex flex-wrap gap-2">
                            {analysis.keyTerms.map((term, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                              >
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">{t("admin.readabilityScore")}</h4>
                        <div className="bg-background rounded p-2 flex items-center">
                          <div 
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${analysis.readabilityScore * 10}%` }}
                          />
                          <span className="ml-2">{analysis.readabilityScore}/10</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">{t("admin.suggestions")}</h4>
                        <div className="bg-background rounded p-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {analysis.suggestions.map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentBuilder;