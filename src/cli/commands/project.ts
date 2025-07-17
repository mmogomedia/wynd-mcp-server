import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../../api/endpoints/index.js';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { Project } from '../../api/types/index.js';

/**
 * List all projects
 */
const listProjects = async (options: any) => {
  try {
    const projects = await api.projects.list();
    
    if (options.json) {
      console.log(JSON.stringify(projects, null, 2));
      return;
    }
    
    if (!projects || projects.data.length === 0) {
      console.log('No projects found');
      return;
    }
    
    console.log(chalk.bold('\nProjects:'));
    console.log('─'.repeat(80));
    
    projects.data.forEach((project: Project) => {
      const isDefault = project.id === config.project.defaultProjectId;
      const status = project.status ? `[${project.status}]` : '';
      const defaultIndicator = isDefault ? chalk.green(' (default)') : '';
      
      console.log(
        `${chalk.bold(project.title)} ${chalk.dim(project.id)}${defaultIndicator}`
      );
      
      if (project.description) {
        console.log(`  ${chalk.dim(project.description)}`);
      }
      
      console.log(`  Workspace: ${project.workspace_id || 'N/A'} ${status}`);
      console.log('─'.repeat(80));
    });
    
  } catch (error) {
    logger.error('Failed to list projects:', error);
    process.exit(1);
  }
};

/**
 * Get project details
 */
