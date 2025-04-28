import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { File, InsertFile } from "@shared/schema";
import { 
  Loader2, 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  FileImage, 
  FilePen, 
  FileArchive, 
  File as FileIcon,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";

const fileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().optional(),
  contentType: z.string().optional(),
  isTemplate: z.boolean().default(false),
  templateType: z.string().optional(),
  size: z.number().default(0),
  path: z.string().default(""),
});

type FileFormData = z.infer<typeof fileFormSchema>;

export default function FilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Form setup
  const form = useForm<FileFormData>({
    resolver: zodResolver(fileFormSchema),
    defaultValues: {
      name: "",
      type: "",
      contentType: "",
      isTemplate: false,
      templateType: "",
      size: 0,
      path: "",
    },
  });

  // Get files data
  const { 
    data: files = [], 
    isLoading: isLoadingFiles 
  } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (newFile: InsertFile) => {
      const res = await apiRequest("POST", "/api/files", newFile);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setIsUploadDialogOpen(false);
      form.reset();
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle upload file form submission
  const onSubmit = (data: FileFormData) => {
    if (!user) return;
    
    // In a real app, we would upload the actual file to a storage service
    // and then save the metadata to our database
    const newFile: InsertFile = {
      userId: user.id,
      name: data.name,
      type: data.type || "document",
      contentType: data.contentType || "text/plain",
      isTemplate: data.isTemplate,
      templateType: data.isTemplate ? data.templateType : undefined,
      size: data.size,
      path: data.path,
    };
    
    uploadFileMutation.mutate(newFile);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileToUpload(file as unknown as File);
      
      // Prefill the form with file data
      form.setValue("name", file.name);
      form.setValue("type", getFileTypeFromExtension(file.name));
      form.setValue("contentType", file.type);
      form.setValue("size", file.size);
      form.setValue("path", `/uploads/${file.name}`); // Placeholder path
    }
  };

  // Get file type from file extension
  const getFileTypeFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    
    return 'other';
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'image':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'pdf':
        return <FilePen className="h-6 w-6 text-red-500" />;
      case 'archive':
        return <FileArchive className="h-6 w-6 text-yellow-500" />;
      case 'document':
      case 'spreadsheet':
      case 'presentation':
        return <FileText className="h-6 w-6 text-green-500" />;
      default:
        return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Filter files based on search term and active tab
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'templates') return matchesSearch && file.isTemplate;
    if (activeTab === 'documents') return matchesSearch && file.type === 'document' && !file.isTemplate;
    if (activeTab === 'images') return matchesSearch && file.type === 'image';
    if (activeTab === 'other') return matchesSearch && !['document', 'image'].includes(file.type) && !file.isTemplate;
    
    return matchesSearch;
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Loading state
  if (isLoadingFiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Files & Templates"
      subtitle="Manage your files and templates that agents can use"
    >
      {/* Actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              <span>Upload File</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a file or create a template for your AI agents to use.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <FormLabel>File</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileInputChange}
                    />
                    {fileToUpload ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-2">
                          {getFileIcon(form.getValues('type') || '')}
                        </div>
                        <p className="text-sm font-medium">{fileToUpload.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(fileToUpload.size)}</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setFileToUpload(null);
                            form.reset();
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500">SVG, PNG, JPG, PDF, DOCX (max. 10MB)</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Document" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Template</FormLabel>
                        <FormDescription>
                          Mark this file as a template for AI agents to use
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
                
                {form.watch("isTemplate") && (
                  <FormField
                    control={form.control}
                    name="templateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="report">Report</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={uploadFileMutation.isPending || !fileToUpload}
                  >
                    {uploadFileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Upload
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* File tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 shadow-sm border border-gray-100 rounded-lg">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          {getFileIcon(file.type)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{file.name}</div>
                          {file.isTemplate && (
                            <div className="text-xs text-primary">Template: {file.templateType}</div>
                          )}
                        </TableCell>
                        <TableCell>{file.type}</TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>{new Date(file.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the file "{file.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteFileMutation.mutate(file.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleteFileMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-gray-500 mb-2">No files found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsUploadDialogOpen(true)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredFiles.length} of {files.length} files
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <Card key={file.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      {getFileIcon(file.type)}
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-gray-500">{file.templateType}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Size:</div>
                      <div>{formatFileSize(file.size)}</div>
                      <div className="text-gray-500">Updated:</div>
                      <div>{new Date(file.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between p-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the template "{file.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteFileMutation.mutate(file.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteFileMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">No templates found</p>
                <p className="text-gray-500 mt-1">Upload a file and mark it as a template</p>
                <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Upload Template</span>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Other tabs would be similar to the above */}
        <TabsContent value="documents">
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">No documents found</p>
              <p className="text-gray-500 mt-1">Upload your first document</p>
              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload Document</span>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="images">
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">No images found</p>
              <p className="text-gray-500 mt-1">Upload your first image</p>
              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload Image</span>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="other">
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <FileIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">No other files found</p>
              <p className="text-gray-500 mt-1">Upload other types of files</p>
              <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload File</span>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
