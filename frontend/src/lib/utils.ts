import { AxiosError } from 'axios';

/**
 * Extracts a human-readable message from an API error.
 * Handles NestJS error bodies where `message` is a string or string array.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: string | string[] };
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}
