import { apiFetch } from "./client";

// =============================================================================
// Product Tags API
// =============================================================================

export interface ProductTag {
  id: string;
  value: string;
  product_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProductTagListResponse {
  product_tags: ProductTag[];
  count: number;
}

export interface ProductTagSingleResponse {
  product_tag: ProductTag;
}

export async function getProductTags(q?: string): Promise<ProductTagListResponse> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const query = params.toString();
  return apiFetch<ProductTagListResponse>(`/admin/product-tags${query ? `?${query}` : ""}`);
}

export async function createProductTag(value: string): Promise<ProductTagSingleResponse> {
  return apiFetch<ProductTagSingleResponse>("/admin/product-tags", {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export async function updateProductTag(id: string, value: string): Promise<ProductTagSingleResponse> {
  return apiFetch<ProductTagSingleResponse>(`/admin/product-tags/${id}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export async function deleteProductTag(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/product-tags/${id}`, {
    method: "DELETE",
  });
}
