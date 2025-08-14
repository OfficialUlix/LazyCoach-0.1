import { Alert } from 'react-native';

export class AppError extends Error {
  constructor(
    message: string,
    public type: 'network' | 'validation' | 'authentication' | 'server' | 'unknown' = 'unknown',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createNetworkError = (message: string = 'Network connection failed'): AppError => 
  new AppError(message, 'network');

export const createValidationError = (message: string): AppError => 
  new AppError(message, 'validation');

export const createAuthError = (message: string = 'Authentication failed'): AppError => 
  new AppError(message, 'authentication');

export const createServerError = (message: string = 'Server error occurred', statusCode?: number): AppError => 
  new AppError(message, 'server', statusCode);

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.message?.includes('Network request failed')) {
    return createNetworkError('Please check your internet connection and try again.');
  }

  if (error?.status === 401 || error?.statusCode === 401) {
    return createAuthError('Your session has expired. Please log in again.');
  }

  if (error?.status === 403 || error?.statusCode === 403) {
    return createAuthError('You do not have permission to perform this action.');
  }

  if (error?.status === 404 || error?.statusCode === 404) {
    return createServerError('The requested resource was not found.');
  }

  if (error?.status >= 500 || error?.statusCode >= 500) {
    return createServerError('Server is temporarily unavailable. Please try again later.');
  }

  if (error?.message) {
    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred. Please try again.');
}

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function showErrorAlert(error: any, title: string = 'Error'): void {
  const message = getErrorMessage(error);
  Alert.alert(title, message);
}

export function getRetryMessage(error: AppError): string {
  switch (error.type) {
    case 'network':
      return 'Check your connection and try again';
    case 'server':
      return 'Try again in a few moments';
    case 'authentication':
      return 'Please log in again';
    default:
      return 'Try again';
  }
}

export function shouldShowRetry(error: AppError): boolean {
  return error.type !== 'authentication';
}