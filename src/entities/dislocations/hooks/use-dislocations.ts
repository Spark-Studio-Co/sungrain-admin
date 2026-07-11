import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDislocationImports,
  getUnmatchedDislocations,
  importDislocationFile,
  syncDislocationsFromEmail,
} from "../api/dislocation.api";

export const DISLOCATION_IMPORTS_QUERY_KEY = ["dislocation-imports"];

export const useDislocationImports = (limit = 50) =>
  useQuery({
    queryKey: [...DISLOCATION_IMPORTS_QUERY_KEY, limit],
    queryFn: () => getDislocationImports(limit),
  });

export const useUnmatchedDislocations = (importId?: number) =>
  useQuery({
    queryKey: ["dislocation-unmatched", importId],
    queryFn: () => getUnmatchedDislocations(importId as number),
    enabled: typeof importId === "number",
  });

export const useImportDislocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importDislocationFile,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: DISLOCATION_IMPORTS_QUERY_KEY,
      }),
  });
};

export const useSyncDislocationsFromEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncDislocationsFromEmail,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: DISLOCATION_IMPORTS_QUERY_KEY,
      }),
  });
};
