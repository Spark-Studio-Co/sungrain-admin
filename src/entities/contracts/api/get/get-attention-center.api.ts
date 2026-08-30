import { apiClient } from "@/shared/api/apiClient";

export type AttentionSeverity = "ok" | "warning" | "danger";

export interface AttentionPreviewItem {
  id: string | number;
  label: string;
  meta: string;
  href: string;
}

export interface AttentionItem {
  key: string;
  title: string;
  description: string;
  count: number;
  severity: AttentionSeverity;
  href: string;
  totals?: Record<string, number>;
  preview: AttentionPreviewItem[];
  details?: AttentionPreviewItem[];
}

export interface AttentionCenterResponse {
  generatedAt: string;
  thresholds: {
    staleDislocationHours: number;
    idleDays: number;
  };
  items: AttentionItem[];
  summary: {
    total: number;
    affectedContracts: number;
  };
}

export const getAttentionCenter = async () => {
  const response = await apiClient.get<AttentionCenterResponse>(
    "/contract/attention-center",
  );
  return response.data;
};
