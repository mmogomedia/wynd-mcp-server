import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../../api/endpoints/index.js';
import logger from '../../utils/logger.js';
import { Workspace } from '../../api/types/index.js';

/**
 * List all workspaces
 */
const listWorkspaces = async (options: any) => {
  try {
    const workspaces = await api.workspaces.list();
    
    if (options.json) {
      console.log(JSON.stringify(workspaces, null, 2));
      return;
    }
    
    if (!workspaces || workspaces.data.length === 0) {
      console.log('No workspaces found');
      return;
    }
    
    console.log(chalk.bold('\nWorkspaces:'));
    console.log('─'.repeat(80));
    
    workspaces.data.forEach((workspace: Workspace) => {
      console.log(`${chalk.bold(workspace.name)} ${chalk.dim(workspace.id)}`);
      
      if (workspace.description) {
        console.log(`  ${chalk.dim(workspace.description)}`);
      }
      
      console.log(`  Projects: ${workspace.project_count || 0}`);
      console.log(`  Created:  ${new Date(workspace.created_at).toLocaleString()}`);
      
      if (workspace.updated_at) {
        console.log(`  Updated:  ${new Date(workspace.updated_at).toLocaleString()}`);
      }
      
      console.log('─'.repeat(80));
    });
    
  } catch (error) {
    logger.error('Failed to list workspaces:', error);
    process.exit(1);
  }
};

/**
 * Get workspace details
 */
const getWorkspace = async (idOrName: string, options: any) => {
  try {
    const workspace = await api.workspaces.get(idOrName);
    
    if (options.json) {
      console.log(JSON.stringify(workspace, null, 2));
      return;
    }
    
    if (!workspace) {
      console.log('Workspace not found');
      return;
    }
    
    console.log(chalk.bold(`\n${workspace.name}`));
    console.log('─'.repeat(80));
    console.log(`ID:          ${workspace.id}`);
    
    if (workspace.description) {
      console.log(`\n${workspace.description}\n`);
    }
    
    console.log(`Projects:    ${workspace.project_count || 0}`);
    console.log(`Created:     ${new Date(workspace.created_at).toLocaleString()}`);
    
    if (workspace.updated_at) {
      console.log(`Updated:     ${new Date(workspace.updated_at).toLocaleString()}`);
    }
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    logger.error(`Failed to get workspace ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Create a new workspace
 */
const createWorkspace = async (name: string, options: any): Promise<void> => {
  try {
    const workspaceData = {
      name,
      description: options.description || null,
      slug: options.slug || name.toLowerCase().replace(/\s+/g, '-'),
      owner_id: 'current-user-id', // This should be set by the API or auth middleware
      settings: {
        theme: 'light',
        timezone: 'UTC',
        locale: 'en-US',
        features: {}
      }
    };
    
    const workspace = await api.workspaces.create(workspaceData);
    
    if (options.json) {
      console.log(JSON.stringify(workspace, null, 2));
      return;
    }
    
    console.log(chalk.green('\n✅ Workspace created successfully!'));
    console.log(`ID:          ${workspace.id}`);
    console.log(`Name:        ${workspace.name}`);
    console.log(`Slug:        ${workspace.slug}`);
    
    if (workspace.description) {
      console.log(`Description: ${workspace.description}`);
    }
    
  } catch (error) {
    logger.error('Failed to create workspace:', error);
    process.exit(1);
  }
};

/**
 * Update a workspace
 */
const updateWorkspace = async (idOrName: string, updates: any, options: any): Promise<void> => {
  try {
    const updateData: Partial<Workspace> = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.slug) updateData.slug = updates.slug;
    
    const workspace = await api.workspaces.update(idOrName, updateData);
    
    if (options.json) {
      console.log(JSON.stringify(workspace, null, 2));
      return;
    }
    
    console.log(chalk.green('\n✅ Workspace updated successfully!'));
    console.log(`ID: ${chalk.bold(workspace.id)}`);
    console.log(`Name: ${chalk.bold(workspace.name)}`);
    
  } catch (error) {
    logger.error(`Failed to update workspace ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Delete a workspace
 */
const deleteWorkspace = async (idOrName: string, options: any) => {
  try {
    if (!options.force) {
      const workspace = await api.workspaces.get(idOrName);
      console.log(chalk.yellow(`\n⚠️  You are about to delete the following workspace:`));
      console.log(`Name: ${chalk.bold(workspace.name)}`);
      console.log(`ID: ${workspace.id}`);
      console.log(chalk.yellow('\nThis action cannot be undone and will delete all projects in this workspace.'));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>(resolve => {
        readline.question('\nAre you sure you want to continue? (y/N) ', (input: string) => {
          resolve(input);
        });
      });
      
      readline.close();
      
      if (answer && answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled');
        return;
      }
    }
    
    await api.workspaces.delete(idOrName);
    
    if (!options.json) {
      console.log(chalk.green('\n✅ Workspace deleted successfully!'));
    }
    
  } catch (error) {
    logger.error(`Failed to delete workspace ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Register workspace commands
 */
export const registerWorkspaceCommands = (program: Command) => {
  // Workspace command group
  const workspaceCommand = program.command('workspace')
    .description('Workspace management commands')
    .alias('ws');
  
  // List workspaces command
  workspaceCommand.command('list')
    .description('List all workspaces')
    .option('--json', 'Output as JSON', false)
    .action((options) => listWorkspaces(options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Get workspace command
  workspaceCommand.command('get <id|name>')
    .description('Get workspace details')
    .option('--json', 'Output as JSON', false)
    .action(getWorkspace);
  
  // Create workspace command
  workspaceCommand.command('create <name>')
    .description('Create a new workspace')
    .option('--description <description>', 'Workspace description')
    .option('--slug <slug>', 'Workspace slug (auto-generated from name if not provided)')
    .option('--json', 'Output as JSON', false)
    .action((name, options) => createWorkspace(name, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Update workspace command
  workspaceCommand.command('update <id|name>')
    .description('Update a workspace')
    .option('--name <name>', 'New workspace name')
    .option('--description <description>', 'New workspace description')
    .option('--slug <slug>', 'New workspace slug')
    .option('--json', 'Output as JSON', false)
    .action((idOrName, updates, options) => updateWorkspace(idOrName, updates, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Delete workspace command
  workspaceCommand.command('delete <id|name>')
    .description('Delete a workspace')
    .option('--force', 'Skip confirmation', false)
    .option('--json', 'Output as JSON', false)
    .action((idOrName, options) => deleteWorkspace(idOrName, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Alias for backward compatibility
  program.command('workspaces')
    .description('List all workspaces (alias for workspace:list)')
    .option('--json', 'Output as JSON', false)
    .action(listWorkspaces);
};

export default registerWorkspaceCommands;
