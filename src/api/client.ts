import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../config/index.js';

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Creates and configures an Axios instance for the WYND API
 */
function createApiClient(): AxiosInstance {
  const api = axios.create({
    baseURL: config.api.url,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api.token}`,
    },
  });

  // Request interceptor for logging and adding auth token
  api.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }
      return config;
    },
    (error) => {
      console.error('[API] Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response.data;
    },
    (error: AxiosError) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseData = error.response.data as { message?: string; [key: string]: unknown };
        const errorMessage = typeof responseData === 'object' && responseData !== null && 'message' in responseData 
          ? String(responseData.message) 
          : error.message;
          
        const apiError = new ApiError(
          errorMessage,
          error.response.status,
          responseData
        );
        console.error('[API] Response Error:', apiError);
        return Promise.reject(apiError);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[API] No response received:', error.request);
        return Promise.reject(new Error('No response received from server'));
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[API] Request setup error:', error.message);
        return Promise.reject(error);
      }
    }
  );

  return api;
}

// Create and export the API client instance
export const wyndApi = createApiClient();

// Re-export types for convenience
export type { ApiError };
