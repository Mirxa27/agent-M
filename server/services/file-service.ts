import { promises as fsPromises } from 'fs';
import path from 'path';
import { File as FileModel } from '@shared/schema';
import { storage } from '../storage';
import { processDocument, isSupportedDocumentType } from './document-processor';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    throw error;
  }
}

// File data with text content
export interface FileData {
  buffer: Buffer;
  textContent: string;
  contentType: string;
  type: string;
}

// Load and process a file from storage
export async function loadAndProcessFile(file: FileModel): Promise<FileData> {
  try {
    // Get file path
    const filePath = path.join(UPLOADS_DIR, file.path);

    // Read file buffer
    const buffer = await fsPromises.readFile(filePath);

    // Process file based on content type
    let textContent = '';

    // Extract text content based on file type
    if (file.contentType.startsWith('text/')) {
      // Text files
      textContent = buffer.toString('utf8');
    } else if (file.contentType === 'application/json') {
      // JSON files
      textContent = buffer.toString('utf8');
    } else if (isSupportedDocumentType(file.contentType)) {
      // Process documents using document processor
      try {
        const documentContent = await processDocument(buffer, file.contentType);
        textContent = documentContent.text;

        // Add metadata information to content if available
        if (documentContent.metadata) {
          const metaInfo = [];
          if (documentContent.metadata.pages)
            metaInfo.push(`Pages: ${documentContent.metadata.pages}`);
          if (documentContent.metadata.sheets)
            metaInfo.push(`Sheets: ${documentContent.metadata.sheets.join(', ')}`);
          if (documentContent.metadata.slides)
            metaInfo.push(`Slides: ${documentContent.metadata.slides}`);
          if (documentContent.metadata.wordCount)
            metaInfo.push(`Words: ${documentContent.metadata.wordCount}`);

          if (metaInfo.length > 0) {
            textContent = `[Document Info: ${metaInfo.join(', ')}]\n\n${textContent}`;
          }
        }
      } catch (error) {
        console.error(`Error processing document ${file.name}:`, error);
        textContent = `[Document processing failed: ${error.message}]`;
      }
    } else if (file.contentType.startsWith('image/')) {
      // Image files
      textContent = `[Image file: ${file.name}]`;
    } else {
      // Other binary files
      textContent = `[Binary file: ${file.name} (${file.contentType})]`;
    }

    return {
      buffer,
      textContent,
      contentType: file.contentType,
      type: file.type,
    };
  } catch (error: any) {
    console.error(`Error loading file ${file.id}:`, error);
    throw new Error(`Failed to load file: ${error.message}`);
  }
}

// Save a file to storage
export async function saveFile(
  userId: number,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  isTemplate: boolean = false,
  templateType: string | null = null
): Promise<FileModel> {
  try {
    await ensureUploadsDir();

    // Generate unique file path
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const filePath = `${uniqueId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Write file to disk
    await fsPromises.writeFile(fullPath, fileBuffer);

    // Determine file type
    const fileExtension = path.extname(fileName).toLowerCase();
    let fileType = 'document';

    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(fileExtension)) {
      fileType = 'image';
    } else if (['.pdf'].includes(fileExtension)) {
      fileType = 'pdf';
    } else if (['.csv', '.xlsx', '.xls'].includes(fileExtension)) {
      fileType = 'spreadsheet';
    } else if (['.docx', '.doc', '.txt', '.rtf'].includes(fileExtension)) {
      fileType = 'document';
    } else if (['.json', '.xml', '.yaml', '.yml'].includes(fileExtension)) {
      fileType = 'data';
    }

    // Create file record in database
    const file = await storage.createFile({
      userId,
      name: fileName,
      path: filePath,
      size: fileBuffer.length,
      type: fileType,
      contentType,
      isTemplate,
      templateType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return file;
  } catch (error: any) {
    console.error('Error saving file:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

// Get files associated with a task
export async function getFilesByTaskId(taskId: number): Promise<FileModel[]> {
  return await storage.getFilesByTaskId(taskId);
}

// Associate a file with a task
export async function linkFileToTask(taskId: number, fileId: number): Promise<void> {
  await storage.linkFileToTask(taskId, fileId);
}

// Remove an association between a file and a task
export async function unlinkFileFromTask(taskId: number, fileId: number): Promise<boolean> {
  return await storage.unlinkFileFromTask(taskId, fileId);
}

// Delete a file from storage
export async function deleteFile(fileId: number): Promise<boolean> {
  try {
    // Get file information
    const file = await storage.getFile(fileId);
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    // Delete file from disk
    const filePath = path.join(UPLOADS_DIR, file.path);
    await fsPromises.unlink(filePath);

    // Delete file record from database
    return storage.deleteFile(fileId);
  } catch (error: any) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
