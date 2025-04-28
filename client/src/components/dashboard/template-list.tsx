import { File as FileModel } from "@shared/schema";
import { format } from "date-fns";
import { FileIcon, FilePen, FileText, ExternalLink } from "lucide-react";

interface TemplateListProps {
  templates: FileModel[];
  isLoading?: boolean;
  onUseTemplate?: (fileId: number) => void;
}

export default function TemplateList({
  templates,
  isLoading,
  onUseTemplate,
}: TemplateListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getIconByType = (type: string, templateType: string) => {
    if (templateType === "invoice") return <FileIcon className="h-4 w-4" />;
    if (templateType === "proposal" || templateType === "contract")
      return <FilePen className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getColorByType = (type: string, templateType: string) => {
    if (templateType === "invoice") return "bg-blue-50 text-blue-500";
    if (templateType === "proposal" || templateType === "contract")
      return "bg-green-50 text-green-500";
    if (templateType === "report") return "bg-purple-50 text-purple-500";
    return "bg-gray-50 text-gray-500";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Recent Templates</h3>
        <a
          href="/files?filter=templates"
          className="text-primary text-xs font-medium hover:underline"
        >
          View All
        </a>
      </div>

      <div className="space-y-3">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center p-2 hover:bg-gray-50 rounded-lg"
            >
              <div
                className={`w-8 h-8 ${getColorByType(template.type, template.templateType || "")} rounded flex items-center justify-center mr-3`}
              >
                {getIconByType(template.type, template.templateType || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{template.name}</p>
                <p className="text-xs text-gray-500">
                  Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => onUseTemplate && onUseTemplate(template.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}
