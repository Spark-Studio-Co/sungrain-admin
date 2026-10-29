import { apiClient } from "@/shared/api/apiClient";

export type DislocationImportStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type DislocationImport = {
  id: number;
  sourceMessageId: string | null;
  sourceUid: number | null;
  sender: string | null;
  subject: string | null;
  attachmentName: string;
  attachmentHash: string;
  sourceCreatedAt: string | null;
  receivedAt: string | null;
  status: DislocationImportStatus;
  rowsTotal: number;
  matchedRows: number;
  unmatchedRows: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type DislocationImportResult = {
  duplicate: boolean;
  parsedRows?: number;
  skippedRows?: number;
  import: DislocationImport;
};

export type DislocationEmailSyncResult = {
  skipped: boolean;
  reason?: string;
  processed?: number;
  results?: Array<{
    uid?: number;
    attachment?: string;
    duplicate?: boolean;
    importId?: number;
    error?: string;
  }>;
};

export type UnmatchedDislocation = {
  id: number;
  wagonNumber: string;
  departureStation: string | null;
  destinationStation: string | null;
  lastOperationStation: string | null;
  operation: string | null;
  distanceToDestinationKm: number | null;
  lastOperationAt: string | null;
  observedAt: string;
};

export type CurrentUnmatchedDislocation = UnmatchedDislocation & {
  reason: string;
  note: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  candidates: Array<{
    id: number;
    contractId: string | null;
    contractNumber: string | null;
    applicationId: number | null;
  }>;
};

export const getDislocationImports = async (limit = 50) => {
  const response = await apiClient.get<DislocationImport[]>(
    "/dislocation/imports",
    { params: { limit } },
  );

  return response.data;
};

export const importDislocationFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<DislocationImportResult>(
    "/dislocation/import",
    formData,
  );

  return response.data;
};

export const getUnmatchedDislocations = async (importId: number) => {
  const response = await apiClient.get<UnmatchedDislocation[]>(
    `/dislocation/imports/${importId}/unmatched`,
  );

  return response.data;
};

export const getCurrentUnmatchedDislocations = async (status: 'OPEN' | 'IGNORED' = 'OPEN') => {
  const response = await apiClient.get<CurrentUnmatchedDislocation[]>(
    "/dislocation/current-unmatched",
    { params: { status } },
  );
  return response.data;
};

export const linkUnmatchedDislocation = async (wagonNumber: string, wagonId: number) => {
  const response = await apiClient.post(
    `/dislocation/current-unmatched/${encodeURIComponent(wagonNumber)}/link`,
    { wagonId },
  );
  return response.data;
};

export const ignoreUnmatchedDislocation = async (wagonNumber: string, note: string) => {
  const response = await apiClient.patch(
    `/dislocation/current-unmatched/${encodeURIComponent(wagonNumber)}`,
    { action: "ignore", note },
  );
  return response.data;
};

export const reopenUnmatchedDislocation = async (wagonNumber: string) => {
  const response = await apiClient.patch(
    `/dislocation/current-unmatched/${encodeURIComponent(wagonNumber)}`,
    { action: "reopen" },
  );
  return response.data;
};

export type ReconcileEntry = { wagonNumber: string; snapshotId: number };

export const reconcileUnmatchedDislocations = async (dryRun: boolean, entries?: ReconcileEntry[]) => {
  const response = await apiClient.post<
    Array<{ wagonNumber: string; action: string; wagonId?: number; snapshotId?: number }>
  >("/dislocation/current-unmatched/reconcile", { dryRun, entries });
  return response.data;
};

export const syncDislocationsFromEmail = async () => {
  const response = await apiClient.post<DislocationEmailSyncResult>(
    "/dislocation/sync-email",
  );

  return response.data;
};
