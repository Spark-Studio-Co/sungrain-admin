import { apiClient } from "@/shared/api/apiClient";

export type ProcurementImportStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export type ProcurementImport = {
  id: number;
  attachmentName: string;
  sheetName: string;
  regionName: string | null;
  cropYear: number | null;
  status: ProcurementImportStatus;
  farmsTotal: number;
  issueCount: number;
  uploadedByEmail: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ProcurementCropArea = {
  id: number;
  cultureKey: string;
  cultureName: string;
  sectionName: string | null;
  areaHa: number;
};

export type ProcurementFarmRecord = {
  id: number;
  importId: number;
  sourceRow: number;
  regionName: string | null;
  district: string | null;
  ruralDistrict: string | null;
  organizationName: string;
  leaderName: string | null;
  phone: string | null;
  totalAreaHa: number | null;
  cropAreas?: ProcurementCropArea[];
  selectedAreaHa?: number;
};

export type ProcurementRegistryFilters = {
  regions: string[];
  districts: string[];
  ruralDistricts: string[];
  cultures: Array<{ key: string; name: string }>;
};

export type ProcurementFarmRegistry = {
  import: ProcurementImport | null;
  filters: ProcurementRegistryFilters;
  rows: ProcurementFarmRecord[];
};

export type ProcurementFarmFilters = {
  importId?: number;
  region?: string;
  district?: string;
  ruralDistrict?: string;
  cultureKey?: string;
  search?: string;
  withPhone?: boolean;
};

export type ProcurementImportResult = {
  duplicate: boolean;
  import: ProcurementImport;
  preview?: {
    regionName?: string;
    cropYear?: number;
    farmsTotal: number;
    issueCount: number;
  };
};

export const importProcurementFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<ProcurementImportResult>(
    "/procurement/import",
    formData,
  );
  return response.data;
};

export const getProcurementImports = async (limit = 30) => {
  const response = await apiClient.get<ProcurementImport[]>(
    "/procurement/imports",
    { params: { limit } },
  );
  return response.data;
};

export const getProcurementFarmRegistry = async (
  filters: ProcurementFarmFilters,
) => {
  const response = await apiClient.get<ProcurementFarmRegistry>(
    "/procurement/farmers",
    { params: filters },
  );
  return response.data;
};
