import { apiFetch, API_BASE_URL, refreshAuthToken } from "./client";

// =============================================================================
// Products API
// =============================================================================

export type ProductStatus =
  | "draft"
  | "pending_assets"  // Waiting for image uploads
  | "proposed"
  | "ready"           // Ready to publish
  | "published"
  | "rejected"
  | "failed"          // Creation failed
  | "archived";       // Soft deleted

export interface ProductVariantPrice {
  id: string;
  currencyCode: string;
  amount: number;
  compareAtPrice?: number;
  regionId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  hasDiscount: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  allowBackorder: boolean;
  manageInventory: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices: ProductVariantPrice[];
  options: Record<string, string>;
  calculatedPrice?: {
    calculatedAmount: number;
    originalAmount: number;
    currencyCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description?: string;
  image?: string;
  is_active: boolean;
  is_internal: boolean;
  position: number;
  parent_category_id?: string;
  external_id?: string;
  source?: string;
  product_count: number;
  subcategory_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CollectionProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: string;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  image_url: string | null;
  product_count: number;
  products: CollectionProduct[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
  position: number;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  description?: string;
  status: ProductStatus;
  thumbnail?: string;
  isGiftcard: boolean;
  discountable: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  originCountry?: string;
  material?: string;
  collectionId?: string;
  typeId?: string;
  brandId?: string;
  brandName?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  tags: string[];
  categories: string[];  // category names
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  status: ProductStatus;
  thumbnail?: string;
  discountable?: boolean;
  variantCount: number;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  content: ProductSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateProductVariantInput {
  title: string;
  sku?: string;
  ean?: string;
  barcode?: string;
  inventoryQuantity: number;
  manageInventory: boolean;
  allowBackorder: boolean;
  options: Record<string, string>;
  prices: { currencyCode: string; amount: number }[];
}

// Image input for product creation - matches backend ImageInput
export interface ImageInput {
  url: string;
  altText?: string;
  position?: number;
}

export interface CreateProductInput {
  title: string;
  description?: string;
  handle: string;
  status?: ProductStatus;
  shippingProfileId: string;
  images?: ImageInput[];
  thumbnail?: string;
  options?: { title: string; values: string[] }[];
  variants?: CreateProductVariantInput[];
  categoryIds?: string[];
  salesChannelIds?: string[];
}

// Get products list
export async function getProducts(params?: {
  start?: number;
  end?: number;
  q?: string;
  status?: ProductStatus;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("_start", (params?.start ?? 0).toString());
  searchParams.set("_end", (params?.end ?? 20).toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);

  return apiFetch<ProductsResponse>(`/admin/products?${searchParams.toString()}`);
}

// Get single product
export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`);
}

// Create product response (includes workflow execution ID for progress tracking)
export interface CreateProductResponse extends Product {
  executionId?: string;
}

// Create product
export async function createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
  return apiFetch<CreateProductResponse>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update product input - matches backend UpdateProductInput
export interface UpdateProductInput {
  title?: string;
  subtitle?: string;
  description?: string;
  handle?: string;
  status?: string;  // Product status: draft, published, proposed, rejected
  thumbnail?: string;
  images?: string[];
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hsCode?: string;
  originCountry?: string;
  midCode?: string;
  material?: string;
  collectionId?: string;
  typeId?: string;
  tags?: string[];
  categories?: string[];  // category IDs
  shippingProfileId?: string;
  metadata?: Record<string, unknown>;
}

// Update product
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Categories API (Admin)
// =============================================================================

export interface AdminCategoriesResponse {
  categories: ProductCategory[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateCategoryInput {
  name: string;
  handle?: string;
  description?: string;
  image?: string;
  is_active?: boolean;
  is_internal?: boolean;
  position?: number;
  parent_category_id?: string;
}

export async function getCategories(params?: {
  offset?: number;
  limit?: number;
  q?: string;
  is_active?: boolean;
}): Promise<AdminCategoriesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.is_active !== undefined) searchParams.set("is_active", params.is_active.toString());

  const query = searchParams.toString();
  return apiFetch<AdminCategoriesResponse>(`/admin/categories${query ? `?${query}` : ""}`);
}

export async function createCategory(data: CreateCategoryInput): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: Partial<CreateCategoryInput>
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function getCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}`);
}

export async function activateCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}/activate`, {
    method: "POST",
  });
}

export async function deactivateCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}/deactivate`, {
    method: "POST",
  });
}

export interface CategoryProductItem {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: string;
}

export interface CategoryProductsResponse {
  products: CategoryProductItem[];
  count: number;
  offset: number;
  limit: number;
}

export async function getCategoryProducts(
  categoryId: string,
  params?: { offset?: number; limit?: number }
): Promise<CategoryProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<CategoryProductsResponse>(
    `/admin/categories/${categoryId}/products${query ? `?${query}` : ""}`
  );
}

export async function addProductsToCategory(
  categoryId: string,
  productIds: string[]
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${categoryId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ add: productIds }),
    }
  );
}

