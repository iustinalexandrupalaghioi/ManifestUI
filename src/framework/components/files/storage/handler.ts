import type { StorageHandler } from "./types"

let _handler: StorageHandler | null = null

export function setStorageHandler(handler: StorageHandler): void {
  _handler = handler
}

export function getStorageHandler(): StorageHandler {
  if (!_handler) {
    throw new Error(
      "No storage handler configured. Call setStorageHandler() before using file uploads."
    )
  }
  return _handler
}