const getProject = async (idOrName: string, options: any) => {
  try {
    // Handle 'default' keyword
    const projectId = idOrName === 'default' && config.project.defaultProjectId 
      ? config.project.defaultProjectId 
      : idOrName;
    
    const project = await api.projects.get(projectId);
    
    if (options.json) {
      console.log(JSON.stringify(project, null, 2));
      return;
    }
    
    if (!project) {
      console.log('Project not found');
      return;
    }
    
    console.log(chalk.bold(`\n${project.title}`));
    console.log('─'.repeat(80));
    console.log(`ID:          ${project.id}`);
    console.log(`Workspace:   ${project.workspace_id}`);
    
    if (project.description) {
      console.log(`\n${project.description}\n`);
    }
    
    console.log(`Status:      ${project.status || 'active'}`);
    console.log(`Created:     ${new Date(project.created_at).toLocaleString()}`);
    
    if (project.updated_at) {
      console.log(`Updated:     ${new Date(project.updated_at).toLocaleString()}`);
    }
    
    if (project.id === config.project.defaultProjectId) {
      console.log('\n' + chalk.green('This is your default project'));
    }
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    logger.error(`Failed to get project ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Create a new project
 */
const createProject = async (title: string, options: any): Promise<void> => {
  try {
    const projectData = {
      title,
      description: options.description || null,
      status: options.status || 'active',
      workspace_id: options.workspace || null,
      owner_id: 'current-user-id' // This should be set by the API or auth middleware
    };
    
    const project = await api.projects.create(projectData);
    
    if (options.json) {
      console.log(JSON.stringify(project, null, 2));
      return;
    }
    
    console.log(chalk.green('\n✅ Project created successfully!'));
    console.log(`ID:          ${project.id}`);
    console.log(`Title:       ${project.title}`);
    console.log(`Status:      ${project.status}`);
    console.log(`Workspace:   ${project.workspace_id || 'N/A'}`);
    
    if (project.description) {
      console.log(`Description: ${project.description}`);
    }
    console.log(`Status:      ${project.status || 'active'}`);
    console.log(`Created:     ${new Date(project.created_at).toLocaleString()}`);
    
    if (project.updated_at) {
      console.log(`Updated:     ${new Date(project.updated_at).toLocaleString()}`);
    }
    
  } catch (error) {
    logger.error('Failed to create project:', error);
    process.exit(1);
  }
};

/**
 * Update a project
 */
const updateProject = async (idOrName: string, updates: any, options: any): Promise<void> => {
  try {
    // Handle 'default' keyword
    const projectId = idOrName === 'default' && config.project.defaultProjectId 
      ? config.project.defaultProjectId 
      : idOrName;
    
    const updateData: Partial<Project> = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.status) updateData.status = updates.status;
    if (updates.workspace !== undefined) updateData.workspace_id = updates.workspace || null;
    
    const project = await api.projects.update(projectId, updateData);
    
    if (options.json) {
      console.log(JSON.stringify(project, null, 2));
      return;
    }
    
    console.log(chalk.green('\n✅ Project updated successfully!'));
    console.log(`ID: ${chalk.bold(project.id)}`);
    console.log(`Title: ${chalk.bold(project.title)}`);
    
  } catch (error) {
    logger.error(`Failed to update project ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Delete a project
 */
const deleteProject = async (idOrName: string, options: any) => {
  try {
    // Handle 'default' keyword and prevent deletion of default project
    const projectId = idOrName === 'default' && config.project.defaultProjectId 
      ? config.project.defaultProjectId 
      : idOrName;
    
    if (projectId === config.project.defaultProjectId) {
      throw new Error('Cannot delete the default project. Please change the default project first.');
    }
    
    if (!options.force) {
      const project = await api.projects.get(projectId);
      console.log(chalk.yellow(`\n⚠️  You are about to delete the following project:`));
      console.log(`Title: ${chalk.bold(project.title)}`);
      console.log(`ID: ${project.id}`);
      console.log(chalk.yellow('\nThis action cannot be undone.'));
      
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
    
    await api.projects.delete(projectId);
    
    if (!options.json) {
      console.log(chalk.green('\n✅ Project deleted successfully!'));
    }
    
  } catch (error) {
    logger.error(`Failed to delete project ${idOrName}:`, error);
    process.exit(1);
  }
};

/**
 * Set default project
 */
const setDefaultProject = async (idOrName: string, options: any) => {
  try {
    const project = await api.projects.get(idOrName);
    
    if (!project) {
      throw new Error(`Project ${idOrName} not found`);
    }
    
    // Update .env file with new default project ID
    const fs = require('fs');
    const envPath = require('path').join(process.cwd(), '.env');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remove existing DEFAULT_PROJECT_ID if it exists
      envContent = envContent.replace(/^DEFAULT_PROJECT_ID=.*\n?/m, '');
    }
    
    // Add new DEFAULT_PROJECT_ID
    envContent += `\nDEFAULT_PROJECT_ID=${project.id}\n`;
    
    // Write back to .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    if (!options.json) {
      console.log(chalk.green(`\n✅ Default project set to: ${chalk.bold(project.title)} (${project.id})`));
      console.log('\nTo apply this change in your current shell, run:');
      console.log(chalk.cyan(`  source .env`));
    } else {
      console.log(JSON.stringify({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          isDefault: true
        }
      }, null, 2));
    }
    
  } catch (error) {
    logger.error(`Failed to set default project:`, error);
    process.exit(1);
  }
};

/**
 * Register project commands
 */
export const registerProjectCommands = (program: Command) => {
  // Project command group
  const projectCommand = program.command('project')
    .description('Project management commands')
    .alias('proj');
  
  // List projects command
  projectCommand.command('list')
    .description('List all projects')
    .option('--workspace <id>', 'Filter by workspace ID')
    .option('--status <status>', 'Filter by status (active, archived, completed)')
    .option('--json', 'Output as JSON', false)
    .action((options) => listProjects(options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Get project command
  projectCommand.command('get <id|name>')
    .description('Get project details (use "default" for default project)')
    .option('--json', 'Output as JSON', false)
    .action(getProject);
  
  // Create project command
  projectCommand.command('create <title>')
    .description('Create a new project')
    .option('--description <description>', 'Project description')
    .option('--status <status>', 'Project status (active, archived, completed)', 'active')
    .option('--workspace <id>', 'Workspace ID')
    .option('--json', 'Output as JSON', false)
    .action((title, options) => createProject(title, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Update project command
  projectCommand.command('update <id|name>')
    .description('Update a project (use "default" for default project)')
    .option('-t, --title <title>', 'New project title')
    .option('-d, --description <description>', 'New project description')
    .option('-s, --status <status>', 'New project status (active, archived, completed)')
    .option('-w, --workspace <workspaceId>', 'New workspace ID')
    .option('--json', 'Output as JSON', false)
    .action(updateProject);
  
  // Delete project command
  projectCommand.command('delete <id|name>')
    .description('Delete a project')
    .option('--force', 'Skip confirmation', false)
    .option('--json', 'Output as JSON', false)
    .action((idOrName, options) => deleteProject(idOrName, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Set default project command
  projectCommand.command('set-default <id|name>')
    .description('Set default project')
    .option('--json', 'Output as JSON', false)
    .action((idOrName, options) => setDefaultProject(idOrName, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Alias for backward compatibility
  program.command('projects')
    .description('List all projects (alias for project:list)')
    .option('--json', 'Output as JSON', false)
    .action(listProjects);
};

export default registerProjectCommands;
