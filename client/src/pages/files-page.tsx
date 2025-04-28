import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { File } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Upload,
  Copy,
  FileUp,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { bytesToSize } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/json",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
];

const fileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "File is required")
    .refine(
      (files) => files[0] && files[0].size <= MAX_FILE_SIZE,
      "File size should be less than 5MB",
    )
    .refine(
      (files) => files[0] && ACCEPTED_FILE_TYPES.includes(files[0].type),
      "Unsupported file format. Please upload a JSON, TXT, MD, CSV, PDF, DOCX, XLSX, or PPTX file.",
    ),
  isTemplate: z.boolean().default(false),
  templateType: z.string().optional(),
});

export default function FilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch files
  const { data: files, isLoading } = useQuery({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json() as Promise<File[]>;
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fileSchema>) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("file", data.file[0]);
      formData.append("isTemplate", data.isTemplate.toString());
      if (data.templateType) {
        formData.append("templateType", data.templateType);
      }

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      form.reset();
      setIsUploadDialogOpen(false);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setIsDeleteDialogOpen(false);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      name: "",
      isTemplate: false,
      templateType: "",
    },
  });

  const watchIsTemplate = form.watch("isTemplate");

  const handleUploadSubmit = (data: z.infer<typeof fileSchema>) => {
    uploadFileMutation.mutate(data);
  };

  const handleDeleteClick = (file: File) => {
    setSelectedFile(file);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedFile) {
      deleteFileMutation.mutate(selectedFile.id);
    }
  };

  // Filter files based on active tab
  const filteredFiles =
    activeTab === "all"
      ? files
      : activeTab === "templates"
        ? files?.filter((file) => file.isTemplate)
        : files?.filter((file) => !file.isTemplate);

  const downloadFile = async (file: File) => {
    try {
      const res = await fetch(`/api/files/${file.id}/download`);
      if (!res.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get file icon based on content type
  const getFileIcon = (contentType: string) => {
    if (contentType.includes("json")) return "json";
    if (contentType.includes("plain")) return "txt";
    if (contentType.includes("markdown")) return "md";
    if (contentType.includes("csv")) return "csv";
    if (contentType.includes("pdf")) return "pdf";
    if (contentType.includes("word")) return "docx";
    if (contentType.includes("spreadsheet")) return "xlsx";
    if (contentType.includes("presentation")) return "pptx";
    return "file";
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Files &amp; Templates
          </h1>
          <p className="text-muted-foreground">
            Manage your files and reusable templates for AI agents
          </p>
        </div>
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
          className="mt-4 md:mt-0"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload File
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {!filteredFiles || filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No files found</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Upload your first file or template to get started.
                  </p>
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Upload File
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-md border ${file.isTemplate ? "bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "bg-muted border-border"}`}
                          >
                            <FileText
                              className={`h-4 w-4 ${file.isTemplate ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-md font-semibold truncate max-w-[180px]">
                              {file.name}
                            </CardTitle>
                            <CardDescription>
                              {file.isTemplate ? "Template" : "File"} •{" "}
                              {getFileIcon(file.contentType).toUpperCase()}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => downloadFile(file)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(file)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">
                            {bytesToSize(file.size)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(file.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {file.isTemplate && file.templateType && (
                          <div className="flex justify-between">
                            <span>Template Type:</span>
                            <span className="font-medium capitalize">
                              {file.templateType}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => downloadFile(file)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Add files or templates for use with your AI agents.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUploadSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Template" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept={ACCEPTED_FILE_TYPES.join(",")}
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JSON, TXT, MD, CSV, PDF, DOCX, XLSX,
                      PPTX. Max size: 5MB.
                    </p>
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <Label>This is a reusable template</Label>
                    </FormItem>
                  )}
                />
              </div>

              {watchIsTemplate && (
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
                            <SelectValue placeholder="Select template type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="query">Database Query</SelectItem>
                          <SelectItem value="code">Code Snippet</SelectItem>
                          <SelectItem value="prompt">AI Prompt</SelectItem>
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
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadFileMutation.isPending}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteFileMutation.isPending}
            >
              {deleteFileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
