import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDislocationImports,
  getCurrentUnmatchedDislocations,
  getUnmatchedDislocations,
  ignoreUnmatchedDislocation,
  importDislocationFile,
  linkUnmatchedDislocation,
  reconcileUnmatchedDislocations,
  reopenUnmatchedDislocation,
  syncDislocationsFromEmail,
} from "../api/dislocation.api";
import type { ReconcileEntry } from "../api/dislocation.api";

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

const invalidateCurrent = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dislocation-current-unmatched"] }),
    queryClient.invalidateQueries({ queryKey: ["attention-center"] }),
    queryClient.invalidateQueries({ queryKey: DISLOCATION_IMPORTS_QUERY_KEY }),
  ]);

export const useCurrentUnmatchedDislocations = (status: 'OPEN' | 'IGNORED' = 'OPEN') =>
  useQuery({
    queryKey: ["dislocation-current-unmatched", status],
    queryFn: () => getCurrentUnmatchedDislocations(status),
  });

export const useLinkUnmatchedDislocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ wagonNumber, wagonId }: { wagonNumber: string; wagonId: number }) =>
      linkUnmatchedDislocation(wagonNumber, wagonId),
    onSuccess: () => invalidateCurrent(queryClient),
  });
};

export const useIgnoreUnmatchedDislocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ wagonNumber, note }: { wagonNumber: string; note: string }) =>
      ignoreUnmatchedDislocation(wagonNumber, note),
    onSuccess: () => invalidateCurrent(queryClient),
  });
};

export const useReopenUnmatchedDislocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reopenUnmatchedDislocation,
    onSuccess: () => invalidateCurrent(queryClient),
  });
};

export const useReconcileUnmatchedDislocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dryRun, entries }: { dryRun: boolean; entries?: ReconcileEntry[] }) =>
      reconcileUnmatchedDislocations(dryRun, entries),
    onSuccess: (_result, variables) => variables.dryRun ? undefined : invalidateCurrent(queryClient),
  });
};

export const useImportDislocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importDislocationFile,
    onSuccess: () => invalidateCurrent(queryClient),
  });
};

export const useSyncDislocationsFromEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncDislocationsFromEmail,
    onSuccess: () => invalidateCurrent(queryClient),
  });
};
