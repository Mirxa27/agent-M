import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement>, DropzoneOptions {
  buttonOnly?: boolean;
  children?: React.ReactNode;
}

export function Dropzone({
  className,
  buttonOnly,
  children,
  ...props
}: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone(props);

  if (buttonOnly) {
    return (
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {children || (
          <Button 
            variant="ghost" 
            size="sm"
            type="button"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            <span>Upload Files</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        className: cn(
          "flex flex-col items-center justify-center rounded-md border border-dashed p-6 cursor-pointer",
          isDragActive
            ? "border-primary/50 bg-primary/5"
            : "border-muted-foreground/25 hover:bg-muted/25",
          className
        ),
      })}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        {isDragActive ? (
          <span className="font-medium">Drop the files here</span>
        ) : (
          <>
            <span className="font-medium">
              Drag & drop files here or click to select
            </span>
            <span>
              {props.maxFiles === 1
                ? "Upload one file"
                : `Upload up to ${props.maxFiles} files`}
            </span>
            {props.maxSize && (
              <span>Max size: {Math.round(props.maxSize / 1024 / 1024)}MB</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}