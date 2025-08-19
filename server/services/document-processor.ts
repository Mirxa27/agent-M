import * as pdfParse from 'pdf-parse';
import * as xlsx from 'xlsx';
import * as mammoth from 'mammoth';
import { Buffer } from 'buffer';

export interface DocumentContent {
  text: string;
  metadata?: {
    pages?: number;
    sheets?: string[];
    wordCount?: number;
    [key: string]: any;
  };
}

/**
 * Extract text content from PDF files
 */
export async function extractPdfContent(buffer: Buffer): Promise<DocumentContent> {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        info: data.info
      }
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error('Failed to extract PDF content');
  }
}

/**
 * Extract text content from Excel/Spreadsheet files
 */
export async function extractSpreadsheetContent(buffer: Buffer): Promise<DocumentContent> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheets: string[] = [];
    let combinedText = '';

    workbook.SheetNames.forEach(sheetName => {
      sheets.push(sheetName);
      const worksheet = workbook.Sheets[sheetName];
      const csvContent = xlsx.utils.sheet_to_csv(worksheet);
      combinedText += `\n--- Sheet: ${sheetName} ---\n${csvContent}\n`;
    });

    return {
      text: combinedText.trim(),
      metadata: {
        sheets,
        wordCount: combinedText.split(/\s+/).length
      }
    };
  } catch (error) {
    console.error('Error extracting spreadsheet content:', error);
    throw new Error('Failed to extract spreadsheet content');
  }
}

/**
 * Extract text content from Word documents
 */
export async function extractWordContent(buffer: Buffer): Promise<DocumentContent> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        warnings: result.messages.filter(m => m.type === 'warning').map(m => m.message)
      }
    };
  } catch (error) {
    console.error('Error extracting Word content:', error);
    throw new Error('Failed to extract Word document content');
  }
}

/**
 * Extract text content from PowerPoint presentations
 */
export async function extractPowerPointContent(buffer: Buffer): Promise<DocumentContent> {
  try {
    // For PowerPoint, we'll use a simple XML parsing approach
    // as pptx2json has compatibility issues
    const content = buffer.toString('utf8');
    
    // Extract text from XML content
    const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
    const extractedText = textMatches
      .map(match => match.replace(/<[^>]*>/g, ''))
      .filter(text => text.trim().length > 0)
      .join('\n');

    // Also look for slide titles and content
    const titleMatches = content.match(/<p:cSld[^>]*>[\s\S]*?<\/p:cSld>/g) || [];
    
    return {
      text: extractedText || '[PowerPoint content - limited text extraction available]',
      metadata: {
        slides: titleMatches.length,
        wordCount: extractedText.split(/\s+/).length
      }
    };
  } catch (error) {
    console.error('Error extracting PowerPoint content:', error);
    // Fallback for binary PowerPoint files
    return {
      text: '[PowerPoint presentation - text extraction not available for this format]',
      metadata: {
        slides: 0,
        wordCount: 0
      }
    };
  }
}

/**
 * Main document processor function
 */
export async function processDocument(buffer: Buffer, contentType: string): Promise<DocumentContent> {
  try {
    // PDF files
    if (contentType === 'application/pdf') {
      return await extractPdfContent(buffer);
    }
    
    // Excel and spreadsheet files
    if (
      contentType.includes('spreadsheet') ||
      contentType.includes('excel') ||
      contentType === 'application/vnd.ms-excel' ||
      contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return await extractSpreadsheetContent(buffer);
    }
    
    // Word documents
    if (
      contentType.includes('document') ||
      contentType.includes('word') ||
      contentType === 'application/msword' ||
      contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractWordContent(buffer);
    }
    
    // PowerPoint presentations
    if (
      contentType.includes('presentation') ||
      contentType.includes('powerpoint') ||
      contentType === 'application/vnd.ms-powerpoint' ||
      contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      return await extractPowerPointContent(buffer);
    }
    
    // Unsupported document type
    throw new Error(`Unsupported document type: ${contentType}`);
    
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Check if a content type is supported for document processing
 */
export function isSupportedDocumentType(contentType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  return supportedTypes.some(type => contentType.includes(type)) ||
         contentType.includes('spreadsheet') ||
         contentType.includes('document') ||
         contentType.includes('presentation');
}
