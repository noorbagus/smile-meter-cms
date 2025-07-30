/**
 * Error tracking and monitoring functionality
 * 
 * This is a simple implementation that logs errors to the console in development
 * and could be expanded to use services like Sentry in production.
 */

// Types of errors we want to track
export enum ErrorType {
    API = 'api_error',
    AUTH = 'auth_error',
    UPLOAD = 'upload_error',
    VALIDATION = 'validation_error',
    NETWORK = 'network_error',
    UNKNOWN = 'unknown_error'
  }
  
  interface ErrorDetails {
    message: string;
    type: ErrorType;
    context?: Record<string, any>;
    stack?: string;
  }
  
  /**
   * Log an error to the console and/or error tracking service
   */
  export function logError(details: ErrorDetails): void {
    const { message, type, context = {}, stack } = details;
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${type}] ${message}`, {
        context,
        stack
      });
      return;
    }
    
    // In production, could send to an error tracking service
    // Example with Sentry (would need to be installed):
    // Sentry.captureException(new Error(message), {
    //   tags: { type },
    //   extra: context
    // });
  }
  
  /**
   * Capture and log an API error
   */
  export function captureApiError(error: any, endpoint: string): void {
    logError({
      message: error.message || 'API request failed',
      type: ErrorType.API,
      context: {
        endpoint,
        status: error.status || 'unknown',
        data: error.data || {}
      },
      stack: error.stack
    });
  }
  
  /**
   * Capture and log an authentication error
   */
  export function captureAuthError(error: any, action: string): void {
    logError({
      message: error.message || 'Authentication error',
      type: ErrorType.AUTH,
      context: {
        action,
        code: error.code || 'unknown'
      },
      stack: error.stack
    });
  }
  
  /**
   * Capture and log an upload error
   */
  export function captureUploadError(error: any, fileInfo?: { name: string, size: number, type: string }): void {
    logError({
      message: error.message || 'File upload failed',
      type: ErrorType.UPLOAD,
      context: {
        fileInfo,
        code: error.code || 'unknown'
      },
      stack: error.stack
    });
  }
  
  /**
   * Create an error handler function with context
   */
  export function createErrorHandler(context: Record<string, any>) {
    return (error: any, type: ErrorType = ErrorType.UNKNOWN) => {
      logError({
        message: error.message || 'An error occurred',
        type,
        context,
        stack: error.stack
      });
    };
  }
  
  /**
   * Wrap a function with error handling
   */
  export function withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    type: ErrorType = ErrorType.UNKNOWN,
    context: Record<string, any> = {}
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        return fn(...args);
      } catch (error: any) {
        logError({
          message: error.message || 'Function execution failed',
          type,
          context: {
            ...context,
            functionName: fn.name,
            arguments: args
          },
          stack: error.stack
        });
        return undefined;
      }
    };
  }