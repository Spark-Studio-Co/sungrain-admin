import { useQuery } from "@tanstack/react-query";
import { getAttentionCenter } from "../../api/get/get-attention-center.api";

export const useGetAttentionCenter = () =>
  useQuery({
    queryKey: ["attention-center"],
    queryFn: getAttentionCenter,
    refetchInterval: 5 * 60 * 1000,
  });
