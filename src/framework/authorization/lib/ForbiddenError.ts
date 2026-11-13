export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}
