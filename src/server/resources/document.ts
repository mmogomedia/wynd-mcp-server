import { Resource } from '@modelcontextprotocol/sdk';
import { api } from '../../api/endpoints/index.js';
import { Document, ListParams } from '../../api/types/index.js';

/**
 * Document resource handler for the MCP server
 */
export class DocumentResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://documents';
  public readonly name = 'documents';
  public readonly description = 'Document management resource';
  
  // Documents are private by default (require authentication)
  public isPublic = false;
  async list(params?: ListParams): Promise<Document[]> {
    try {
      const response = await api.documents.list(params);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Document | null> {
    try {
      // Extract document ID from URI (e.g., 'wynd://documents/123' -> '123')
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid document URI: ${uri}`);
      }
      return await api.documents.get(id);
    } catch (error) {
      console.error(`Error fetching document with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Document> {
    try {
      // Required fields validation
      if (!data.title) {
        throw new Error('Document title is required');
      }
      if (!data.content) {
        throw new Error('Document content is required');
      }
      if (!data.project_id) {
        throw new Error('Project ID is required for document creation');
      }
      
      // Prepare document data
      const documentData = {
        title: data.title,
        content: data.content,
        project_id: data.project_id,
        type: data.type || 'other',
        metadata: data.metadata || {},
      };
      
      // Call the API to create the document
      return await api.documents.create(documentData);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Document>): Promise<Document | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid document URI: ${uri}`);
      }
      
      // Get the existing document
      const existing = await this.read(uri);
      if (!existing) {
        throw new Error(`Document with URI ${uri} not found`);
      }
      
      // Only allow certain fields to be updated
      const allowedUpdates: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> = {
        title: data.title,
        content: data.content,
        type: data.type,
        metadata: data.metadata,
        project_id: data.project_id,
      };
      
      // Call the API to update the document
      return await api.documents.update(id, allowedUpdates);
    } catch (error) {
      console.error(`Error updating document with URI ${uri}:`, error);
      throw error;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid document URI: ${uri}`);
      }
      
      // Call the API to delete the document
      await api.documents.delete(id);
    } catch (error) {
      console.error(`Error deleting document with URI ${uri}:`, error);
      throw error;
    }
  }

  // Additional document-specific methods
  async search(query: string, projectId?: string): Promise<Document[]> {
    try {
      const params: any = { q: query };
      if (projectId) {
        params.project_id = projectId;
      }
      const response = await api.documents.list(params);
      return response?.data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  async getByType(type: string, projectId?: string): Promise<Document[]> {
    try {
      const params: any = { type };
      if (projectId) {
        params.project_id = projectId;
      }
      const response = await api.documents.list(params);
      return response?.data || [];
    } catch (error) {
      console.error(`Error fetching documents of type ${type}:`, error);
      return [];
    }
  }
}
