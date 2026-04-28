export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
}

export function successResponse<T>(data: T, message = 'OK'): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(message: string): ApiResponse<null> {
  return { success: false, data: null, message };
}
