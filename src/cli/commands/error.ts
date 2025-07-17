import { Command } from 'commander';
import chalk from 'chalk';
import { api } from '../../api/endpoints/index.js';
import logger from '../../utils/logger.js';
import { ErrorLog } from '../../api/types/index.js';

/**
 * List all errors
 */
const listErrors = async (options: any) => {
  try {
    const { projectId, ...params } = options;
    const errors = await api.errors.list({
      project_id: projectId,
      ...params
    });
    
    if (options.json) {
      console.log(JSON.stringify(errors, null, 2));
      return;
    }
    
    if (!errors || errors.data.length === 0) {
      console.log('No errors found');
      return;
    }
    
    console.log(chalk.bold('\nErrors:'));
    console.log('─'.repeat(120));
    
    for (const err of errors.data) {
      const timestamp = new Date(err.created_at).toLocaleString();
      const status = getStatusBadge(err.status);
      const type = chalk.dim(`[${err.error_type || 'error'}]`);
      
      console.log(`${status} ${chalk.bold(err.error_message || 'Unknown error')} ${type}`);
      console.log(`  ${chalk.dim(`ID: ${err.id} • Project: ${err.project_id || 'N/A'} • ${timestamp}`)}`);
      
      if (err.metadata) {
        console.log(`  ${chalk.yellow(truncate(JSON.stringify(err.metadata), 120))}`);
      }
      
      console.log('─'.repeat(120));
    }
    
  } catch (error) {
    logger.error('Failed to list errors:', error);
    process.exit(1);
  }
};

/**
 * Get error details
 */
const getError = async (id: string, options: any) => {
  try {
    const error: ErrorLog = await api.errors.get(id);
    
    if (options.json) {
      console.log(JSON.stringify(error, null, 2));
      return;
    }
    
    // Format and display the error
    const status = getStatusBadge(error.status);
    const timestamp = new Date(error.created_at).toLocaleString();
    
    console.log(chalk.bold(`\n${status} ${error.error_message || 'Unknown error'}`));
    console.log(chalk.dim(`ID: ${error.id} • Project: ${error.project_id || 'N/A'} • ${timestamp}`));
    console.log(`Type:       ${error.error_type || 'error'}`);
    
    if (error.metadata) {
      console.log('\nMetadata:');
      console.log(formatErrorDetails(error.metadata));
    }
    
    if (error.stack_trace) {
      console.log('\nStack Trace:');
      console.log(error.stack_trace);
    }
    
    if (error.metadata && Object.keys(error.metadata).length > 0) {
      console.log(`\n${chalk.bold('Metadata:')}\n`);
      for (const [key, value] of Object.entries(error.metadata)) {
        console.log(`  ${chalk.dim(key)}:`, value);
      }
    }
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    logger.error(`Failed to get error ${id}:`, error);
    process.exit(1);
  }
};

/**
 * Clear errors
 */
const clearErrors = async (options: any) => {
  try {
    if (!options.force) {
      console.log(chalk.yellow('\n⚠️  You are about to clear all errors. This action cannot be undone.'));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>(resolve => {
        readline.question('\nAre you sure you want to clear all errors? (y/N) ', resolve);
      });
      
      readline.close();
      
      if (answer && answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled');
        return;
      }
    }
    
    // List errors matching the criteria
    const errors = await api.errors.list({
      project_id: options.project,
      before: options.before,
      status: options.status
    });
    
    // Delete each error individually
    const deletePromises = errors.data.map(error => api.errors.delete(error.id));
    await Promise.all(deletePromises);
    
    const deletedCount = errors.data.length;
    
    if (options.json) {
      console.log(JSON.stringify({ deleted_count: deletedCount }, null, 2));
    } else {
      console.log(chalk.green(`\n✅ Cleared ${deletedCount} errors`));
    }
    
  } catch (error) {
    logger.error('Failed to clear errors:', error);
    process.exit(1);
  }
};

/**
 * Helper function to get a status badge
 */
function getStatusBadge(status: string): string {
  const statusMap: Record<string, string> = {
    'open': chalk.bgRed.white(' OPEN '),
    'investigating': chalk.bgYellow.black(' INVESTIGATING '),
    'resolved': chalk.bgGreen.black(' RESOLVED '),
    'ignored': chalk.bgGray.black(' IGNORED '),
  };
  
  return statusMap[status.toLowerCase()] || chalk.bgGray.black(` ${status.toUpperCase()} `);
}

/**
 * Helper function to format error details
 */
function formatErrorDetails(details: any): string {
  if (typeof details === 'string') {
    return details;
  }
  
  if (details instanceof Error) {
    return details.stack || details.message || String(details);
  }
  
  if (typeof details === 'object') {
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return String(details);
    }
  }
  
  return String(details);
}

/**
 * Helper function to truncate text with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Register error commands
 */
export const registerErrorCommands = (program: Command) => {
  // Error command group
  const errorCommand = program.command('error')
    .description('Error tracking commands')
    .alias('err');
  
  // List errors command
  errorCommand.command('list')
    .description('List all errors')
    .option('--project <id>', 'Filter errors by project ID')
    .option('--status <status>', 'Filter by status (open, investigating, resolved, ignored)')
    .option('--limit <number>', 'Limit the number of results', '50')
    .option('--offset <number>', 'Offset for pagination', '0')
    .option('--json', 'Output as JSON', false)
    .action((options) => listErrors(options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Get error command
  errorCommand.command('show <id>')
    .description('Show details of a specific error')
    .option('--json', 'Output as JSON', false)
    .action((id, options) => getError(id, options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Clear errors command
  errorCommand.command('clear')
    .description('Clear all errors (use with caution)')
    .option('--project <id>', 'Clear errors for a specific project')
    .option('--before <date>', 'Clear errors before a specific date (ISO format)')
    .option('--status <status>', 'Clear errors with a specific status (open, investigating, resolved, ignored)')
    .option('--force', 'Skip confirmation prompt', false)
    .action((options) => clearErrors(options).catch((err) => {
      logger.error(err);
      process.exit(1);
    }));
  
  // Alias for backward compatibility
  program.command('errors')
    .description('List all errors (alias for error:list)')
    .option('--project <id>', 'Filter errors by project ID')
    .option('--status <status>', 'Filter by status (open, investigating, resolved, ignored)')
    .option('--type <type>', 'Filter by error type')
    .option('--search <query>', 'Search in error messages and details')
    .option('--limit <number>', 'Limit the number of results', '20')
    .option('--json', 'Output as JSON', false)
    .action(listErrors);
};

export default registerErrorCommands;
