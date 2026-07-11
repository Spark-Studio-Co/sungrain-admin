import { useQuery } from "@tanstack/react-query";
import { getLoginAudits } from "../../api/get/get-login-audits.api";

export const useGetLoginAudits = (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    success?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: [
      "login-audits",
      params.page,
      params.limit,
      params.search,
      params.success,
    ],
    queryFn: () => getLoginAudits(params),
    enabled,
  });
