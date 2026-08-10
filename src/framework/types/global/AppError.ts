export interface AppError {
  message: string;
  originalMessage: string;
  code?: string;
  details?: string;
  hint?: string;
  // Short, dialog-header-friendly summary (e.g. "Nu s-a putut șterge o
  // sarcină") — distinct from `message`, which names the specific record
  // (e.g. "...sarcina #41: ..."). Falls back to a generic title when unset
  // (errors not produced by describeActionFailure, e.g. permission/validation
  // failures).
  title?: string;
  meta?: { type: string; [key: string]: unknown };
}
