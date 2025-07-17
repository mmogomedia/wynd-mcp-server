import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { startServer } from '../../server/index.js';

// Server status tracking
let serverProcess: any = null;

/**
 * Start the MCP server
 */
const startServerCommand = async (options: any) => {
  try {
    logger.info('Starting WYND MCP server...');
    
    const { port, host, transport } = options;
    
    // Start the server with the specified transport
    serverProcess = await startServer({
      port: port || config.server.port,
      host: host || '0.0.0.0',
      transport: transport || 'http',
    });
    
    logger.info(`Server started on ${host || '0.0.0.0'}:${port || config.server.port} (${transport || 'http'})`);
    
    // Handle process termination
    const shutdown = async () => {
      if (serverProcess) {
        logger.info('Shutting down server...');
        await serverProcess.stop();
        process.exit(0);
      }
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Stop the MCP server
 */
const stopServerCommand = async () => {
  try {
    if (!serverProcess) {
      logger.warn('No server process is currently running');
      return;
    }
    
    logger.info('Stopping WYND MCP server...');
    await serverProcess.stop();
    serverProcess = null;
    logger.info('Server stopped successfully');
  } catch (error) {
    logger.error('Failed to stop server:', error);
    process.exit(1);
  }
};

/**
 * Get server status
 */
const statusCommand = () => {
  const status = serverProcess ? 'running' : 'stopped';
  const statusColor = serverProcess ? chalk.green : chalk.red;
  
  console.log(chalk.bold('WYND MCP Server Status'));
  console.log('Status:      ', statusColor(status));
  
  if (serverProcess) {
    console.log('PID:         ', process.pid);
    console.log('Version:     ', require('../../../package.json').version);
    console.log('Environment: ', config.env);
    console.log('Log Level:   ', config.server.logLevel);
  }
};

/**
 * Register server commands
 */
export const registerServerCommands = (program: Command) => {
  // Server command group
  const serverCommand = program.command('server')
    .description('Server management commands')
    .alias('srv');
  
  // Start server command
  serverCommand.command('start')
    .description('Start the MCP server')
    .option('-p, --port <port>', 'Port to listen on', parseInt)
    .option('-h, --host <host>', 'Host to bind to')
    .option('-t, --transport <type>', 'Transport type (http, stdio)', 'http')
    .action(startServerCommand);
  
  // Stop server command
  serverCommand.command('stop')
    .description('Stop the MCP server')
    .action(stopServerCommand);
  
  // Status command
  serverCommand.command('status')
    .description('Show server status')
    .action(statusCommand);
  
  // Alias for backward compatibility
  program.command('start')
    .description('Start the MCP server (alias for server:start)')
    .option('-p, --port <port>', 'Port to listen on', parseInt)
    .option('-h, --host <host>', 'Host to bind to')
    .option('-t, --transport <type>', 'Transport type (http, stdio)', 'http')
    .action(startServerCommand);
};

export default registerServerCommands;
