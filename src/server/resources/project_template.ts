import { Resource } from './base.js';

const WEB_API_URL = process.env.WEB_API_URL || 'http://localhost:3000';

export class ProjectTemplateResource implements Resource {
  public readonly uri = 'wynd://project-templates';
  public readonly name = 'project-templates';
  public readonly description = 'Project template management resource';
  public isPublic = false;

  // List all templates
  async list(ctx: any) {
    const res = await fetch(`${WEB_API_URL}/api/project-templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    const data = await res.json();
    return { data };
  }

  // Create a new template
  async create(ctx: any) {
    const res = await fetch(`${WEB_API_URL}/api/project-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx.body),
    });
    if (!res.ok) throw new Error('Failed to create template');
    const data = await res.json();
    return { data };
  }

  // Get a template by ID
  async get(ctx: any) {
    const { id } = ctx.params;
    const res = await fetch(`${WEB_API_URL}/api/project-templates/${id}`);
    if (!res.ok) throw new Error('Template not found');
    const data = await res.json();
    return { data };
  }

  // Update a template by ID
  async update(ctx: any) {
    const { id } = ctx.params;
    const res = await fetch(`${WEB_API_URL}/api/project-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx.body),
    });
    if (!res.ok) throw new Error('Failed to update template');
    const data = await res.json();
    return { data };
  }

  // Delete a template by ID
  async delete(ctx: any) {
    const { id } = ctx.params;
    const res = await fetch(`${WEB_API_URL}/api/project-templates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete template');
    return { success: true };
  }
} 