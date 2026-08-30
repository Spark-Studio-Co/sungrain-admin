import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApproachDashboardSelection,
  getApproachDashboard,
  getApproachImports,
  importApproachFile,
  previewApproachFile,
} from "../api/approach.api";

export const APPROACH_IMPORTS_QUERY_KEY = ["approach-imports"];
export const APPROACH_DASHBOARD_QUERY_KEY = ["approach-dashboard"];

export const useApproachImports = (limit = 30) =>
  useQuery({
    queryKey: [...APPROACH_IMPORTS_QUERY_KEY, limit],
    queryFn: () => getApproachImports(limit),
  });

export const useApproachDashboard = (selection?: ApproachDashboardSelection) =>
  useQuery({
    queryKey: [...APPROACH_DASHBOARD_QUERY_KEY, selection ?? "latest"],
    queryFn: () => getApproachDashboard(selection),
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
