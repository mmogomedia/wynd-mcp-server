#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// Initialize the main program
const program = new Command();

// Set up the program
program
  .name('wynd-mcp')
  .description('WYND Model Context Protocol (MCP) Server and CLI')
  .version(version, '-v, --version', 'output the current version')
  .showHelpAfterError('(add --help for additional information)')
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  });

// Global options
program
  .option('--debug', 'enable debug output', false)
  .option('--json', 'output in JSON format', false)
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    
    // Set log level based on debug flag
    if (options.debug) {
      logger.level = 'debug';
      logger.debug('Debug logging enabled');
    }
    
    // Log command being executed
    const command = thisCommand.name() || 'help';
    const args = thisCommand.args.join(' ');
    logger.debug(`Executing: ${command} ${args}`.trim());
  });

// Import and register commands
const loadCommands = async () => {
  // Server commands
  const { registerServerCommands } = await import('./commands/server.js');
  const { registerProjectCommands } = await import('./commands/project.js');
  const { registerWorkspaceCommands } = await import('./commands/workspace.js');
  const { registerDocumentCommands } = await import('./commands/document.js');
  const { registerErrorCommands } = await import('./commands/error.js');
  
  // Register all commands
  registerServerCommands(program);
  registerProjectCommands(program);
  registerWorkspaceCommands(program);
  registerDocumentCommands(program);
  registerErrorCommands(program);
};

// Main function
const main = async () => {
  try {
    // Load and register all commands
    await loadCommands();
    
    // Parse command line arguments
    await program.parseAsync(process.argv);
    
    // If no command is provided, show help
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    logger.error('An error occurred:', error);
    process.exit(1);
  }
};

// Run the CLI
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});

export default program;