export async function removeProductsFromCategory(
  categoryId: string,
  productIds: string[]
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${categoryId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ remove: productIds }),
    }
  );
}

export async function moveProductToCategory(
  targetCategoryId: string,
  productId: string,
  fromCategoryId?: string
): Promise<{ category: ProductCategory }> {
  const params = fromCategoryId ? `?from_category_id=${fromCategoryId}` : "";
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${targetCategoryId}/products/${productId}/move${params}`,
    {
      method: "POST",
    }
  );
}

// =============================================================================
// Collections API (Admin)
// =============================================================================

export interface AdminCollectionsResponse {
  collections: ProductCollection[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateCollectionInput {
  title: string;
  handle?: string;
  metadata?: Record<string, unknown>;
}

export async function getCollections(params?: {
  offset?: number;
  limit?: number;
}): Promise<AdminCollectionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<AdminCollectionsResponse>(`/admin/collections${query ? `?${query}` : ""}`);
}

export async function createCollection(data: CreateCollectionInput): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>("/admin/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCollection(
  id: string,
  data: Partial<CreateCollectionInput>
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/collections/${id}`, {
    method: "DELETE",
  });
}

export async function getCollection(id: string): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}`);
}

export async function publishCollection(id: string): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}/publish`, {
    method: "POST",
  });
}

export interface CollectionUploadResponse {
  url: string;
  key: string;
  collectionId?: string;
  savedToCollection: boolean;
}

export async function uploadCollectionImage(
  file: File,
  collectionId?: string
): Promise<CollectionUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (collectionId) {
    formData.append("collectionId", collectionId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/collection-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function addProductsToCollection(
  collectionId: string,
  productIds: string[]
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(
    `/admin/collections/${collectionId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ add: productIds }),
    }
  );
}

export async function removeProductsFromCollection(
  collectionId: string,
  productIds: string[]
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(
    `/admin/collections/${collectionId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ remove: productIds }),
    }
  );
}

// Collection type alias for convenience
export type Collection = ProductCollection;
export type CollectionResponse = { collection: ProductCollection };
export type CollectionsResponse = AdminCollectionsResponse;

// =============================================================================
// Variants API
// =============================================================================

export interface CreateVariantInput {
  title: string;
  sku?: string;
  barcode?: string;
  allowBackorder?: boolean;
  manageInventory?: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices?: { currencyCode: string; amount: number; compareAtPrice?: number }[];
  options?: Record<string, string>;
}

export interface UpdateVariantInput {
  title?: string;
  sku?: string;
  barcode?: string;
  allowBackorder?: boolean;
  manageInventory?: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices?: { currencyCode: string; amount: number; compareAtPrice?: number }[];
}

// Create variant for a product
export async function createVariant(
  productId: string,
  data: CreateVariantInput
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/variants?productId=${productId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update variant
export async function updateVariant(
  variantId: string,
  data: UpdateVariantInput
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete variant
export async function deleteVariant(variantId: string): Promise<void> {
  await apiFetch<void>(`/admin/variants/${variantId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Options API
// =============================================================================

export interface CreateOptionInput {
  title: string;
  values: string[];
  position?: number;
}

export interface UpdateOptionInput {
  title?: string;
  values?: string[];
  position?: number;
}

// Add option to product
export async function addOption(
  productId: string,
  data: CreateOptionInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update option
export async function updateOption(
  productId: string,
  optionId: string,
  data: UpdateOptionInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options/${optionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete option
export async function deleteOption(
  productId: string,
  optionId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options/${optionId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Product Images API
// =============================================================================

export interface UploadImageResponse {
  url: string;
  key: string;
  productId?: string;
  savedToProduct: boolean;
}

export interface AddProductImageInput {
  url: string;
  altText?: string;
  position?: number;
}

// Upload image to storage (MinIO/S3)
export async function uploadProductImage(
  file: File,
  productId?: string,
  _isRetry: boolean = false
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (productId) {
    formData.append("productId", productId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/product-image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    // On 401, attempt to refresh token and retry (once)
    if (response.status === 401 && !_isRetry) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the upload
        return uploadProductImage(file, productId, true);
      }
      // Refresh failed - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const error = await response.text();
    throw new Error(error || "Failed to upload image");
  }

  return response.json();
}

// Add image to product (after uploading to storage)
export async function addProductImage(
  productId: string,
  data: AddProductImageInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Delete image from product
export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

// Update image (position, alt text)
export async function updateProductImage(
  productId: string,
  imageId: string,
  data: Partial<AddProductImageInput>
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/${imageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Reorder product images - first image becomes thumbnail
export async function reorderProductImages(
  productId: string,
  imageIds: string[]
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/reorder`, {
    method: "POST",
    body: JSON.stringify({ imageIds }),
  });
}

// Set product thumbnail by image ID
export async function setProductThumbnail(
  productId: string,
  imageId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/thumbnail`, {
    method: "PUT",
    body: JSON.stringify({ imageId }),
  });
}

// =============================================================================
// SKU & Barcode Utilities
// =============================================================================

// Validate EAN-13 barcode
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[12], 10);
}
