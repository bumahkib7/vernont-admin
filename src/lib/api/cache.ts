// Cache Management API

import { apiFetch } from "./client";

export interface CacheResponse {
  success: boolean;
  message: string;
  clearedCaches?: string[];
  clearedCache?: string;
  caches?: string[];
}

/**
 * Clear Pinterest feed caches (CSV and XML).
 * Use this after updating products to immediately refresh the Pinterest Shopping catalog.
 */
export async function clearPinterestFeedCaches(): Promise<CacheResponse> {
  return apiFetch<CacheResponse>("/admin/cache/pinterest-feeds/clear", {
    method: "POST",
  });
}

/**
 * Clear a specific cache by name.
 */
export async function clearSpecificCache(cacheName: string): Promise<CacheResponse> {
  return apiFetch<CacheResponse>(`/admin/cache/clear/${cacheName}`, {
    method: "POST",
  });
}

/**
 * Clear all application caches.
 * Use with caution as this may temporarily impact performance.
 */
export async function clearAllCaches(): Promise<CacheResponse> {
  return apiFetch<CacheResponse>("/admin/cache/clear-all", {
    method: "POST",
  });
}

/**
 * Get list of all active cache names.
 */
export async function getCacheNames(): Promise<CacheResponse> {
  return apiFetch<CacheResponse>("/admin/cache/names", {
    method: "GET",
  });
}
