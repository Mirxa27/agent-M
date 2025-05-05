import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";

export function UploadTest() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);
  const [adminCheck, setAdminCheck] = useState<{
    isAdmin: boolean;
    message: string;
  } | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("logo", file);

      // Make the upload request with credentials
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
        credentials: "include", // Ensure cookies are sent for auth
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult({
        success: true,
        message: result.message || "Upload successful",
        url: result.url,
      });

      toast({
        title: "Upload successful",
        description: "File has been uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      });

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const checkAdminAccess = async () => {
    setIsCheckingAdmin(true);
    try {
      const response = await fetch("/api/admin/check", {
        method: "GET",
        credentials: "include", // Send cookies for authentication
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Not authorized");
      }

      setAdminCheck({
        isAdmin: true,
        message: result.message || "You have admin access",
      });

      toast({
        title: "Admin check",
        description: "You have admin access",
      });
    } catch (error) {
      console.error("Admin check error:", error);
      setAdminCheck({
        isAdmin: false,
        message: error instanceof Error ? error.message : "Not authorized",
      });

      toast({
        title: "Admin check failed",
        description: error instanceof Error ? error.message : "You don't have admin access",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>File Upload Test</CardTitle>
        <CardDescription>Test the file upload functionality for admin users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={checkAdminAccess} 
              variant="outline" 
              disabled={isCheckingAdmin}
              className="w-full md:w-auto"
            >
              {isCheckingAdmin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking admin access...
                </>
              ) : (
                <>Check Admin Access</>
              )}
            </Button>
            
            {adminCheck && (
              <div className={`p-3 rounded-md ${adminCheck.isAdmin ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                <div className="flex items-center">
                  {adminCheck.isAdmin ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <span>{adminCheck.message}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium">
              Select file to upload
            </label>
            <Input 
              id="file-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/png,image/jpeg,image/gif,image/svg+xml"
            />
            <p className="text-xs text-gray-500">
              Supported file types: PNG, JPEG, GIF, SVG. Max size: 5MB
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full md:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>

          {uploadResult && (
            <div className={`p-3 rounded-md ${uploadResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
              <div className="flex items-center">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span>{uploadResult.message}</span>
              </div>
              {uploadResult.success && uploadResult.url && (
                <div className="mt-3">
                  <p className="font-medium">Uploaded file URL:</p>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-x-auto">
                    {uploadResult.url}
                  </code>
                  {uploadResult.url.endsWith('.svg') || 
                   uploadResult.url.endsWith('.png') || 
                   uploadResult.url.endsWith('.jpg') || 
                   uploadResult.url.endsWith('.jpeg') || 
                   uploadResult.url.endsWith('.gif') ? (
                    <div className="mt-3">
                      <p className="font-medium">Preview:</p>
                      <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        <img 
                          src={uploadResult.url} 
                          alt="Uploaded file" 
                          className="max-h-32 object-contain"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2">
        <div className="text-sm text-gray-500">
          <strong>Note:</strong> This component is for testing purposes only. You must be logged in as an admin to use this functionality.
        </div>
      </CardFooter>
    </Card>
  );
}

export default UploadTest;