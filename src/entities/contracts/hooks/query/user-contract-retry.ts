import { isAxiosError } from "axios";

export function retryUserContractRequest(failureCount: number, error: Error) {
  if (failureCount >= 2) return false;
  if (!isAxiosError(error) || !error.response) return true;
  return error.response.status === 429 || error.response.status >= 500;
}
