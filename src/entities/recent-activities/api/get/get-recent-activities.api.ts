import { apiClient } from "@/shared/api/apiClient";

export interface Activity {
  id: number;
  action: string;
  contract: string;
  user: string;
  timestamp: string;
}

export const getActivities = async (): Promise<Activity[]> => {
  const response = await apiClient.get("/activities");
  return response.data;
};
