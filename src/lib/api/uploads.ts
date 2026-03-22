import { API_BASE_URL, parseErrorResponse } from "./client";

// ============================================================================
// CSV Import/Export APIs
// ============================================================================

export interface ImportResult {
  totalRows: number;
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function importProductsCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/admin/import/products`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });
  if (!response.ok) throw await parseErrorResponse(response);
  return response.json();
}

export async function importCustomersCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/admin/import/customers`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });
  if (!response.ok) throw await parseErrorResponse(response);
  return response.json();
}

export function getExportUrl(type: "products" | "customers" | "orders"): string {
  return `${API_BASE_URL}/admin/export/${type}`;
}
