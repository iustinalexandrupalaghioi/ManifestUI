export interface AppError {
  message: string;
  originalMessage: string;
  code?: string;
  details?: string;
  hint?: string;
  meta?: { type: string; [key: string]: unknown };
}
