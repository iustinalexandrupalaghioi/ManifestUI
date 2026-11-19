"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * The title of the record a page shows, for chrome outside the page (the CMS
 * navbar's breadcrumb). A record page publishes it; the navbar reads it.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

function set(title: string | null) {
  if (title === current) return;
  current = title;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Publishes the shown record's title while the calling component is mounted. `null`
 * publishes nothing (a record panel inside a page leaves the page's title alone), and
 * unmounting clears only a title this component published.
 */
export function usePublishRecordTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    set(title);
    return () => {
      if (current === title) set(null);
    };
  }, [title]);
}

/** The title published by the record page on screen, or `null`. */
export function useRecordTitle() {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** Fields that usually name a record, in order of preference. */
const TITLE_FIELDS = ["title", "name", "fullName", "full_name", "label", "displayName", "email", "slug", "code"];

/**
 * A readable title for a record: its first non-empty naming field
 * (`title`, `name`, …), else `#<id>`.
 */
export function recordTitle(item: unknown, id?: string | number): string | null {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    for (const field of TITLE_FIELDS) {
      const value = record[field];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return id === undefined || id === "" ? null : `#${id}`;
}
