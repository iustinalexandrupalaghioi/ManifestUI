import type { AppError } from "@/framework/types/global/AppError"

export function mapError(err: Error): AppError {
  return {
    message: err.message,
    originalMessage: err.message,
  }
}
