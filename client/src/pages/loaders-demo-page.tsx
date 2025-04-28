import React, { useState } from "react";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { LoadingContainer } from "@/components/ui/loading-container";
import { ContentSkeleton } from "@/components/ui/skeleton-loader";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoadersDemoPage() {
  const [demoLoader, setDemoLoader] = useState<boolean>(true);
  const [loaderVariant, setLoaderVariant] = useState<string>("bot");
  const [loaderSize, setLoaderSize] = useState<string>("md");
  const [showFullScreen, setShowFullScreen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(30);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Loading Animations</h1>
          <p className="text-muted-foreground">
            Playful and engaging loading animations for Mirxa.io
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="loader-demo-switch"
              checked={demoLoader}
              onCheckedChange={setDemoLoader}
            />
            <Label htmlFor="loader-demo-switch">Show loaders</Label>
          </div>
          <Button variant="outline" onClick={() => setShowFullScreen(true)}>
            Show Full Screen
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="loaders">
        <TabsList className="mb-6">
          <TabsTrigger value="loaders">Character Loaders</TabsTrigger>
          <TabsTrigger value="containers">Loading Containers</TabsTrigger>
          <TabsTrigger value="skeletons">Content Skeletons</TabsTrigger>
        </TabsList>

        <TabsContent value="loaders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Character Loaders</CardTitle>
              <CardDescription>
                Playful animated loading indicators with various character
                designs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                <div className="flex flex-col items-center">
                  <AnimatedLoader
                    variant="spinner"
                    size={loaderSize as any}
                    text="Spinner"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <AnimatedLoader
                    variant="bot"
                    size={loaderSize as any}
                    text="Bot"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <AnimatedLoader
                    variant="brain"
                    size={loaderSize as any}
                    text="Brain"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <AnimatedLoader
                    variant="gears"
                    size={loaderSize as any}
                    text="Gears"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <AnimatedLoader
                    variant="stars"
                    size={loaderSize as any}
                    text="Stars"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="space-y-2 w-64">
                  <Label htmlFor="size-select">Size</Label>
                  <Select value={loaderSize} onValueChange={setLoaderSize}>
                    <SelectTrigger id="size-select">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading Containers</CardTitle>
              <CardDescription>
                Content containers with loading state animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Standard Container</h3>
                  <LoadingContainer
                    isLoading={demoLoader}
                    loaderVariant={loaderVariant as any}
                    loaderSize={loaderSize as any}
                    loadingText="Loading content..."
                  >
                    <Card className="p-6">
                      <h3 className="text-lg font-medium mb-2">
                        Content Title
                      </h3>
                      <p>
                        This is the actual content that will be displayed when
                        loading is complete.
                      </p>
                    </Card>
                  </LoadingContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Overlay Container</h3>
                  <LoadingContainer
                    isLoading={demoLoader}
                    loaderVariant={loaderVariant as any}
                    loaderSize={loaderSize as any}
                    loadingText="Processing..."
                    overlay={true}
                  >
                    <Card className="p-6 min-h-[200px]">
                      <h3 className="text-lg font-medium mb-2">
                        Content Title
                      </h3>
                      <p>
                        This content is visible but blurred behind the loading
                        overlay.
                      </p>
                      <p className="mt-4">
                        Try toggling the switch above to see the effect.
                      </p>
                    </Card>
                  </LoadingContainer>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="space-y-2 w-64">
                  <Label htmlFor="variant-select">Loader Character</Label>
                  <Select
                    value={loaderVariant}
                    onValueChange={setLoaderVariant}
                  >
                    <SelectTrigger id="variant-select">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spinner">Spinner</SelectItem>
                      <SelectItem value="bot">Bot</SelectItem>
                      <SelectItem value="brain">Brain</SelectItem>
                      <SelectItem value="gears">Gears</SelectItem>
                      <SelectItem value="stars">Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skeletons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Skeletons</CardTitle>
              <CardDescription>
                Placeholder skeletons for various content types while data is
                loading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">List Skeleton</h3>
                  <ContentSkeleton
                    type="list"
                    characterAnimation={demoLoader}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Card Skeleton</h3>
                  <ContentSkeleton
                    type="card"
                    characterAnimation={demoLoader}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Table Skeleton</h3>
                  <ContentSkeleton
                    type="table"
                    rows={3}
                    characterAnimation={demoLoader}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Grid Skeleton</h3>
                  <ContentSkeleton
                    type="grid"
                    className="grid-cols-2"
                    characterAnimation={demoLoader}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Screen Demo */}
      {showFullScreen && (
        <LoadingScreen
          variant="fullscreen"
          loaderVariant={loaderVariant as any}
          loaderSize={loaderSize as any}
          text="Loading your content..."
          showProgress={true}
          progress={progress}
          className="bg-background/95"
        />
      )}

      {/* Controls for Full Screen Demo */}
      {showFullScreen && (
        <div className="fixed bottom-6 right-6 z-[60] bg-background border border-border rounded-lg shadow-lg p-4 flex flex-col gap-4 w-64">
          <div className="flex justify-between items-center">
            <span className="font-medium">Loading Screen Demo</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullScreen(false)}
            >
              Close
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Progress: {progress}%</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
