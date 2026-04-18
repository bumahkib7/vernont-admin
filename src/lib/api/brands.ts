import { apiFetch } from "./client";

// --- Types ---

export type BrandTier = "LUXURY" | "PREMIUM" | "STANDARD";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  active: boolean;
  tier: BrandTier;
  productTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandsPage {
  content: Brand[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  active?: boolean;
  tier?: BrandTier;
  productTypes?: string[];
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  active?: boolean;
  tier?: BrandTier;
  productTypes?: string[];
}

// --- API Functions ---

export async function getBrands(
  page = 0,
  size = 20,
  search?: string
): Promise<BrandsPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.set("q", search);
  return apiFetch<BrandsPage>(`/admin/brands?${params}`);
}

export async function getBrand(id: string): Promise<Brand> {
  return apiFetch<Brand>(`/admin/brands/${id}`);
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  return apiFetch<Brand>("/admin/brands", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput
): Promise<Brand> {
  return apiFetch<Brand>(`/admin/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await apiFetch<void>(`/admin/brands/${id}`, {
    method: "DELETE",
  });
}
