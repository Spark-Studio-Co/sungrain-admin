import { apiClient } from "@/shared/api/apiClient";

export type ApproachImportStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export type ApproachImport = {
  id: number;
  attachmentName: string;
  sheetName: string;
  reportDate: string | null;
  status: ApproachImportStatus;
  rowsTotal: number;
  totalTons: number;
  issueCount: number;
  uploadedByEmail: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ApproachRow = {
  id: number;
  importId: number;
  sourceRow: number;
  currentStation: string;
  wagonNumber: string;
  code: string | null;
  cargoName: string | null;
  tons: number;
  recipient: string | null;
  departureStation: string | null;
  trainIndex: string | null;
  containerNumber: string | null;
  rawData: Record<string, string | number | null> | null;
  createdAt: string;
};

export type ApproachGroup = {
  name: string;
  wagons: number;
  tons: number;
  share: number;
};

export type ApproachStats = {
  wagons: number;
  totalTons: number;
  stations: number;
  recipients: number;
  cargoes: number;
  departureStations: number;
  withTrain: number;
  withContainer: number;
};

export type ApproachDashboard = {
  scope: "single" | "all";
  sourceImportCount: number;
  import: Omit<ApproachImport, "errorMessage">;
  previousImport: {
    id: number;
    reportDate: string | null;
    rowsTotal: number;
  } | null;
  stats: ApproachStats;
  comparison: {
    appeared: string[];
    removed: string[];
    persisted: number;
  };
  groups: {
    stations: ApproachGroup[];
    recipients: ApproachGroup[];
    cargoes: ApproachGroup[];
    departureStations: ApproachGroup[];
    codes: ApproachGroup[];
  };
  rows: ApproachRow[];
};

export type ApproachDashboardSelection = number | "all" | undefined;

export type ApproachPreview = {
  sheetName: string;
  reportDate: string | null;
  stats: Pick<
    ApproachStats,
    | "wagons"
    | "totalTons"
    | "stations"
    | "recipients"
    | "cargoes"
    | "withTrain"
    | "withContainer"
  >;
  issues: Array<{
    row: number;
    message: string;
    value?: string;
  }>;
  sample: Array<
    Omit<ApproachRow, "id" | "importId" | "createdAt"> & {
      rawData: Record<string, string | number | null>;
    }
  >;
};

export type ApproachImportResult = {
  duplicate: boolean;
  refreshed: boolean;
  import: ApproachImport;
  dashboard: ApproachDashboard;
};

const toFormData = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

export const previewApproachFile = async (file: File) => {
  const response = await apiClient.post<ApproachPreview>(
    "/approach/preview",
    toFormData(file),
  );
  return response.data;
};

export const importApproachFile = async (file: File) => {
  const response = await apiClient.post<ApproachImportResult>(
    "/approach/import",
    toFormData(file),
  );
  return response.data;
};

export const getApproachImports = async (limit = 30) => {
  const response = await apiClient.get<ApproachImport[]>("/approach/imports", {
    params: { limit },
  });
  return response.data;
};

export const getApproachDashboard = async (
  selection?: ApproachDashboardSelection,
) => {
  const response = await apiClient.get<ApproachDashboard | null>(
    "/approach/dashboard",
    {
      params:
        selection === "all"
          ? { scope: "all" }
          : selection
            ? { importId: selection }
            : undefined,
    },
  );
  return response.data;
};
