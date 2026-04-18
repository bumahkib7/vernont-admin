import { useQuery } from "@tanstack/react-query";
import {
  getSpecificationTypes,
  getSpecificationSchema,
  type SpecificationTypeInfo,
  type SpecificationSchema,
} from "@/lib/api/products";

export const specSchemaKeys = {
  types: ["specification-types"] as const,
  schema: (type: string) => ["specification-schema", type] as const,
};

export function useSpecificationTypes() {
  return useQuery<SpecificationTypeInfo[]>({
    queryKey: specSchemaKeys.types,
    queryFn: getSpecificationTypes,
    staleTime: 10 * 60 * 1000, // schemas change only on deploy
  });
}

export function useSpecificationSchema(type: string | null) {
  return useQuery<SpecificationSchema>({
    queryKey: specSchemaKeys.schema(type!),
    queryFn: () => getSpecificationSchema(type!),
    enabled: !!type,
    staleTime: 10 * 60 * 1000,
  });
}
