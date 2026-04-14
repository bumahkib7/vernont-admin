"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  updateBlogPostStatus,
  generateBlogPostAI,
  type BlogPostsResponse,
  type BlogPost,
  type BlogPostsQueryParams,
  type BlogPostStatus,
  type CreateBlogPostInput,
  type GenerateBlogPostAIInput,
} from "@/lib/api/blog";

// ============================================================================
// Query Keys
// ============================================================================

export const blogPostKeys = {
  all: ["blog-posts"] as const,
  lists: () => [...blogPostKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...blogPostKeys.lists(), params] as const,
  details: () => [...blogPostKeys.all, "detail"] as const,
  detail: (id: string) => [...blogPostKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useBlogPosts(params?: BlogPostsQueryParams) {
  return useQuery<BlogPostsResponse>({
    queryKey: blogPostKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => listBlogPosts(params),
    staleTime: 30000,
  });
}

export function useBlogPost(id: string | undefined) {
  return useQuery<BlogPost>({
    queryKey: blogPostKeys.detail(id!),
    queryFn: () => getBlogPost(id!),
    enabled: !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlogPostInput) => createBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogPostKeys.lists() });
      toast.success("Blog post created");
    },
    onError: (error) => {
      toast.error(`Failed to create blog post: ${error.message}`);
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) =>
      updateBlogPost(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: blogPostKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: blogPostKeys.detail(variables.id),
      });
      toast.success("Blog post updated");
    },
    onError: (error) => {
      toast.error(`Failed to update blog post: ${error.message}`);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogPostKeys.lists() });
      toast.success("Blog post deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete blog post: ${error.message}`);
    },
  });
}

export function useUpdateBlogPostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogPostStatus }) =>
      updateBlogPostStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: blogPostKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: blogPostKeys.detail(variables.id),
      });
      toast.success("Blog post status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useGenerateBlogPostAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: GenerateBlogPostAIInput;
    }) => generateBlogPostAI(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: blogPostKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: blogPostKeys.detail(variables.id),
      });
      toast.success("Blog post content generated");
    },
    onError: (error) => {
      toast.error(`AI generation failed: ${error.message}`);
    },
  });
}
