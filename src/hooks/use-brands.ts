"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "@/lib/api/brands";

export const brandKeys = {
  all: ["brands"] as const,
  lists: () => [...brandKeys.all, "list"] as const,
  list: (page: number, size: number, search?: string) =>
    [...brandKeys.lists(), { page, size, search }] as const,
  detail: (id: string) => [...brandKeys.all, "detail", id] as const,
};

export function useBrands(page = 0, size = 20, search?: string) {
  return useQuery({
    queryKey: brandKeys.list(page, size, search),
    queryFn: () => getBrands(page, size, search),
    placeholderData: keepPreviousData,
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => getBrand(id),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBrandInput) => createBrand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBrandInput }) =>
      updateBrand(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}
