import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApproachDashboardSelection,
  type ApproachImportPeriod,
  getApproachDashboard,
  getApproachImports,
  importApproachFile,
  previewApproachFile,
} from "../api/approach.api";

export const APPROACH_IMPORTS_QUERY_KEY = ["approach-imports"];
export const APPROACH_DASHBOARD_QUERY_KEY = ["approach-dashboard"];

export const useApproachImports = (
  limit = 30,
  period: ApproachImportPeriod = {},
) =>
  useQuery({
    queryKey: [
      ...APPROACH_IMPORTS_QUERY_KEY,
      limit,
      period.from ?? null,
      period.to ?? null,
    ],
    queryFn: () => getApproachImports(limit, period),
  });

export const useApproachDashboard = (
  selection?: ApproachDashboardSelection,
  period: ApproachImportPeriod = {},
) =>
  useQuery({
    queryKey: [
      ...APPROACH_DASHBOARD_QUERY_KEY,
      selection ?? "latest",
      period.from ?? null,
      period.to ?? null,
    ],
    queryFn: () => getApproachDashboard(selection, period),
  });

export const usePreviewApproach = () =>
  useMutation({
    mutationFn: previewApproachFile,
  });

export const useImportApproach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importApproachFile,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: APPROACH_IMPORTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: APPROACH_DASHBOARD_QUERY_KEY,
        }),
      ]),
  });
};
