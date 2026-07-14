import { apiClient } from "@/shared/api/apiClient";

export type LoginAudit = {
  id: number;
  userId: number | null;
  email: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
  geoCountry: string | null;
  geoRegion: string | null;
  geoCity: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  geoTimezone: string | null;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string | null;
  } | null;
};

export type LoginAuditResponse = {
  data: LoginAudit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    successful: number;
    failed: number;
    recent: number;
    uniqueIps: number;
  };
};

export const getLoginAudits = async ({
  page = 1,
  limit = 50,
  search = "",
  success = "all",
  excludeAdmin = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  success?: string;
  excludeAdmin?: boolean;
}) => {
  const response = await apiClient.get<LoginAuditResponse>(
    "/user/login-audits",
    {
      params: { page, limit, search, success, excludeAdmin },
    },
  );

  return response.data;
};
