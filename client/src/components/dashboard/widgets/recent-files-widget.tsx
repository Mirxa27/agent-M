import { useQuery } from '@tanstack/react-query';
import { File, FileType, ExternalLink, Download } from 'lucide-react';
import { Widget } from './widget-base';
import { LoadingWidget } from './loading-widget';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

export interface RecentFilesWidgetProps {
  limit?: number;
  onRemove?: () => void;
}

export const RecentFilesWidget = ({ limit = 5, onRemove }: RecentFilesWidgetProps) => {
  const { user } = useAuth();
  
  const { 
    isLoading, 
    error, 
    data: files,
    refetch 
  } = useQuery({
    queryKey: ['/api/files/recent', { limit }],
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingWidget title="Recent Files" icon={<File className="h-5 w-5" />} />;
  }

  if (error) {
    return (
      <Widget 
        id="recentFiles"
        title="Recent Files" 
        icon={<File className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<File className="h-10 w-10" />}
          title="Failed to load files"
          description="There was an error loading your recent files."
          actionText="Retry"
          onAction={() => refetch()}
        />
      </Widget>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Widget 
        id="recentFiles"
        title="Recent Files" 
        icon={<File className="h-5 w-5" />}
        onRemove={onRemove}
        onRefresh={() => refetch()}
      >
        <EmptyState
          icon={<File className="h-10 w-10" />}
          title="No recent files"
          description="Upload files or create templates to see them here."
          actionText="Upload File"
          onAction={() => window.location.href = '/files'}
        />
      </Widget>
    );
  }

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf':
        return <FileType className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <Widget 
      id="recentFiles"
      title="Recent Files"
      description="Your recently uploaded and viewed files"
      icon={<File className="h-5 w-5" />}
      onRemove={onRemove}
      onRefresh={() => refetch()}
    >
      <div className="space-y-2">
        {files.map((file: any) => (
          <div key={file.id} className="flex items-center justify-between border rounded-md p-2">
            <div className="flex items-center">
              <div className="mr-3 text-muted-foreground">
                {getFileIcon(file.fileType)}
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">{file.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {file.fileType.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" title="View file">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Download file">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};