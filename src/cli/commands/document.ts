import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../../api/endpoints/index.js';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, ListResponse } from '../../api/types/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * List all documents
 */
const listDocuments = async (options: any) => {
  try {
    const { projectId, ...params } = options;
    const response = await api.documents.list({
      project_id: projectId,
      ...params
    });
    
    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }
    
    if (!response.data || response.data.length === 0) {
      console.log('No documents found');
      return;
    }
    
    console.log(chalk.bold('\nDocuments:'));
    console.log('─'.repeat(100));
    
    response.data.forEach((doc: Document) => {
      const title = doc.title || `Untitled (${doc.id.slice(0, 8)})`;
      const type = doc.type === 'markdown' ? '📝' : '📄';
      
      console.log(`${type} ${chalk.bold(title)} ${chalk.dim(doc.id)}`);
      
      if (doc.description) {
        console.log(`  ${chalk.dim(doc.description)}`);
      }
      
      const metadata = [
        `Project: ${doc.project_id}`,
        `Type: ${doc.type}`,
        `Created: ${new Date(doc.created_at).toLocaleDateString()}`
      ];
      
      console.log(`  ${metadata.join(' • ')}`);
      console.log('─'.repeat(100));
    });
    
  } catch (error) {
    logger.error('Failed to list documents:', error);
    process.exit(1);
  }
};

/**
 * Get document details
 */
