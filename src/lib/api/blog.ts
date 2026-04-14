import { apiFetch } from "./client";

// ============================================================================
// Types
// ============================================================================

export type BlogPostType =
  | "PRODUCT_GUIDE"
  | "COMPARISON"
  | "CATEGORY_GUIDE"
  | "EDITORIAL"
  | "EXPERT_COLUMN";

export type BlogPostStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type ProductRole = "PRIMARY" | "COMPARED" | "MENTIONED" | "RECOMMENDED";

export interface BlogBlock {
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "product-card"
    | "product-comparison"
    | "callout"
    | "faq"
    | "cta"
    | "quote"
    | "divider";
  [key: string]: unknown;
}

export interface BlogPostProduct {
  productId: string;
  role: ProductRole;
  position: number;
  productTitle?: string;
  productThumbnail?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  postType: BlogPostType;
  status: BlogPostStatus;
  blocks: BlogBlock[];
  excerpt?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  author?: { name: string; credential: string; avatar?: string };
  tags: string[];
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  readingTimeMinutes: number;
  wordCount: number;
  qualityScore?: number;
  featured: boolean;
  publishedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  products: BlogPostProduct[];
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  postType: BlogPostType;
  status: BlogPostStatus;
  category?: string;
  excerpt?: string;
  coverImageUrl?: string;
  readingTimeMinutes: number;
  wordCount: number;
  qualityScore?: number;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  productsCount: number;
}

export interface BlogPostsResponse {
  items: BlogPostListItem[];
  total: number;
}

export interface BlogPostsQueryParams {
  status?: BlogPostStatus;
  type?: BlogPostType;
  category?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateBlogPostInput {
  title: string;
  postType: BlogPostType;
  category?: string;
  tags?: string[];
  excerpt?: string;
}

export interface SetBlogPostProductInput {
  productId: string;
  role: ProductRole;
  position: number;
}

export interface GenerateBlogPostAIInput {
  type: BlogPostType;
  productIds: string[];
  topic?: string;
}

export interface PreviewTokenResponse {
  token: string;
  url: string;
}

export interface BlogProductSearchResult {
  id: string;
  title: string;
  thumbnail?: string;
}

// ============================================================================
// API Functions
// ============================================================================

export async function listBlogPosts(
  params?: BlogPostsQueryParams
): Promise<BlogPostsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.size) searchParams.set("size", String(params.size));

  const qs = searchParams.toString();
  return apiFetch<BlogPostsResponse>(
    `/api/v1/admin/blog/posts${qs ? `?${qs}` : ""}`
  );
}

export async function getBlogPost(id: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/admin/blog/posts/${id}`);
}

export async function createBlogPost(
  data: CreateBlogPostInput
): Promise<BlogPost> {
  return apiFetch<BlogPost>("/api/v1/admin/blog/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBlogPost(
  id: string,
  data: Partial<BlogPost>
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/admin/blog/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/blog/posts/${id}`, {
    method: "DELETE",
  });
}

export async function updateBlogPostStatus(
  id: string,
  status: BlogPostStatus
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/admin/blog/posts/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function setBlogPostProducts(
  id: string,
  products: SetBlogPostProductInput[]
): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/blog/posts/${id}/products`, {
    method: "PUT",
    body: JSON.stringify({ products }),
  });
}

export async function generatePreviewToken(
  id: string
): Promise<PreviewTokenResponse> {
  return apiFetch<PreviewTokenResponse>(
    `/api/v1/admin/blog/posts/${id}/preview-token`,
    { method: "POST" }
  );
}

export async function generateBlogPostAI(
  id: string,
  data: GenerateBlogPostAIInput
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/v1/admin/blog/posts/${id}/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function searchProductsForBlog(
  query: string
): Promise<BlogProductSearchResult[]> {
  return apiFetch<BlogProductSearchResult[]>(
    `/api/v1/admin/blog/products/search?q=${encodeURIComponent(query)}`
  );
}
