import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { retryUserContractRequest } from "./user-contract-retry";

const responseError = (status: number) => new AxiosError("error", undefined, undefined, undefined, {
  status, statusText: "error", data: null, headers: {}, config: {} as InternalAxiosRequestConfig,
});

describe("client contract retry", () => {
  it("does not repeatedly request forbidden or missing contracts", () => {
    expect(retryUserContractRequest(0, responseError(403))).toBe(false);
    expect(retryUserContractRequest(0, responseError(404))).toBe(false);
  });

  it("limits retries for temporary server or network errors", () => {
    expect(retryUserContractRequest(0, responseError(500))).toBe(true);
    expect(retryUserContractRequest(1, new Error("network"))).toBe(true);
    expect(retryUserContractRequest(2, responseError(503))).toBe(false);
  });
});
