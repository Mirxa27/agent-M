import fs from "fs/promises";
import path from "path";

const TEMPLATES_DIR = path.join(__dirname, "../../shared/document-templates");

export interface DocumentTemplateInfo {
  id: string;
  name: string;
  description?: string; // Optional description
  tags?: string[]; // Optional tags for categorization
  filePath: string; // Relative path within the templates directory
}

/**
 * Lists available document templates.
 * Reads the shared/document-templates directory and generates a list of templates.
 * For now, it derives the name from the filename.
 * This can be expanded to read metadata from each template file (e.g., from frontmatter).
 */
export async function listDocumentTemplates(): Promise<DocumentTemplateInfo[]> {
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates: DocumentTemplateInfo[] = [];

    for (const file of files) {
      // Basic filtering, e.g., for markdown files
      if (file.endsWith(".md")) {
        const filePath = path.join(TEMPLATES_DIR, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          const templateId = path.basename(file, ".md");
          // Derive a user-friendly name from the filename
          const name = templateId
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words

          templates.push({
            id: templateId,
            name: name,
            filePath: file, // Store relative path
            // description and tags could be loaded from file metadata later
          });
        }
      }
    }
    return templates;
  } catch (error) {
    console.error("Error listing document templates:", error);
    // If the directory doesn't exist or other error, return empty array
    return [];
  }
}

/**
 * Retrieves the content of a specific document template.
 * @param templateId The ID of the template (usually the filename without extension).
 */
export async function getDocumentTemplateContent(templateId: string): Promise<string | null> {
  try {
    // Ensure the templateId is a safe filename (e.g., no path traversal)
    if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
        console.error("Invalid template ID format:", templateId);
        return null;
    }
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.md`);
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading template ${templateId}:`, error);
    return null;
  }
}

// Example usage (can be removed or used for testing)
// async function test() {
//   const templates = await listDocumentTemplates();
//   console.log("Available templates:", templates);
//   if (templates.length > 0) {
//     const content = await getDocumentTemplateContent(templates[0].id);
//     console.log(`\nContent of ${templates[0].name}:\n`, content ? content.substring(0, 100) + "..." : "Not found");
//   }
// }
// test();
