#!/usr/bin/env node

/**
 * WYND Project Management MCP Server
 * 
 * This MCP server provides tools and resources for interacting with the WYND
 * Project Management Software, enabling AI assistants to manage workspaces,
 * projects, tasks, and user profiles programmatically.
 */

import 'dotenv/config';
import { config } from './config/index.js';
import { wyndMcpServer } from './server/index.js';
import logger from './utils/logger.js';

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Attempt a graceful shutdown
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider whether to exit here or not
  // process.exit(1);
});

/**
 * Handle process termination signals
 */
const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

shutdownSignals.forEach((signal) => {
  process.on(signal, () => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    // Add any cleanup code here if needed
    process.exit(0);
  });
});

/**
 * Start the WYND MCP Server
 */
async function startServer() {
  try {
    logger.info('Starting WYND MCP Server...');
    
    // Log environment info (safely, without sensitive data)
    logger.debug('Environment:', {
      node_env: config.env,
      api_url: config.api.url,
      server_port: config.server.port,
      log_level: config.server.logLevel,
    });

    // Start the server
    await wyndMcpServer.start();
    
    // Log successful startup
    logger.info(`WYND MCP Server is running in ${config.env} mode`);
    
  } catch (error) {
    logger.error('Failed to start WYND MCP Server:', error);
    process.exit(1);
  }
}

// Execute the server startup
startServer().catch((error) => {
  logger.error('Unhandled error during server startup:', error);
  process.exit(1);
});