const getDocument = async (idOrName: string, options: any) => {
  try {
    const document = await api.documents.get(idOrName);
    
    if (options.json) {
      console.log(JSON.stringify(document, null, 2));
      return;
    }
    
    if (!document) {
      console.log('Document not found');
      return;
    }
    
    const title = document.title || `Untitled (${document.id.slice(0, 8)})`;
    
    console.log(chalk.bold(`\n${title}`));
    console.log('─'.repeat(80));
    console.log(`ID:          ${document.id}`);
    console.log(`Project:     ${document.project_id}`);
    console.log(`Type:        ${document.type}`);
    console.log(`Created:     ${new Date(document.created_at).toLocaleString()}`);
    
    if (document.updated_at) {
      console.log(`Updated:     ${new Date(document.updated_at).toLocaleString()}`);
    }
    
    if (document.description) {
      console.log(`\n${document.description}\n`);
    }
    
    // Display metadata if available
    if (document.metadata && Object.keys(document.metadata).length > 0) {
      console.log(chalk.bold('\nMetadata:'));
      for (const [key, value] of Object.entries(document.metadata)) {
        console.log(`  ${chalk.dim(key)}: ${value}`);
      }
    }
    
    // Display content preview
    if (document.content) {
      console.log(chalk.bold('\nContent Preview:'));
      console.log('─'.repeat(80));
      console.log(truncate(document.content, 500));
      console.log('─'.repeat(80));
    }
    
  } catch (error) {
    logger.error(`Failed to get document ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Create a new document
 */
const createDocument = async (options: any): Promise<void> => {
  try {
    // Determine project ID
    let projectId = options.project;
    if (!projectId && config.project.defaultProjectId) {
      projectId = config.project.defaultProjectId;
      logger.debug(`Using default project: ${projectId}`);
    }
    
    if (!projectId) {
      throw new Error('Project ID is required. Use --project <id> or set a default project.');
    }
    
    // Read content from file if provided
    let content = options.content || '';
    
    if (options.file) {
      const filePath = path.resolve(process.cwd(), options.file);
      content = fs.readFileSync(filePath, 'utf8');
    }
    
    if (!content && !options.allowEmpty) {
      throw new Error('Document content is required. Use --content <text> or --file <path>.');
    }
    
    const documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'> = {
      title: options.title,
      description: options.description,
      content,
      project_id: projectId,
      type: options.type || 'other',
      metadata: undefined,
      content_type: 'text/plain',
      size: content.length
    };
    
    // Add metadata if provided
    if (options.metadata) {
      try {
        documentData.metadata = JSON.parse(options.metadata);
      } catch (e) {
        throw new Error('Invalid metadata format. Must be a valid JSON string.');
      }
    }
    
    // Create the document
    await api.documents.create(documentData);
    
    if (options.json) {
      // For JSON output, we'll just log a success message
      console.log(JSON.stringify({ 
        success: true, 
        message: 'Document created successfully',
        data: {
          title: documentData.title,
          type: documentData.type,
          size: documentData.size
        }
      }, null, 2));
    } else {
      console.log(chalk.green('\n✅ Document created successfully!'));
      console.log(chalk.blue('\nDocument created with the following details:'));
      console.log(`  Title: ${documentData.title}`);
      console.log(`  Type: ${documentData.type || 'other'}`);
      console.log(`  Size: ${documentData.size || content.length} bytes`);
      
      // Display description if provided
      if (documentData.description) {
        console.log(`\n${documentData.description}\n`);
      }
      
      // Display metadata if available
      if (documentData.metadata && Object.keys(documentData.metadata).length > 0) {
        console.log(chalk.bold('\nMetadata:'));
        for (const [key, value] of Object.entries(documentData.metadata)) {
          console.log(`  ${chalk.dim(key)}: ${value}`);
        }
      }
    }
    
    // No explicit return needed as the function is declared to return void
    
  } catch (error) {
    logger.error('Failed to create document:', error);
    process.exit(1);
  }
};

/**
 * Update a document
 */
const updateDocument = async (idOrName: string, updates: any, options: any): Promise<void> => {
  try {
    const updateData: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>> = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.type) updateData.type = updates.type;
    
    // Handle content update
    if (updates.content) {
      updateData.content = updates.content;
      updateData.size = updates.content.length;
    } else if (updates.file) {
      const filePath = path.resolve(process.cwd(), updates.file);
      const content = fs.readFileSync(filePath, 'utf8');
      updateData.content = content;
      updateData.size = content.length;
    }
    
    // Handle metadata update
    if (updates.metadata) {
      try {
        updateData.metadata = JSON.parse(updates.metadata);
      } catch (e) {
        throw new Error('Invalid metadata format. Must be a valid JSON string.');
      }
    }
    
    await api.documents.update(idOrName, updateData);
    
    if (!options.json) {
      console.log(chalk.green('\n✅ Document updated successfully!'));
    }
    
    if (options.json) {
      console.log(JSON.stringify({ 
        success: true, 
        message: 'Document updated successfully',
        data: updateData
      }, null, 2));
    } else {
      console.log(chalk.green(`\n✅ Document updated successfully!`));
      console.log(chalk.blue('\nDocument updated with the following changes:'));
      
      if (updates.title) console.log(`  Title: ${updates.title}`);
      if (updates.type) console.log(`  Type: ${updates.type}`);
      if (updates.content || updates.file) {
        const size = updates.content ? updates.content.length : 
                    (updateData.size ? updateData.size : 'unknown');
        console.log(`  Size: ${size} bytes`);
      }
    }
    
  } catch (error) {
    logger.error(`Failed to update document ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Delete a document
 */
const deleteDocument = async (idOrName: string, options: any): Promise<void> => {
  try {
    if (!options.force) {
      const document = await api.documents.get(idOrName);
      const title = document.title || `Document ${document.id.slice(0, 8)}`;
      
      console.log(chalk.yellow(`\n⚠️  You are about to delete the following document:`));
      console.log(`Title: ${chalk.bold(title)}`);
      console.log(`ID: ${document.id}`);
      console.log(chalk.yellow('\nThis action cannot be undone.'));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>(resolve => {
        readline.question('\nAre you sure you want to continue? (y/N) ', resolve);
      });
      
      readline.close();
      
      if (answer && answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled');
        return;
      }
    }
    
    await api.documents.delete(idOrName);
    
    if (!options.json) {
      console.log(chalk.green('\n✅ Document deleted successfully!'));
    }
    
  } catch (error) {
    logger.error(`Failed to delete document ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Download a document to a file
 */
const downloadDocument = async (idOrName: string, options: any) => {
  try {
    const document = await api.documents.get(idOrName);
    
    if (!document.content) {
      throw new Error('Document has no content to download');
    }
    
    let outputPath = options.output;
    
    // Generate a default filename if not provided
    if (!outputPath) {
      const ext = document.type === 'markdown' ? '.md' : '.txt';
      const title = document.title ? document.title.replace(/[^\w\d-]/g, '_') : 'document';
      outputPath = `${title}${ext}`;
    }
    
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, document.content);
    
    if (!options.json) {
      console.log(chalk.green(`\n✅ Document downloaded successfully to: ${outputPath}`));
      console.log(`Size: ${document.content.length} bytes`);
    } else {
      console.log(JSON.stringify({
        success: true,
        path: outputPath,
        size: document.content.length,
        document: {
          id: document.id,
          title: document.title,
          type: document.type
        }
      }, null, 2));
    }
    
  } catch (error) {
    logger.error(`Failed to download document ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to truncate text with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Get content type from file extension
 */
function getContentType(ext: string): string | undefined {
  const types: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  
  return types[ext.toLowerCase()];
}

/**
 * Get file extension from content type
 */
function getExtension(contentType: string): string | undefined {
  const extensions: Record<string, string> = {
    'text/plain': '.txt',
    'text/markdown': '.md',
    'text/html': '.html',
    'text/css': '.css',
    'application/javascript': '.js',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };
  
  return extensions[contentType.toLowerCase()];
}

/**
 * Register document commands
 */
export const registerDocumentCommands = (program: Command) => {
  // Document command group
  const docCommand = program.command('document')
    .description('Document management commands')
    .alias('doc');
  
  // List documents command
  docCommand.command('list')
    .description('List all documents')
    .option('-p, --project <projectId>', 'Filter by project ID')
    .option('--type <type>', 'Filter by content type')
    .option('--search <query>', 'Search in document content')
    .option('--limit <number>', 'Limit the number of results', '20')
    .option('--json', 'Output as JSON', false)
    .action(listDocuments);
  
  // Get document command
  docCommand.command('get <id|name>')
    .description('Get document details')
    .option('--json', 'Output as JSON', false)
    .action(getDocument);
  
  // Create document command
  docCommand.command('create')
    .description('Create a new document')
    .requiredOption('-t, --title <title>', 'Document title')
    .option('-d, --description <description>', 'Document description')
    .option('-c, --content <content>', 'Document content')
    .option('-f, --file <path>', 'Path to a file to upload as document content')
    .option('--type <type>', 'Document type (readme, api, guide, spec, other)', 'other')
    .option('-p, --project <projectId>', 'Project ID (defaults to default project)')
    .option('--metadata <json>', 'Document metadata as JSON string')
    .option('--allow-empty', 'Allow creating an empty document', false)
    .option('--json', 'Output as JSON', false)
    .action((options) => createDocument(options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Update document command
  docCommand.command('update <id|name>')
    .description('Update a document')
    .option('-t, --title <title>', 'New document title')
    .option('-d, --description <description>', 'New document description')
    .option('-c, --content <content>', 'New document content')
    .option('-f, --file <path>', 'Path to a file to update document content')
    .option('--type <type>', 'New document type (readme, api, guide, spec, other)')
    .option('--metadata <json>', 'New document metadata as JSON string')
    .option('--json', 'Output as JSON', false)
    .action((idOrName, updates, options) => updateDocument(idOrName, updates, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Delete document command
  docCommand.command('delete <id|name>')
    .description('Delete a document')
    .option('-f, --force', 'Skip confirmation', false)
    .option('--json', 'Output as JSON', false)
    .action(deleteDocument);
  
  // Download document command
  docCommand.command('download <id|name>')
    .description('Download document content to a file')
    .option('-o, --output <path>', 'Output file path')
    .option('--json', 'Output as JSON', false)
    .action(downloadDocument);
  
  // Alias for backward compatibility
  program.command('documents')
    .description('List all documents (alias for document:list)')
    .option('-p, --project <projectId>', 'Filter by project ID')
    .option('--type <type>', 'Filter by content type')
    .option('--search <query>', 'Search in document content')
    .option('--limit <number>', 'Limit the number of results', '20')
    .option('--json', 'Output as JSON', false)
    .action(listDocuments);
};

export default registerDocumentCommands;
