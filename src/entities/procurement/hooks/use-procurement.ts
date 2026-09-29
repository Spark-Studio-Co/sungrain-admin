import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ProcurementFarmFilters,
  getProcurementFarmRegistry,
  getProcurementImports,
  importProcurementFile,
} from "../api/procurement.api";

export const PROCUREMENT_IMPORTS_QUERY_KEY = ["procurement-imports"];
export const PROCUREMENT_FARMERS_QUERY_KEY = ["procurement-farmers"];

export const useProcurementImports = (limit = 30) =>
  useQuery({
    queryKey: [...PROCUREMENT_IMPORTS_QUERY_KEY, limit],
    queryFn: () => getProcurementImports(limit),
  });

export const useProcurementFarmRegistry = (filters: ProcurementFarmFilters) =>
  useQuery({
    queryKey: [
      ...PROCUREMENT_FARMERS_QUERY_KEY,
      filters.importId ?? "latest",
      filters.region ?? null,
      filters.district ?? null,
      filters.ruralDistrict ?? null,
      filters.cultureKey ?? null,
      filters.search ?? null,
      filters.withPhone ?? false,
    ],
    queryFn: () => getProcurementFarmRegistry(filters),
  });

export const useImportProcurement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importProcurementFile,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: PROCUREMENT_IMPORTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROCUREMENT_FARMERS_QUERY_KEY }),
      ]),
  });
};
