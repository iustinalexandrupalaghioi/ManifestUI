"use client";

const handoffs = new Map<string, Record<string, unknown>>();

export function stashNavigationState(
  key: string,
  state: Record<string, unknown>,
) {
  handoffs.set(key, state);
}

export function popNavigationState<T = Record<string, unknown>>(
  key: string,
): T | undefined {
  const value = handoffs.get(key);
  handoffs.delete(key);
  return value as T | undefined;
}
