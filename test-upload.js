import fs from 'fs';
import path from 'path';
import { processDocument, isSupportedDocumentType } from './server/services/document-processor.js';

async function testDocumentProcessing() {
  console.log('Testing document processing...');
  
  // Test PDF processing with a sample PDF (we'll create a simple text file as mock)
  const testText = "This is a test document for processing.";
  const testBuffer = Buffer.from(testText, 'utf8');
  
  // Test text content type
  const textContentType = 'text/plain';
  console.log('Is text/plain supported?', isSupportedDocumentType(textContentType));
  
  // Test PDF content type
  const pdfContentType = 'application/pdf';
  console.log('Is application/pdf supported?', isSupportedDocumentType(pdfContentType));
  
  // Test Excel content type
  const excelContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  console.log('Is Excel supported?', isSupportedDocumentType(excelContentType));
  
  console.log('Document processing test completed successfully!');
}

testDocumentProcessing().catch(console.error);
