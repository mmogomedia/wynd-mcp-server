import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  WYND_API_URL: z.string().url().default('https://wynd.mmogomedia.com'),
  WYND_API_TOKEN: z.string().min(1, 'WYND_API_TOKEN is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  API_TIMEOUT: z.string().default('10000'), // in milliseconds
  DEFAULT_PROJECT_ID: z.string().min(1, 'DEFAULT_PROJECT_ID is required'), // Default project ID for operations
});

// Parse environment variables
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

// Export the validated environment variables
export const config = {
  env: envVars.data.NODE_ENV,
  isProd: envVars.data.NODE_ENV === 'production',
  isDev: envVars.data.NODE_ENV === 'development',
  isTest: envVars.data.NODE_ENV === 'test',
  
  // API Configuration
  api: {
    url: envVars.data.WYND_API_URL,
    token: envVars.data.WYND_API_TOKEN,
    timeout: parseInt(envVars.data.API_TIMEOUT, 10),
  },
  
  // Server Configuration
  server: {
    port: parseInt(envVars.data.PORT, 10),
    logLevel: envVars.data.LOG_LEVEL,
  },
  
  // Project Configuration
  project: {
    defaultProjectId: envVars.data.DEFAULT_PROJECT_ID,
  }
};
